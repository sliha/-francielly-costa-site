'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  Users,
  Calendar,
  MessageCircle,
  Euro,
  BarChart3,
  Download,
  ChevronDown,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { rowToAgendamento } from '@/lib/mappers'
import type { Agendamento } from '@/lib/booking'
import { useServicosPrecos } from '@/lib/useServicosPrecos'

const SERVICO_CORES = ['#B76E79', '#C9A96E', '#8E4F58', '#A07840', '#6B7280', '#7E22CE']

function parsePreco(p?: string): number {
  if (!p) return 0
  const match = p.replace(',', '.').match(/[\d.]+/)
  return match ? Number(match[0]) : 0
}

function isPagoOuPosterior(estado: Agendamento['estado']): boolean {
  return estado === 'pago' || estado === 'concluido'
}

function isAtivo(estado: Agendamento['estado']): boolean {
  return estado !== 'cancelado'
}

function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
  if (anterior === 0 && atual === 0) {
    return <span className="text-white/30 text-xs">—</span>
  }
  if (anterior === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
        <ArrowUpRight size={12} />
        novo
      </span>
    )
  }
  const pct = Math.round(((atual - anterior) / anterior) * 100)
  const positivo = pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${positivo ? 'text-emerald-400' : 'text-red-400'}`}>
      {positivo ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(pct)}% vs mês anterior
    </span>
  )
}

interface MesStats {
  totalMarcacoes: number
  receitaTotal: number
  servicoMaisProcurado: string
  novosClientes: number
  clientesRecorrentes: number
  horariosPopulares: { hora: string; count: number }[]
  diasMovimentados: { dia: string; marcacoes: number }[]
  servicosBreakdown: { servico: string; count: number; receita: number; cor: string }[]
}

function emptyStats(): MesStats {
  return {
    totalMarcacoes: 0,
    receitaTotal: 0,
    servicoMaisProcurado: '—',
    novosClientes: 0,
    clientesRecorrentes: 0,
    horariosPopulares: [],
    diasMovimentados: [],
    servicosBreakdown: [],
  }
}

function computeStats(
  todos: Agendamento[],
  inicio: Date,
  fim: Date,
  precos: Record<string, string>,
  emailsAnteriores: Set<string>
): MesStats {
  const mesAgendamentos = todos.filter((a) => {
    if (!isAtivo(a.estado)) return false
    if (!a.data) return false
    try {
      const d = parseISO(a.data)
      return isWithinInterval(d, { start: inicio, end: fim })
    } catch {
      return false
    }
  })

  if (mesAgendamentos.length === 0) return emptyStats()

  // Receita: apenas pagos/concluídos
  const receitaTotal = mesAgendamentos
    .filter((a) => isPagoOuPosterior(a.estado))
    .reduce((sum, a) => sum + parsePreco(precos[a.servicoId]), 0)

  // Serviços
  const servicoMap = new Map<string, { servico: string; count: number; receita: number }>()
  for (const a of mesAgendamentos) {
    const nome = a.servicoNome || 'Outro'
    const cur = servicoMap.get(nome) || { servico: nome, count: 0, receita: 0 }
    cur.count += 1
    if (isPagoOuPosterior(a.estado)) {
      cur.receita += parsePreco(precos[a.servicoId])
    }
    servicoMap.set(nome, cur)
  }
  const servicosOrdenados = Array.from(servicoMap.values()).sort((a, b) => b.count - a.count)
  const servicosBreakdown = servicosOrdenados.map((s, i) => ({
    ...s,
    cor: SERVICO_CORES[i % SERVICO_CORES.length],
  }))

  // Horários populares
  const horarioMap = new Map<string, number>()
  for (const a of mesAgendamentos) {
    if (!a.horaInicio) continue
    horarioMap.set(a.horaInicio, (horarioMap.get(a.horaInicio) || 0) + 1)
  }
  const horariosPopulares = Array.from(horarioMap.entries())
    .map(([hora, count]) => ({ hora, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Dias da semana
  const diaMap = new Map<string, number>()
  for (const a of mesAgendamentos) {
    try {
      const d = parseISO(a.data)
      const dia = format(d, 'EEEE', { locale: ptBR })
      const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1).split('-')[0]
      diaMap.set(diaCap, (diaMap.get(diaCap) || 0) + 1)
    } catch {
      // skip
    }
  }
  const diasMovimentados = Array.from(diaMap.entries())
    .map(([dia, marcacoes]) => ({ dia, marcacoes }))
    .sort((a, b) => b.marcacoes - a.marcacoes)
    .slice(0, 3)

  // Novos vs recorrentes — compara com agendamentos anteriores ao período
  const emailsMes = new Set<string>()
  let novos = 0
  let recorrentes = 0
  for (const a of mesAgendamentos) {
    const email = (a.clienteEmail || '').toLowerCase()
    if (!email) continue
    if (emailsMes.has(email)) continue
    emailsMes.add(email)
    if (emailsAnteriores.has(email)) recorrentes += 1
    else novos += 1
  }

  return {
    totalMarcacoes: mesAgendamentos.length,
    receitaTotal,
    servicoMaisProcurado: servicosOrdenados[0]?.servico || '—',
    novosClientes: novos,
    clientesRecorrentes: recorrentes,
    horariosPopulares,
    diasMovimentados,
    servicosBreakdown,
  }
}

function buildMesesDisponiveis(): { label: string; date: Date }[] {
  const out: { label: string; date: Date }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = subMonths(startOfMonth(now), i)
    const label = format(d, 'MMMM yyyy', { locale: ptBR })
    out.push({ label: label.charAt(0).toUpperCase() + label.slice(1), date: d })
  }
  return out
}

export default function RelatorioPage() {
  const meses = useMemo(buildMesesDisponiveis, [])
  const [mesIndex, setMesIndex] = useState(0)
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const precos = useServicosPrecos()

  useEffect(() => {
    setLoading(true)
    supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: false })
      .order('hora_inicio')
      .then(({ data }) => setAgendamentos((data ?? []).map(rowToAgendamento)), () => setAgendamentos([]))
      .then(() => setLoading(false))
  }, [])

  const mesAtual = meses[mesIndex]
  const mesAnterior = meses[mesIndex + 1]

  const { statsAtual, statsAnterior } = useMemo(() => {
    if (!mesAtual) return { statsAtual: emptyStats(), statsAnterior: emptyStats() }

    const inicioAtual = startOfMonth(mesAtual.date)
    const fimAtual = endOfMonth(mesAtual.date)

    // Emails de clientes com agendamentos antes do mês atual (para detectar recorrentes)
    const emailsAnteriores = new Set<string>()
    for (const a of agendamentos) {
      if (!a.clienteEmail || !a.data) continue
      if (!isAtivo(a.estado)) continue
      try {
        const d = parseISO(a.data)
        if (d < inicioAtual) emailsAnteriores.add(a.clienteEmail.toLowerCase())
      } catch {
        // skip
      }
    }

    const statsAtual = computeStats(agendamentos, inicioAtual, fimAtual, precos, emailsAnteriores)

    let statsAnterior = emptyStats()
    if (mesAnterior) {
      const inicioAnterior = startOfMonth(mesAnterior.date)
      const fimAnterior = endOfMonth(mesAnterior.date)
      const emailsAntesAnterior = new Set<string>()
      for (const a of agendamentos) {
        if (!a.clienteEmail || !a.data) continue
        if (!isAtivo(a.estado)) continue
        try {
          const d = parseISO(a.data)
          if (d < inicioAnterior) emailsAntesAnterior.add(a.clienteEmail.toLowerCase())
        } catch {
          // skip
        }
      }
      statsAnterior = computeStats(agendamentos, inicioAnterior, fimAnterior, precos, emailsAntesAnterior)
    }

    return { statsAtual, statsAnterior }
  }, [agendamentos, mesAtual, mesAnterior, precos])

  const maxHorario = Math.max(1, ...statsAtual.horariosPopulares.map((h) => h.count))
  const maxReceita = Math.max(1, ...statsAtual.servicosBreakdown.map((x) => x.receita))

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Relatório</h1>
          <p className="text-white/40 text-sm mt-0.5">Análise de desempenho</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setMostrarPicker(!mostrarPicker)}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              {mesAtual?.label || '—'}
              <ChevronDown size={14} />
            </button>
            {mostrarPicker && (
              <div className="absolute right-0 top-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-10 min-w-max max-h-64 overflow-y-auto">
                {meses.map((m, idx) => (
                  <button
                    key={m.label}
                    onClick={() => { setMesIndex(idx); setMostrarPicker(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${idx === mesIndex ? 'text-rose-gold' : 'text-white/60'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm px-3 py-2 rounded-xl transition-colors"
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : statsAtual.totalMarcacoes === 0 ? (
        <div className="px-4 md:px-8 pb-8">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <BarChart3 size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm font-medium">Sem dados para {mesAtual?.label}</p>
            <p className="text-white/30 text-xs mt-1">Tenta selecionar outro mês.</p>
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-rose-gold" />
                <p className="text-white/40 text-xs">Marcações</p>
              </div>
              <p className="text-3xl font-bold text-white">{statsAtual.totalMarcacoes}</p>
              <Variacao atual={statsAtual.totalMarcacoes} anterior={statsAnterior.totalMarcacoes} />
            </div>

            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Euro size={14} className="text-golden" />
                <p className="text-white/40 text-xs">Receita</p>
              </div>
              <p className="text-3xl font-bold text-golden">€{statsAtual.receitaTotal.toLocaleString('pt-PT')}</p>
              <Variacao atual={statsAtual.receitaTotal} anterior={statsAnterior.receitaTotal} />
            </div>

            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle size={14} className="text-sky-400" />
                <p className="text-white/40 text-xs">Ticket Médio</p>
              </div>
              <p className="text-3xl font-bold text-white">
                €{statsAtual.totalMarcacoes > 0 ? Math.round(statsAtual.receitaTotal / statsAtual.totalMarcacoes) : 0}
              </p>
              <p className="text-white/30 text-xs mt-0.5">por marcação</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-purple-400" />
                <p className="text-white/40 text-xs">Novos Clientes</p>
              </div>
              <p className="text-3xl font-bold text-white">{statsAtual.novosClientes}</p>
              <p className="text-white/30 text-xs mt-0.5">{statsAtual.clientesRecorrentes} recorrentes</p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
              <Star size={20} className="text-rose-gold" />
            </div>
            <div>
              <p className="text-white/40 text-xs">Serviço Mais Procurado</p>
              <p className="text-white font-semibold text-lg">{statsAtual.servicoMaisProcurado}</p>
            </div>
          </div>

          {statsAtual.servicosBreakdown.length > 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-rose-gold" />
                Receita por Serviço
              </h3>
              <div className="space-y-3">
                {statsAtual.servicosBreakdown.map((s) => {
                  const width = (s.receita / maxReceita) * 100
                  return (
                    <div key={s.servico}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/60 text-sm">{s.servico}</span>
                        <span className="text-golden text-sm font-medium">€{s.receita}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${width}%`, backgroundColor: s.cor }}
                        />
                      </div>
                      <p className="text-white/30 text-xs mt-0.5">{s.count} marcações</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {statsAtual.horariosPopulares.length > 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <Clock size={16} className="text-rose-gold" />
                Horários Mais Procurados
              </h3>
              <div className="space-y-2">
                {statsAtual.horariosPopulares.map((h) => (
                  <div key={h.hora} className="flex items-center gap-3">
                    <span className="text-white/60 text-sm font-mono w-12">{h.hora}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-gold rounded-full transition-all"
                        style={{ width: `${(h.count / maxHorario) * 100}%` }}
                      />
                    </div>
                    <span className="text-white/40 text-xs w-8 text-right">{h.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {statsAtual.diasMovimentados.length > 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-rose-gold" />
                Top Dias Mais Movimentados
              </h3>
              <div className="flex gap-3">
                {statsAtual.diasMovimentados.map((d, idx) => (
                  <div key={d.dia} className={`flex-1 rounded-xl p-3 text-center border ${
                    idx === 0 ? 'border-golden/30 bg-golden/5' : 'border-white/5 bg-white/[0.02]'
                  }`}>
                    {idx === 0 && <span className="text-golden text-xs font-bold">★</span>}
                    <p className={`font-semibold text-lg ${idx === 0 ? 'text-golden' : 'text-white'}`}>
                      {d.marcacoes}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">{d.dia}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(statsAtual.novosClientes > 0 || statsAtual.clientesRecorrentes > 0) && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                <Users size={16} className="text-rose-gold" />
                Novos vs Recorrentes
              </h3>
              <div className="flex gap-3">
                <div className="flex-1 bg-rose-gold/10 rounded-xl p-3 text-center border border-rose-gold/20">
                  <p className="text-2xl font-bold text-rose-gold">{statsAtual.novosClientes}</p>
                  <p className="text-white/40 text-xs mt-0.5">Novos</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                  <p className="text-2xl font-bold text-white">{statsAtual.clientesRecorrentes}</p>
                  <p className="text-white/40 text-xs mt-0.5">Recorrentes</p>
                </div>
              </div>
              {(statsAtual.novosClientes + statsAtual.clientesRecorrentes) > 0 && (
                <>
                  <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-rose-gold"
                      style={{ width: `${(statsAtual.novosClientes / (statsAtual.novosClientes + statsAtual.clientesRecorrentes)) * 100}%` }}
                    />
                    <div className="flex-1 h-full bg-white/20" />
                  </div>
                  <div className="flex justify-between text-xs text-white/30 mt-1">
                    <span>{Math.round((statsAtual.novosClientes / (statsAtual.novosClientes + statsAtual.clientesRecorrentes)) * 100)}% novos</span>
                    <span>{Math.round((statsAtual.clientesRecorrentes / (statsAtual.novosClientes + statsAtual.clientesRecorrentes)) * 100)}% recorrentes</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
