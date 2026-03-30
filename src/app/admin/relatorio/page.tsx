'use client'
import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
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

const meses = [
  'Janeiro 2026', 'Fevereiro 2026', 'Março 2026',
]

const dadosRelatorio = {
  mes: 'Março 2026',
  totalMarcacoes: 24,
  totalMarcacoesAnterior: 19,
  taxaConversaoChat: 68,
  taxaConversaoChatAnterior: 55,
  servicoMaisProcurado: 'Microblading',
  receitaTotal: 3960,
  receitaTotalAnterior: 3100,
  novosClientes: 14,
  clientesRecorrentes: 10,
  horariosPopulares: [
    { hora: '10:00', count: 8 },
    { hora: '14:30', count: 6 },
    { hora: '11:00', count: 5 },
    { hora: '16:00', count: 3 },
    { hora: '09:00', count: 2 },
  ],
  diasMovimentados: [
    { dia: 'Quinta', marcacoes: 6 },
    { dia: 'Sábado', marcacoes: 5 },
    { dia: 'Terça', marcacoes: 4 },
  ],
  servicosBreakdown: [
    { servico: 'Microblading', count: 10, receita: 1800, cor: '#B76E79' },
    { servico: 'Micropigmentação Labial', count: 6, receita: 900, cor: '#C9A96E' },
    { servico: 'Microshading', count: 5, receita: 900, cor: '#8E4F58' },
    { servico: 'Eyeliner Permanente', count: 3, receita: 360, cor: '#A07840' },
  ],
}

function Variacao({ atual, anterior, prefix = '' }: { atual: number; anterior: number; prefix?: string }) {
  const pct = Math.round(((atual - anterior) / anterior) * 100)
  const positivo = pct >= 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${positivo ? 'text-emerald-400' : 'text-red-400'}`}>
      {positivo ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(pct)}% vs mês anterior
    </span>
  )
}

export default function RelatorioPage() {
  const [mesSelecionado, setMesSelecionado] = useState('Março 2026')
  const [mostrarPicker, setMostrarPicker] = useState(false)

  const maxHorario = Math.max(...dadosRelatorio.horariosPopulares.map(h => h.count))

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Relatório</h1>
          <p className="text-white/40 text-sm mt-0.5">Análise de desempenho</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de mês */}
          <div className="relative">
            <button
              onClick={() => setMostrarPicker(!mostrarPicker)}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              {mesSelecionado}
              <ChevronDown size={14} />
            </button>
            {mostrarPicker && (
              <div className="absolute right-0 top-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden z-10 min-w-max">
                {meses.map(m => (
                  <button
                    key={m}
                    onClick={() => { setMesSelecionado(m); setMostrarPicker(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${m === mesSelecionado ? 'text-rose-gold' : 'text-white/60'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm px-3 py-2 rounded-xl transition-colors">
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* KPIs principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={14} className="text-rose-gold" />
              <p className="text-white/40 text-xs">Marcações</p>
            </div>
            <p className="text-3xl font-bold text-white">{dadosRelatorio.totalMarcacoes}</p>
            <Variacao atual={dadosRelatorio.totalMarcacoes} anterior={dadosRelatorio.totalMarcacoesAnterior} />
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Euro size={14} className="text-golden" />
              <p className="text-white/40 text-xs">Receita</p>
            </div>
            <p className="text-3xl font-bold text-golden">€{dadosRelatorio.receitaTotal.toLocaleString('pt-PT')}</p>
            <Variacao atual={dadosRelatorio.receitaTotal} anterior={dadosRelatorio.receitaTotalAnterior} />
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={14} className="text-sky-400" />
              <p className="text-white/40 text-xs">Conversão Chat→Marcação</p>
            </div>
            <p className="text-3xl font-bold text-white">{dadosRelatorio.taxaConversaoChat}%</p>
            <Variacao atual={dadosRelatorio.taxaConversaoChat} anterior={dadosRelatorio.taxaConversaoChatAnterior} />
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-purple-400" />
              <p className="text-white/40 text-xs">Novos Clientes</p>
            </div>
            <p className="text-3xl font-bold text-white">{dadosRelatorio.novosClientes}</p>
            <p className="text-white/30 text-xs mt-0.5">{dadosRelatorio.clientesRecorrentes} recorrentes</p>
          </div>
        </div>

        {/* Serviço mais procurado */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-gold/10 flex items-center justify-center flex-shrink-0">
            <Star size={20} className="text-rose-gold" />
          </div>
          <div>
            <p className="text-white/40 text-xs">Serviço Mais Procurado</p>
            <p className="text-white font-semibold text-lg">{dadosRelatorio.servicoMaisProcurado}</p>
          </div>
        </div>

        {/* Breakdown por serviço */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-rose-gold" />
            Receita por Serviço
          </h3>
          <div className="space-y-3">
            {dadosRelatorio.servicosBreakdown.map(s => {
              const maxReceita = Math.max(...dadosRelatorio.servicosBreakdown.map(x => x.receita))
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

        {/* Horários populares */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
            <Clock size={16} className="text-rose-gold" />
            Horários Mais Procurados
          </h3>
          <div className="space-y-2">
            {dadosRelatorio.horariosPopulares.map(h => (
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

        {/* Dias mais movimentados */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-rose-gold" />
            Top 3 Dias Mais Movimentados
          </h3>
          <div className="flex gap-3">
            {dadosRelatorio.diasMovimentados.map((d, idx) => (
              <div key={d.dia} className={`flex-1 rounded-xl p-3 text-center border ${
                idx === 0 ? 'border-golden/30 bg-golden/5' : 'border-white/5 bg-white/[0.02]'
              }`}>
                {idx === 0 && <span className="text-golden text-xs font-bold">🏆</span>}
                <p className={`font-semibold text-lg ${idx === 0 ? 'text-golden' : 'text-white'}`}>
                  {d.marcacoes}
                </p>
                <p className="text-white/40 text-xs mt-0.5">{d.dia}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clientes: novos vs recorrentes */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
            <Users size={16} className="text-rose-gold" />
            Novos vs Recorrentes
          </h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-rose-gold/10 rounded-xl p-3 text-center border border-rose-gold/20">
              <p className="text-2xl font-bold text-rose-gold">{dadosRelatorio.novosClientes}</p>
              <p className="text-white/40 text-xs mt-0.5">Novas</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{dadosRelatorio.clientesRecorrentes}</p>
              <p className="text-white/40 text-xs mt-0.5">Recorrentes</p>
            </div>
          </div>
          {/* Barra proporcional */}
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-rose-gold"
              style={{ width: `${(dadosRelatorio.novosClientes / dadosRelatorio.totalMarcacoes) * 100}%` }}
            />
            <div className="flex-1 h-full bg-white/20" />
          </div>
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>{Math.round((dadosRelatorio.novosClientes / dadosRelatorio.totalMarcacoes) * 100)}% novas</span>
            <span>{Math.round((dadosRelatorio.clientesRecorrentes / dadosRelatorio.totalMarcacoes) * 100)}% recorrentes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
