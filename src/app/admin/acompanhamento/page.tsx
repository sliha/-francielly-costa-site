'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Camera,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  Search,
  Send,
  Plus,
  X,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { subscribeMensagens, getFotosClient } from '@/lib/acompanhamentos.client'
import { rowToAgendamento } from '@/lib/mappers'
import type { Acompanhamento, Mensagem, Foto } from '@/lib/acompanhamentos'
import type { Agendamento } from '@/lib/booking'

function rowToAcompanhamento(r: Record<string, any>): Acompanhamento {
  return {
    id: r.id,
    agendamentoId: r.agendamento_id ?? undefined,
    clienteNome: r.cliente_nome ?? '',
    clienteEmail: r.cliente_email ?? '',
    clienteTelefone: r.cliente_telefone ?? undefined,
    servicoNome: r.servico_nome ?? '',
    dataProcedimento: r.data_procedimento ?? '',
    codigoAcesso: r.codigo_acesso ?? '',
    retoqueData: r.retoque_data ?? undefined,
    retoqueConfirmado: r.retoque_confirmado ?? undefined,
    ultimaAtividadeCliente: r.ultima_atividade_cliente ?? null,
    ultimaAtividadeAdmin: r.ultima_atividade_admin ?? null,
    fechado: r.fechado ?? false,
    criadoEm: r.criado_em ?? undefined,
  }
}

