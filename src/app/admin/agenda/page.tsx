'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, PlusCircle, Calendar, Clock, X, Ban, CreditCard, ArrowRightLeft, Globe,
  Mail, Phone, FileText, MailCheck, Globe2, User as UserIcon,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase, getAccessToken } from '@/lib/supabase/client'
import { rowToAgendamento } from '@/lib/mappers'
import type { Agendamento, MetodoPagamento } from '@/lib/booking'
import { useServicosPrecos } from '@/lib/useServicosPrecos'

interface MarcacaoView extends Agendamento {
  dataObj: Date
  valor: number
}

const estadoConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400' },
  pendente_pagamento: { label: 'Aguarda pagamento', color: 'text-orange-400', bg: 'bg-orange-400/10', dot: 'bg-orange-400' },
  pago: { label: 'Pago', color: 'text-sky-400', bg: 'bg-sky-400/10', dot: 'bg-sky-400' },
  concluido: { label: 'Concluído', color: 'text-white/40', bg: 'bg-white/5', dot: 'bg-white/30' },
  cancelado: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400' },
}

interface DiaBloqueado {
  id: string
  data: string // YYYY-MM-DD
  motivo: string
  bloqueioTotal: boolean
  horasBloqueadas: string[]
  origem?: 'manual' | 'google-externo'
}

const allEstados = ['todos', 'confirmado', 'pendente_pagamento', 'pendente', 'pago', 'concluido', 'cancelado']

