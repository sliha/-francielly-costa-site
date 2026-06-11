'use client'

import { useState, useEffect, useCallback } from 'react'
import { Video, ExternalLink, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import type { ConsultaVirtual } from '@/lib/consultasVirtuais'

function rowToConsulta(r: Record<string, any>): ConsultaVirtual {
  return {
    id: r.id,
    clienteNome: r.cliente_nome ?? '',
    clienteTelefone: r.cliente_telefone ?? '',
    clienteEmail: r.cliente_email ?? '',
    servicoInteresse: r.servico_interesse ?? '',
    data: r.data ?? '',
    hora: r.hora ?? '',
    duvida: r.duvida ?? undefined,
    meetLink: r.meet_link ?? undefined,
    googleEventId: r.google_event_id ?? undefined,
    estado: r.estado,
    criadoEm: r.criado_em ?? undefined,
  }
}

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  confirmada: { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  concluida: { label: 'Concluída', color: 'text-white/40', bg: 'bg-white/5' },
  cancelada: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-400/10' },
}

export default function ConsultasVirtuaisAdminPage() {
  const [consultas, setConsultas] = useState<ConsultaVirtual[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('consultas_virtuais')
        .select('*')
        .order('data', { ascending: false })
      setConsultas((data ?? []).map(rowToConsulta))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtradas = consultas.filter((c) =>
    c.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    c.servicoInteresse.toLowerCase().includes(busca.toLowerCase())
  )

  const setEstado = async (id: string, estado: ConsultaVirtual['estado']) => {
    setActionId(id)
    try {
      const { error } = await supabase.from('consultas_virtuais').update({ estado }).eq('id', id)
      if (error) throw error
      await load()
    } catch {
      alert('Erro ao atualizar estado.')
    } finally {
      setActionId(null)
    }
  }

  const hojeStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const consultasHoje = consultas.filter((c) => c.data === hojeStr && c.estado !== 'concluida' && c.estado !== 'cancelada')

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Consultas Virtuais</h1>
          <p className="text-white/40 text-sm mt-0.5">Videochamadas de 15 minutos via Google Meet</p>
        </div>
        <a href="/consulta-virtual" target="_blank" rel="noopener noreferrer"
          className="text-xs bg-white/5 border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5">
          <ExternalLink size={12} />
          Ver página pública
        </a>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{consultas.filter((c) => c.estado === 'pendente').length}</p>
            <p className="text-white/40 text-xs mt-1">Pendentes</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{consultas.filter((c) => c.estado === 'confirmada').length}</p>
            <p className="text-white/40 text-xs mt-1">Confirmadas</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-white/40">{consultas.filter((c) => c.estado === 'concluida').length}</p>
            <p className="text-white/40 text-xs mt-1">Concluídas</p>
          </div>
        </div>

        {consultasHoje.length > 0 && (
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-emerald-400" />
              <p className="text-emerald-400 font-medium text-sm">
                {consultasHoje.length} consulta(s) virtual(ais) hoje!
              </p>
            </div>
            {consultasHoje.map((c) => (
              <div key={c.id} className="mt-2 flex items-center justify-between">
                <p className="text-white/70 text-sm">{c.clienteNome} às {c.hora}</p>
                {c.meetLink && (
                  <a href={c.meetLink} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <Video size={12} />Entrar no Meet
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Pesquisar cliente ou serviço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <Video size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              {consultas.length === 0 ? 'Sem consultas virtuais ainda.' : 'Nenhum resultado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((c) => {
              const status = estadoConfig[c.estado] || estadoConfig.pendente
              const isExpanded = selecionada === c.id
              const dataFmt = (() => { try { return format(parseISO(c.data), 'd MMM', { locale: ptBR }) } catch { return c.data } })()
              return (
                <div key={c.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setSelecionada(isExpanded ? null : c.id!)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/20 to-golden/10 flex items-center justify-center flex-shrink-0">
                        <Video size={16} className="text-rose-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{c.clienteNome}</p>
                        <p className="text-white/40 text-xs">{c.servicoInteresse}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-white/60 text-xs">{dataFmt}</p>
                          <p className="text-white/40 text-xs">{c.hora}</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>{status.label}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/5 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-white/30 text-xs">Telefone</p>
                          <p className="text-white text-sm">{c.clienteTelefone}</p>
                        </div>
                        <div>
                          <p className="text-white/30 text-xs">Email</p>
                          <p className="text-white text-sm truncate">{c.clienteEmail}</p>
                        </div>
                      </div>

                      {c.duvida && (
                        <div className="bg-white/[0.03] rounded-xl p-3">
                          <p className="text-white/30 text-xs mb-1">Dúvida / Informação</p>
                          <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{c.duvida}</p>
                        </div>
                      )}

                      {c.meetLink && (
                        <div>
                          <p className="text-white/30 text-xs mb-1.5">Link Google Meet</p>
                          <a href={c.meetLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-xl px-3 py-2.5 text-sm hover:bg-emerald-400/20 transition-colors">
                            <Video size={14} />
                            <span className="truncate">{c.meetLink}</span>
                            <ExternalLink size={12} className="flex-shrink-0" />
                          </a>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {c.estado === 'pendente' && (
                          <button onClick={() => setEstado(c.id!, 'confirmada')} disabled={actionId === c.id}
                            className="flex-1 text-xs bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg py-2 transition-colors font-medium disabled:opacity-50">
                            {actionId === c.id ? '...' : 'Confirmar'}
                          </button>
                        )}
                        {c.estado === 'confirmada' && (
                          <button onClick={() => setEstado(c.id!, 'concluida')} disabled={actionId === c.id}
                            className="flex-1 text-xs bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 rounded-lg py-2 transition-colors font-medium disabled:opacity-50">
                            {actionId === c.id ? '...' : 'Marcar Concluída'}
                          </button>
                        )}
                        {c.estado !== 'cancelada' && c.estado !== 'concluida' && (
                          <button onClick={() => setEstado(c.id!, 'cancelada')} disabled={actionId === c.id}
                            className="text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