// Replica calcularRetoqueData (30 dias após o procedimento) client-side.
function calcularRetoqueData(dataProcedimento: string): string {
  const d = new Date(dataProcedimento + 'T12:00:00')
  d.setDate(d.getDate() + 30)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Converte timestamp ISO em milissegundos (substitui Timestamp.toMillis()).
function isoToMillis(iso?: string | null): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

export default function AcompanhamentoAdminPage() {
  const [busca, setBusca] = useState('')
  const [lista, setLista] = useState<Acompanhamento[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [fotos, setFotos] = useState<Foto[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviandoMsg, setEnviandoMsg] = useState(false)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [agendamentosConcluidos, setAgendamentosConcluidos] = useState<Agendamento[]>([])
  const [carregandoModal, setCarregandoModal] = useState(false)
  const [criandoId, setCriandoId] = useState<string | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('acompanhamentos')
        .select('*')
        .order('criado_em', { ascending: false })
      setLista((data ?? []).map(rowToAcompanhamento))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Subscribe mensagens do acompanhamento selecionado
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
    if (!selecionadoId) {
      setMensagens([])
      setFotos([])
      return
    }
    unsubRef.current = subscribeMensagens(selecionadoId, setMensagens)
    getFotosClient(selecionadoId).then(setFotos).catch(() => setFotos([]))
    return () => {
      if (unsubRef.current) unsubRef.current()
    }
  }, [selecionadoId])

  const filtrados = lista.filter((a) =>
    a.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    a.servicoNome.toLowerCase().includes(busca.toLowerCase())
  )

  const enviarMensagem = async () => {
    if (!selecionadoId || !novaMensagem.trim() || enviandoMsg) return
    const texto = novaMensagem.trim()
    setEnviandoMsg(true)
    try {
      const { error } = await supabase
        .from('acompanhamento_mensagens')
        .insert({ acompanhamento_id: selecionadoId, de: 'admin', texto })
      if (error) throw error
      await supabase
        .from('acompanhamentos')
        .update({ ultima_atividade_admin: new Date().toISOString() })
        .eq('id', selecionadoId)
      setNovaMensagem('')
    } catch {
      alert('Erro ao enviar mensagem.')
    } finally {
      setEnviandoMsg(false)
    }
  }

  const copiarLink = (codigo: string) => {
    const url = `${window.location.origin}/acompanhamento/${codigo}`
    navigator.clipboard.writeText(url).then(() => {
      alert(`Link copiado:\n${url}`)
    })
  }

  const handleConfirmarRetoque = async (id: string, atual: boolean) => {
    try {
      const { error } = await supabase
        .from('acompanhamentos')
        .update({ retoque_confirmado: !atual })
        .eq('id', id)
      if (error) throw error
      await load()
    } catch {
      alert('Erro ao atualizar retoque.')
    }
  }

  const abrirNovoModal = async () => {
    setShowNovoModal(true)
    setCarregandoModal(true)
    try {
      const { data } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: false })
        .order('hora_inicio')
      const todos = (data ?? []).map(rowToAgendamento)
      const idsExistentes = new Set(lista.map((a) => a.agendamentoId).filter(Boolean))
      const elegiveis = todos.filter((a) => {
        if (a.estado !== 'pago' && a.estado !== 'concluido') return false
        if (idsExistentes.has(a.id)) return false
        return true
      })
      setAgendamentosConcluidos(elegiveis)
    } finally {
      setCarregandoModal(false)
    }
  }

  const criarParaAgendamento = async (a: Agendamento) => {
    if (!a.id) return
    setCriandoId(a.id)
    try {
      // Idempotência: não duplicar se já existe acompanhamento para este agendamento.
      const { data: existente } = await supabase
        .from('acompanhamentos')
        .select('id')
        .eq('agendamento_id', a.id)
        .maybeSingle()
      if (!existente) {
        const codigoAcesso = String(Math.floor(100000 + Math.random() * 900000))
        const { error } = await supabase.from('acompanhamentos').insert({
          agendamento_id: a.id,
          cliente_nome: a.clienteNome,
          cliente_email: a.clienteEmail,
          cliente_telefone: a.clienteTelefone || '',
          servico_nome: a.servicoNome,
          data_procedimento: a.data,
          codigo_acesso: codigoAcesso,
          retoque_data: calcularRetoqueData(a.data),
          retoque_confirmado: false,
          fechado: false,
        })
        if (error) throw error
      }
      await load()
      setShowNovoModal(false)
    } catch {
      alert('Erro ao criar acompanhamento.')
    } finally {
      setCriandoId(null)
    }
  }

  const calcularDia = (dataProcedimento: string): number => {
    try {
      return Math.max(0, differenceInDays(new Date(), parseISO(dataProcedimento)))
    } catch {
      return 0
    }
  }

  const calcularProgresso = (dia: number): number => Math.min(100, Math.round((dia / 30) * 100))

  const precisamRetoque = lista.filter((a) => calcularDia(a.dataProcedimento) >= 28 && !a.retoqueConfirmado && !a.fechado)
  const comMensagensCliente = lista.filter((a) => {
    if (!a.ultimaAtividadeCliente) return false
    if (!a.ultimaAtividadeAdmin) return true
    return isoToMillis(a.ultimaAtividadeCliente) > isoToMillis(a.ultimaAtividadeAdmin)
  })

  const selecionado = lista.find((a) => a.id === selecionadoId) || null

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Acompanhamento</h1>
          <p className="text-white/40 text-sm mt-0.5">Clientes em recuperação pós-procedimento</p>
        </div>
        <button onClick={abrirNovoModal}
          className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-3 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors">
          <Plus size={14} />
          Novo
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {precisamRetoque.length > 0 && (
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-400" />
              <p className="text-amber-400 font-medium text-sm">
                {precisamRetoque.length} cliente(s) prontos para retoque
              </p>
            </div>
            {precisamRetoque.map((a) => (
              <div key={a.id} className="flex items-center justify-between mt-2">
                <p className="text-white/70 text-sm">{a.clienteNome} — {a.servicoNome}</p>
                <button onClick={() => handleConfirmarRetoque(a.id!, !!a.retoqueConfirmado)}
                  className="text-xs bg-amber-400/20 text-amber-400 px-3 py-1 rounded-lg hover:bg-amber-400/30 transition-colors">
                  Marcar Confirmado
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-rose-gold">{lista.filter((a) => !a.fechado).length}</p>
            <p className="text-white/40 text-xs mt-1">Em Recuperação</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{comMensagensCliente.length}</p>
            <p className="text-white/40 text-xs mt-1">Msgs por Ler</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-golden">{lista.filter((a) => a.retoqueConfirmado).length}</p>
            <p className="text-white/40 text-xs mt-1">Retoque Marcado</p>
          </div>
        </div>

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
        ) : filtrados.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <MessageCircle size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              {lista.length === 0 ? 'Sem acompanhamentos. Clica em "Novo" a partir de um agendamento concluído.' : 'Nenhum resultado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((a) => {
              const dia = calcularDia(a.dataProcedimento)
              const progresso = calcularProgresso(dia)
              const expanded = selecionadoId === a.id
              const temMsgCliente = comMensagensCliente.some((c) => c.id === a.id)
              return (
                <div key={a.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setSelecionadoId(expanded ? null : a.id!)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0 relative">
                        <span className="text-rose-gold font-semibold text-sm">{a.clienteNome.charAt(0)}</span>
                        {temMsgCliente && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-gold rounded-full flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">!</span>
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm truncate">{a.clienteNome}</p>
                          {temMsgCliente && (
                            <span className="text-xs bg-rose-gold/20 text-rose-gold px-1.5 py-0.5 rounded-md">Nova msg</span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs">{a.servicoNome} · Dia {dia}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-gold rounded-full" style={{ width: `${progresso}%` }} />
                          </div>
                          <span className="text-white/30 text-xs">{progresso}%</span>
                        </div>
                      </div>

                      <ChevronRight size={16} className={`text-white/20 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {expanded && selecionado?.id === a.id && (
                    <div className="border-t border-white/5 p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-white/30 text-xs">Procedimento</p>
                          <p className="text-white text-sm">
                            {(() => { try { return format(parseISO(a.dataProcedimento), "d MMM yyyy", { locale: ptBR }) } catch { return a.dataProcedimento } })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/30 text-xs">Próxima Sessão</p>
                          <p className={`text-sm ${a.retoqueConfirmado ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {a.retoqueData ? (() => { try { return format(parseISO(a.retoqueData), "d MMM", { locale: ptBR }) } catch { return a.retoqueData } })() : '—'}
                            {a.retoqueConfirmado ? ' ✓' : ' (não confirmada)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/30 text-xs">Telefone</p>
                          <p className="text-white text-sm">{a.clienteTelefone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-white/30 text-xs">Código de Acesso</p>
                          <p className="text-white font-mono text-sm">{a.codigoAcesso}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => copiarLink(a.codigoAcesso)}
                          className="text-xs bg-white/5 text-white/70 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                          Copiar Link
                        </button>
                        <button onClick={() => handleConfirmarRetoque(a.id!, !!a.retoqueConfirmado)}
                          className="text-xs bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-colors">
                          {a.retoqueConfirmado ? 'Desmarcar Retoque' : 'Marcar Retoque Confirmado'}
                        </button>
                      </div>

                      <div>
                        <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                          <MessageCircle size={12} />
                          Chat com {a.clienteNome.split(' ')[0]}
                        </p>
                        <div className="bg-[#111] rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto mb-2">
                          {mensagens.length === 0 ? (
                            <p className="text-white/30 text-xs text-center py-3">Sem mensagens ainda.</p>
                          ) : mensagens.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.de === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                                msg.de === 'admin' ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/70'
                              }`}>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Responder..."
                            value={novaMensagem}
                            onChange={(e) => setNovaMensagem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                            className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                          />
                          <button onClick={enviarMensagem} disabled={enviandoMsg || !novaMensagem.trim()}
                            className="bg-rose-gold rounded-xl px-3 py-2 hover:bg-opacity-90 transition-colors disabled:opacity-50">
                            <Send size={14} className="text-white" />
                          </button>
                        </div>
                      </div>

                      {fotos.length > 0 && (
                        <div>
                          <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                            <Camera size={12} />
                            Fotos da Cliente ({fotos.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {fotos.map((f) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                                <img src={f.url} alt="Foto" className="aspect-square object-cover rounded-lg" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNovoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Novo Acompanhamento</h3>
              <button onClick={() => setShowNovoModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={14} className="text-white/60" />
              </button>
            </div>
            {carregandoModal ? (
              <div className="text-center py-6">
                <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : agendamentosConcluidos.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-6">
                Sem agendamentos pagos/concluídos elegíveis.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-white/40 text-xs mb-2">Seleciona o agendamento:</p>
                {agendamentosConcluidos.map((a) => (
                  <button key={a.id} onClick={() => criarParaAgendamento(a)}
                    disabled={criandoId === a.id}
                    className="w-full text-left bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors disabled:opacity-50">
                    <p className="text-white text-sm font-medium">{a.clienteNome}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {a.servicoNome} · {(() => { try { return format(parseISO(a.data), 'd MMM', { locale: ptBR }) } catch { return a.data } })()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