const allHours = Array.from({ length: 17 }, (_, i) => {
  const h = 9 + Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
}).filter((h) => h <= '18:00')

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterEstado, setFilterEstado] = useState('todos')
  const [diasBloqueados, setDiasBloqueados] = useState<DiaBloqueado[]>([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({
    data: format(new Date(), 'yyyy-MM-dd'),
    motivo: '',
    bloqueioTotal: true,
    horasBloqueadas: [] as string[],
  })
  const [savingBlock, setSavingBlock] = useState(false)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [marcacoes, setMarcacoes] = useState<MarcacaoView[]>([])
  const [loadingMarcacoes, setLoadingMarcacoes] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmManualId, setConfirmManualId] = useState<string | null>(null)
  const [confirmManualMetodo, setConfirmManualMetodo] = useState<MetodoPagamento>('whatsapp')
  const [reagendarId, setReagendarId] = useState<string | null>(null)
  const [reagendarData, setReagendarData] = useState('')
  const [reagendarHora, setReagendarHora] = useState('')
  const [reagendarDuracao, setReagendarDuracao] = useState(90)
  const [reagendarSlots, setReagendarSlots] = useState<Array<{ hora: string; disponivel: boolean }>>([])
  const [reagendarLoading, setReagendarLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pedirConfId, setPedirConfId] = useState<string | null>(null)
  const precos = useServicosPrecos()

  async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
    const token = await getAccessToken()
    if (!token) throw new Error('Não autenticado')
    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }

  const parsePreco = useCallback((p?: string): number => {
    if (!p) return 0
    const match = p.replace(',', '.').match(/[\d.]+/)
    return match ? Number(match[0]) : 0
  }, [])

  const loadMarcacoes = useCallback(async () => {
    setLoadingMarcacoes(true)
    try {
      const { data } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: false })
        .order('hora_inicio')
      const lista = (data ?? []).map(rowToAgendamento)
      const view = lista
        .filter((a) => a.id && a.data && a.horaInicio)
        .map<MarcacaoView>((a) => ({
          ...a,
          dataObj: parseISO(a.data),
          valor: parsePreco(precos[a.servicoId]),
        }))
      setMarcacoes(view)
    } catch {
      setMarcacoes([])
    } finally {
      setLoadingMarcacoes(false)
    }
  }, [precos, parsePreco])

  useEffect(() => { loadMarcacoes() }, [loadMarcacoes])

  // Load blocked days
  useEffect(() => {
    supabase
      .from('dias_bloqueados')
      .select('*')
      .then(({ data }) => {
        setDiasBloqueados(
          (data ?? []).map((d) => ({
            id: d.id,
            data: d.data ?? '',
            motivo: d.motivo ?? '',
            bloqueioTotal: d.bloqueio_total ?? false,
            horasBloqueadas: Array.isArray(d.horas_bloqueadas) ? d.horas_bloqueadas : [],
            origem: d.origem ?? undefined,
          })),
        )
      }, () => {})
  }, [])

  const handleCancelar = async (agendamentoId: string) => {
    if (!confirm('Cancelar este agendamento? O evento será removido do Google Calendar.')) return
    setCancelandoId(agendamentoId)
    try {
      const res = await fetchWithAuth('/api/agendamento/cancelar', {
        method: 'POST',
        body: JSON.stringify({ agendamentoId }),
      })
      if (!res.ok) throw new Error('Falha no cancelamento')
      await loadMarcacoes()
    } catch {
      alert('Erro ao cancelar agendamento.')
    } finally {
      setCancelandoId(null)
    }
  }

  const handleAtualizarEstado = async (id: string, novoEstado: Agendamento['estado']) => {
    setActionId(id)
    try {
      const res = await fetchWithAuth('/api/agendamento/mudar-estado', {
        method: 'POST',
        body: JSON.stringify({ agendamentoId: id, novoEstado }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao atualizar estado.')
        return
      }
      if (data.warning) alert(data.warning)
      await loadMarcacoes()
    } catch {
      alert('Erro ao atualizar estado.')
    } finally {
      setActionId(null)
    }
  }

  const handleConfirmManual = async () => {
    if (!confirmManualId) return
    setSubmitting(true)
    try {
      const res = await fetchWithAuth('/api/agendamento/confirmar-manual', {
        method: 'POST',
        body: JSON.stringify({
          agendamentoId: confirmManualId,
          metodoPagamento: confirmManualMetodo,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao confirmar pagamento.')
        return
      }
      if (data.warning) alert(data.warning)
      setConfirmManualId(null)
      await loadMarcacoes()
    } catch {
      alert('Erro ao confirmar pagamento.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePedirConfirmacao = async (booking: MarcacaoView) => {
    if (!booking.id) return
    if (!booking.clienteEmail) {
      alert('Esta marcação não tem email da cliente.')
      return
    }
    if (!confirm(`Enviar email a ${booking.clienteNome} a pedir que confirme a marcação (sem caução)?\n\nEla terá de responder ao email a confirmar. A marcação só deve ser confirmada na agenda depois dessa resposta.`)) return
    setPedirConfId(booking.id)
    try {
      const res = await fetchWithAuth('/api/admin/agendamento/pedir-confirmacao', {
        method: 'POST',
        body: JSON.stringify({ agendamentoId: booking.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao enviar o pedido de confirmação.')
        return
      }
      alert(`Email enviado para ${data.email}. Assim que a cliente responder a confirmar, use o botão "Confirmar" para pôr a marcação na agenda.`)
    } catch {
      alert('Erro de ligação ao enviar o pedido de confirmação.')
    } finally {
      setPedirConfId(null)
    }
  }

  const openReagendar = async (booking: MarcacaoView) => {
    setReagendarId(booking.id!)
    setReagendarData(booking.data)
    setReagendarHora(booking.horaInicio)
    // Duração real da marcação (horaFim − horaInicio) para a grelha de slots não
    // mostrar horas que o servidor depois rejeita por falta de tempo.
    let dur = 90
    if (booking.horaInicio && booking.horaFim) {
      const [hi, mi] = booking.horaInicio.split(':').map(Number)
      const [hf, mf] = booking.horaFim.split(':').map(Number)
      const diff = hf * 60 + mf - (hi * 60 + mi)
      if (diff > 0) dur = diff
    }
    setReagendarDuracao(dur)
    setReagendarSlots([])
  }

  useEffect(() => {
    if (!reagendarId || !reagendarData) return
    setReagendarLoading(true)
    fetch(`/api/slots?data=${reagendarData}&duracao=${reagendarDuracao}`)
      .then((r) => r.json())
      .then((d) => setReagendarSlots(d.slots || []))
      .catch(() => setReagendarSlots([]))
      .finally(() => setReagendarLoading(false))
  }, [reagendarId, reagendarData, reagendarDuracao])

  const handleReagendar = async () => {
    if (!reagendarId || !reagendarData || !reagendarHora) return
    setSubmitting(true)
    try {
      const res = await fetchWithAuth('/api/agendamento/reagendar', {
        method: 'POST',
        body: JSON.stringify({
          agendamentoId: reagendarId,
          novaData: reagendarData,
          novaHoraInicio: reagendarHora,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.conflito || data.error || 'Erro ao reagendar.')
        return
      }
      if (data.warning) alert(data.warning)
      setReagendarId(null)
      await loadMarcacoes()
    } catch {
      alert('Erro ao reagendar.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApagarBloqueio = async (docId: string) => {
    if (!confirm('Remover este bloqueio? O evento BLOQUEADO será apagado do Google Calendar.')) return
    try {
      const res = await fetchWithAuth('/api/dia-bloqueado/apagar', {
        method: 'POST',
        body: JSON.stringify({ docId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao remover bloqueio.')
        return
      }
      setDiasBloqueados((prev) => prev.filter((d) => d.id !== docId))
    } catch {
      alert('Erro ao remover bloqueio.')
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = (getDay(monthStart) + 6) % 7

  const dayMarcacoes = marcacoes.filter((m) => isSameDay(m.dataObj, selectedDate))
  const filteredMarcacoes = filterEstado === 'todos' ? dayMarcacoes : dayMarcacoes.filter((m) => m.estado === filterEstado)

  const getDiaBloqueado = (day: Date) =>
    diasBloqueados.find((d) => d.data === format(day, 'yyyy-MM-dd'))

  const getDayDots = (day: Date) => marcacoes.filter((m) => isSameDay(m.dataObj, day)).slice(0, 3)

  const toggleHora = (hora: string) => {
    setBlockForm((f) => ({
      ...f,
      horasBloqueadas: f.horasBloqueadas.includes(hora)
        ? f.horasBloqueadas.filter((h) => h !== hora)
        : [...f.horasBloqueadas, hora],
    }))
  }

  const handleSaveBlock = async () => {
    setSavingBlock(true)
    try {
      const res = await fetchWithAuth('/api/dia-bloqueado/criar', {
        method: 'POST',
        body: JSON.stringify({
          data: blockForm.data,
          motivo: blockForm.motivo || 'Bloqueado',
          bloqueioTotal: blockForm.bloqueioTotal,
          horasBloqueadas: blockForm.bloqueioTotal ? [] : blockForm.horasBloqueadas,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao guardar bloqueio.')
        return
      }
      setDiasBloqueados((prev) => [
        ...prev,
        {
          id: data.docId,
          data: blockForm.data,
          motivo: blockForm.motivo || 'Bloqueado',
          bloqueioTotal: blockForm.bloqueioTotal,
          horasBloqueadas: blockForm.bloqueioTotal ? [] : blockForm.horasBloqueadas,
        },
      ])
      if (data.warning) alert(data.warning)
      setShowBlockModal(false)
      setBlockForm({ data: format(new Date(), 'yyyy-MM-dd'), motivo: '', bloqueioTotal: true, horasBloqueadas: [] })
    } catch {
      alert('Erro ao guardar bloqueio.')
    } finally {
      setSavingBlock(false)
    }
  }

  const selectedBlocked = getDiaBloqueado(selectedDate)

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Agenda</h1>
          <p className="text-white/40 text-xs mt-0.5 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setBlockForm((f) => ({ ...f, data: format(selectedDate, 'yyyy-MM-dd') })); setShowBlockModal(true) }}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl font-medium transition-colors">
            <Ban size={13} />
            Bloquear
          </button>
          <Link href="/admin/agenda/nova"
            className="flex items-center gap-1.5 bg-rose-gold text-white text-xs px-3 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors">
            <PlusCircle size={13} />
            Nova
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 pt-4 space-y-4">
        {/* Calendar */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <ChevronLeft size={14} className="text-white/60" />
            </button>
            <span className="text-white font-medium text-sm capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <ChevronRight size={14} className="text-white/60" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="text-center text-white/30 text-[11px] font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const dots = getDayDots(day)
              const isSelected = isSameDay(day, selectedDate)
              const isTodayDay = isToday(day)
              const blocked = getDiaBloqueado(day)
              const isExternal = blocked?.origem === 'google-externo'

              return (
                <button key={day.toString()} onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-colors ${
                    blocked
                      ? isExternal
                        ? isSelected ? 'bg-white/20 text-white/90 font-semibold' : 'bg-white/10 text-white/60 hover:bg-white/15'
                        : isSelected ? 'bg-red-500/30 text-red-300 font-semibold' : 'bg-red-500/10 text-red-400/70 hover:bg-red-500/20'
                      : isSelected ? 'bg-rose-gold text-white font-semibold'
                      : isTodayDay ? 'bg-rose-gold/20 text-rose-gold font-medium'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {blocked && (isExternal
                    ? <Globe size={6} className="mt-0.5 opacity-70" />
                    : <Ban size={6} className="mt-0.5 opacity-70" />
                  )}
                  {!blocked && dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((m) => (
                        <span key={m.id}
                          className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : estadoConfig[m.estado]?.dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Blocked day notice */}
        {selectedBlocked && (selectedBlocked.origem === 'google-externo' ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Globe size={16} className="text-white/60 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-white/80 text-sm font-medium">EXTERNO (Google Calendar) — {selectedBlocked.motivo}</p>
              {!selectedBlocked.bloqueioTotal && selectedBlocked.horasBloqueadas.length > 0 && (
                <p className="text-white/40 text-xs mt-0.5">
                  Horas: {selectedBlocked.horasBloqueadas.join(', ')}
                </p>
              )}
              <p className="text-white/40 text-xs mt-1">Edita ou apaga este evento diretamente no Google Calendar.</p>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Ban size={16} className="text-red-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-red-400 text-sm font-medium">
                {selectedBlocked.bloqueioTotal ? 'Dia inteiro bloqueado' : 'Horários parcialmente bloqueados'}
              </p>
              <p className="text-red-400/60 text-xs">{selectedBlocked.motivo}</p>
              {!selectedBlocked.bloqueioTotal && selectedBlocked.horasBloqueadas.length > 0 && (
                <p className="text-red-400/60 text-xs mt-0.5">
                  Horas: {selectedBlocked.horasBloqueadas.join(', ')}
                </p>
              )}
            </div>
            <button
              onClick={() => handleApagarBloqueio(selectedBlocked.id)}
              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg px-3 py-1.5 transition-colors font-medium flex-shrink-0"
            >
              Remover
            </button>
          </div>
        ))}

        {/* Selected date bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5">
              <Calendar size={13} className="text-rose-gold" />
              {isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              <span className="text-white/30 font-normal">({dayMarcacoes.length})</span>
            </h2>
            <div className="flex gap-1 overflow-x-auto">
              {allEstados.map((e) => (
                <button key={e} onClick={() => setFilterEstado(e)}
                  className={`text-[11px] px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                    filterEstado === e ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
                  }`}>
                  {e === 'todos' ? 'Todos' : estadoConfig[e]?.label}
                </button>
              ))}
            </div>
          </div>

          {loadingMarcacoes ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-white/5">
              <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredMarcacoes.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center border border-white/5">
              <Calendar size={24} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">
                {dayMarcacoes.length === 0 ? 'Sem marcações para este dia' : 'Nenhuma marcação com este estado'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMarcacoes.map((booking) => {
                const status = estadoConfig[booking.estado] ?? estadoConfig.pendente
                return (
                  <div key={booking.id} className="bg-[#1A1A1A] rounded-2xl p-3 border border-white/5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-rose-gold font-semibold text-xs">{booking.clienteNome.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{booking.clienteNome}</p>
                          <p className="text-white/40 text-xs truncate">{booking.servicoNome}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${status.color} ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1.5">
                      {/* Hora + origem + valor */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-white/50 text-xs">
                          <Clock size={11} />{booking.horaInicio}{booking.horaFim ? ` - ${booking.horaFim}` : ''}
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                          {booking.criadoPor === 'cliente' ? (
                            <><Globe2 size={11} /> Feito no site</>
                          ) : booking.criadoPor === 'ia' ? (
                            <><MailCheck size={11} /> Sofia (assistente)</>
                          ) : (
                            <><UserIcon size={11} /> Manual (admin)</>
                          )}
                        </span>
                        {booking.valor > 0 && (
                          <div className="ml-auto text-golden text-sm font-semibold">€{booking.valor}</div>
                        )}
                      </div>

                      {/* Dados que a cliente introduziu */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {booking.clienteTelefone && (
                          <a href={`tel:${booking.clienteTelefone}`}
                            className="flex items-center gap-1 text-white/50 hover:text-rose-gold text-xs transition-colors">
                            <Phone size={11} />{booking.clienteTelefone}
                          </a>
                        )}
                        {booking.clienteEmail && (
                          <a href={`mailto:${booking.clienteEmail}`}
                            className="flex items-center gap-1 text-white/50 hover:text-rose-gold text-xs transition-colors break-all">
                            <Mail size={11} />{booking.clienteEmail}
                          </a>
                        )}
                      </div>

                      {/* Notas / observações da cliente */}
                      {booking.notas && (
                        <div className="flex items-start gap-1.5 text-white/50 text-xs bg-white/5 rounded-lg px-2.5 py-2">
                          <FileText size={12} className="flex-shrink-0 mt-0.5 text-white/30" />
                          <span className="whitespace-pre-wrap break-words">{booking.notas}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      {(booking.estado === 'pendente' || booking.estado === 'pendente_pagamento') && (
                        <>
                          <button
                            onClick={() => handleAtualizarEstado(booking.id!, 'confirmado')}
                            disabled={actionId === booking.id}
                            className="flex-1 text-xs bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg py-1.5 transition-colors font-medium disabled:opacity-50"
                          >
                            {actionId === booking.id ? '...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmManualId(booking.id!)
                              setConfirmManualMetodo('whatsapp')
                            }}
                            className="text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 rounded-lg px-3 py-1.5 transition-colors font-medium flex items-center gap-1"
                          >
                            <CreditCard size={11} /> Pagamento Manual
                          </button>
                          <button
                            onClick={() => handlePedirConfirmacao(booking)}
                            disabled={pedirConfId === booking.id || !booking.clienteEmail}
                            title={!booking.clienteEmail ? 'Sem email da cliente' : 'Enviar email a pedir confirmação (sem caução)'}
                            className="text-xs bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 rounded-lg px-3 py-1.5 transition-colors font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            <MailCheck size={11} /> {pedirConfId === booking.id ? 'A enviar...' : 'Pedir confirmação'}
                          </button>
                        </>
                      )}
                      {booking.estado === 'confirmado' && (
                        <button
                          onClick={() => handleAtualizarEstado(booking.id!, 'pago')}
                          disabled={actionId === booking.id}
                          className="flex-1 text-xs bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 rounded-lg py-1.5 transition-colors font-medium disabled:opacity-50"
                        >
                          {actionId === booking.id ? '...' : 'Marcar Pago'}
                        </button>
                      )}
                      {booking.estado === 'pago' && (
                        <button
                          onClick={() => handleAtualizarEstado(booking.id!, 'concluido')}
                          disabled={actionId === booking.id}
                          className="flex-1 text-xs bg-white/10 text-white/70 hover:bg-white/20 rounded-lg py-1.5 transition-colors font-medium disabled:opacity-50"
                        >
                          {actionId === booking.id ? '...' : 'Concluir'}
                        </button>
                      )}
                      {booking.estado !== 'cancelado' && booking.estado !== 'concluido' && (
                        <>
                          <button
                            onClick={() => openReagendar(booking)}
                            className="text-xs bg-white/10 text-white/70 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                          >
                            <ArrowRightLeft size={11} /> Reagendar
                          </button>
                          <button
                            onClick={() => handleCancelar(booking.id!)}
                            disabled={cancelandoId === booking.id}
                            className="text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                          >
                            {cancelandoId === booking.id ? 'A cancelar...' : 'Cancelar'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Block day modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Ban size={14} className="text-red-400" /> Bloquear Dia / Horário
              </h3>
              <button onClick={() => setShowBlockModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={14} className="text-white/60" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Data</label>
                <input type="date" value={blockForm.data}
                  onChange={(e) => setBlockForm((f) => ({ ...f, data: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 [color-scheme:dark]" />
              </div>

              <div>
                <label className="text-white/40 text-xs mb-1 block">Motivo (opcional)</label>
                <input type="text" value={blockForm.motivo} placeholder="Folga, feriado, formação..."
                  onChange={(e) => setBlockForm((f) => ({ ...f, motivo: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 placeholder:text-white/20" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setBlockForm((f) => ({ ...f, bloqueioTotal: true }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${blockForm.bloqueioTotal ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                  Dia Inteiro
                </button>
                <button onClick={() => setBlockForm((f) => ({ ...f, bloqueioTotal: false }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${!blockForm.bloqueioTotal ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                  Horas Específicas
                </button>
              </div>

              {!blockForm.bloqueioTotal && (
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">Selecionar horas a bloquear</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                    {allHours.map((h) => (
                      <button key={h} onClick={() => toggleHora(h)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          blockForm.horasBloqueadas.includes(h)
                            ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleSaveBlock} disabled={savingBlock}
              className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {savingBlock && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {savingBlock ? 'A guardar...' : 'Confirmar Bloqueio'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmar Pagamento Manual modal */}
      {confirmManualId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <CreditCard size={14} className="text-rose-gold" /> Confirmar Pagamento Manual
              </h3>
              <button onClick={() => setConfirmManualId(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={14} className="text-white/60" />
              </button>
            </div>
            <p className="text-white/50 text-xs mb-3">Como foi efetuado o pagamento?</p>
            <select value={confirmManualMetodo}
              onChange={(e) => setConfirmManualMetodo(e.target.value as MetodoPagamento)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 mb-4">
              <option value="whatsapp" className="bg-[#1A1A1A]">WhatsApp / Outro link</option>
              <option value="transferencia" className="bg-[#1A1A1A]">Transferência bancária</option>
              <option value="mbway" className="bg-[#1A1A1A]">MB Way</option>
              <option value="dinheiro" className="bg-[#1A1A1A]">Dinheiro</option>
              <option value="outro" className="bg-[#1A1A1A]">Outro</option>
            </select>
            <button onClick={handleConfirmManual} disabled={submitting}
              className="w-full bg-rose-gold text-white py-3 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'A confirmar...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      )}

      {/* Reagendar modal */}
      {reagendarId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <ArrowRightLeft size={14} className="text-rose-gold" /> Reagendar
              </h3>
              <button onClick={() => setReagendarId(null)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={14} className="text-white/60" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Nova data</label>
                <input type="date" value={reagendarData}
                  onChange={(e) => { setReagendarData(e.target.value); setReagendarHora('') }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1.5 block">Nova hora</label>
                {reagendarLoading ? (
                  <div className="text-white/40 text-xs py-2">A carregar slots...</div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                    {reagendarSlots.length === 0 && <p className="col-span-4 text-white/40 text-xs">Sem slots disponíveis.</p>}
                    {reagendarSlots.map((s) => (
                      <button key={s.hora} type="button" disabled={!s.disponivel}
                        onClick={() => setReagendarHora(s.hora)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          reagendarHora === s.hora ? 'bg-rose-gold text-white'
                            : s.disponivel ? 'bg-white/5 text-white/70 hover:bg-white/10'
                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}>
                        {s.hora}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleReagendar} disabled={submitting || !reagendarHora}
              className="w-full mt-4 bg-rose-gold text-white py-3 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'A reagendar...' : 'Confirmar Novo Horário'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
