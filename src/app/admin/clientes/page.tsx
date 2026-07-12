'use client'
import { useState, useEffect } from 'react'
import { Search, UserPlus, Phone, Mail, Calendar, ChevronRight, RefreshCw, X, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { CAUCAO_ATIVA } from '@/lib/caucao'

interface ClienteRow {
  id: string
  nome: string
  email: string
  telefone: string
  ultimoServico: string
  ultimoAgendamento: string
  totalAgendamentos: number
}

interface Agendamento {
  id: string
  servicoNome: string
  data: string
  horaInicio: string
  estado: string
  caucaoPaga: boolean
  criadoEm?: unknown
}

const estadoConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente_pagamento: { label: 'Pendente', color: 'text-amber-400', icon: <Clock size={12} /> },
  pendente: { label: 'Pendente', color: 'text-amber-400', icon: <Clock size={12} /> },
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', icon: <CheckCircle2 size={12} /> },
  concluido: { label: 'Concluído', color: 'text-blue-400', icon: <CheckCircle2 size={12} /> },
  cancelado: { label: 'Cancelado', color: 'text-red-400', icon: <XCircle size={12} /> },
}

function ClienteModal({ cliente, onClose }: { cliente: ClienteRow; onClose: () => void }) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cliente.email) { setLoading(false); return }
    supabase
      .from('agendamentos')
      .select('*')
      .eq('cliente_email', cliente.email)
      .order('criado_em', { ascending: false })
      .then(({ data }) => {
        setAgendamentos((data ?? []).map((r) => ({
          id: r.id,
          servicoNome: r.servico_nome ?? '',
          data: r.data ?? '',
          horaInicio: r.hora_inicio ?? '',
          estado: r.estado ?? '',
          caucaoPaga: r.caucao_paga ?? false,
          criadoEm: r.criado_em,
        })))
      }, () => {})
      .then(() => setLoading(false))
  }, [cliente.email])

  const formatData = (iso: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch { return iso }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center">
              <span className="text-rose-gold font-bold text-lg">{cliente.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-semibold">{cliente.nome}</p>
              <p className="text-white/40 text-xs">{cliente.totalAgendamentos} marcação(ões)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Contact info */}
        <div className="p-5 space-y-2 border-b border-white/5">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Dados Pessoais</p>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Mail size={14} className="text-white/30" />
            <span className="truncate">{cliente.email}</span>
          </div>
          {cliente.telefone && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Phone size={14} className="text-white/30" />
              <span>{cliente.telefone}</span>
            </div>
          )}
          {cliente.ultimoAgendamento && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Calendar size={14} className="text-white/30" />
              <span>Última visita: {formatData(cliente.ultimoAgendamento)}</span>
            </div>
          )}
          <div className="pt-2">
            <a
              href={`mailto:${cliente.email}?subject=Francielly Costa — Marcação`}
              className="inline-flex items-center gap-2 text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 px-3 py-2 rounded-xl transition-colors"
            >
              <Mail size={12} />
              Enviar mensagem
            </a>
          </div>
        </div>

        {/* Booking history */}
        <div className="p-5">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">Histórico de Marcações</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : agendamentos.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">Sem marcações encontradas</p>
          ) : (
            <div className="space-y-2">
              {agendamentos.map((ag) => {
                const est = estadoConfig[ag.estado] ?? estadoConfig.pendente
                return (
                  <div key={ag.id} className="bg-[#111] rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium">{ag.servicoNome || '—'}</p>
                      <span className={`flex items-center gap-1 text-xs ${est.color}`}>
                        {est.icon} {est.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{formatData(ag.data)}{ag.horaInicio ? ` · ${ag.horaInicio}` : ''}</span>
                      {CAUCAO_ATIVA && (
                        <span className={ag.caucaoPaga ? 'text-emerald-400' : 'text-amber-400'}>
                          {ag.caucaoPaga ? '✓ Caução paga' : 'Caução pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ClienteRow | null>(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error

      const map = new Map<string, ClienteRow>()
      for (const a of data ?? []) {
        const email = (a.cliente_email as string) || ''
        if (!email) continue
        const key = email.toLowerCase()
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            nome: a.cliente_nome || '',
            email: a.cliente_email || '',
            telefone: a.cliente_telefone || '',
            ultimoServico: a.servico_nome || '',
            ultimoAgendamento: a.data || '',
            totalAgendamentos: 1,
          })
        } else {
          const c = map.get(key)!
          c.totalAgendamentos++
        }
      }

      setClientes(Array.from(map.values()))
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatData = (iso: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch { return iso }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Clientes</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {loading ? 'A carregar…' : `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, telefone ou email…"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-white/40 text-sm">
              {search ? 'Nenhum cliente encontrado' : 'Ainda não existem clientes registados'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => setSelected(cliente)}
                className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 hover:border-rose-gold/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-gold font-semibold">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{cliente.nome}</p>
                    <p className="text-white/40 text-xs truncate">{cliente.ultimoServico || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-golden text-sm font-semibold">{cliente.totalAgendamentos}</p>
                    <p className="text-white/30 text-xs">marcaç{cliente.totalAgendamentos === 1 ? 'ão' : 'ões'}</p>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-rose-gold/60 transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 flex-wrap">
                  {cliente.telefone && (
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                      <Phone size={11} />
                      {cliente.telefone}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-white/30 text-xs truncate">
                    <Mail size={11} />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                  {cliente.ultimoAgendamento && (
                    <div className="ml-auto flex items-center gap-1 text-white/25 text-xs flex-shrink-0">
                      <Calendar size={11} />
                      {formatData(cliente.ultimoAgendamento)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ClienteModal cliente={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
