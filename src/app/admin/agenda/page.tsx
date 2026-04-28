'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, PlusCircle, Calendar, Clock, X, Ban,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// TODO: Replace with Firestore query
const mockMarcacoes = [
  { id: '1', clienteNome: 'Ana Silva', servicoNome: 'Microblading', data: new Date(2026, 3, 6), horaInicio: '10:00', estado: 'confirmado', telefone: '912 345 678', valor: 180 },
  { id: '2', clienteNome: 'Marta Santos', servicoNome: 'Micropigmentação Labial', data: new Date(2026, 3, 6), horaInicio: '14:30', estado: 'pendente', telefone: '934 567 890', valor: 150 },
  { id: '3', clienteNome: 'Joana Ferreira', servicoNome: 'Microshading', data: new Date(2026, 3, 7), horaInicio: '16:00', estado: 'confirmado', telefone: '961 234 567', valor: 180 },
  { id: '4', clienteNome: 'Sofia Rodrigues', servicoNome: 'Eyeliner Permanente', data: new Date(2026, 3, 8), horaInicio: '11:00', estado: 'pago', telefone: '910 111 222', valor: 120 },
  { id: '5', clienteNome: 'Carla Mendes', servicoNome: 'Microblading', data: new Date(2026, 3, 10), horaInicio: '09:30', estado: 'confirmado', telefone: '962 333 444', valor: 180 },
  { id: '6', clienteNome: 'Beatriz Lopes', servicoNome: 'FiberBROWS', data: new Date(2026, 4, 5), horaInicio: '10:00', estado: 'pendente', telefone: '935 555 666', valor: 1000 },
]

const estadoConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400' },
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
}

const allEstados = ['todos', 'confirmado', 'pendente', 'pago', 'concluido', 'cancelado']

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

  const handleCancelar = async (agendamentoId: string) => {
    if (!confirm('Cancelar este agendamento? O evento será removido do Google Calendar.')) return
    setCancelandoId(agendamentoId)
    try {
      const res = await fetch('/api/agendamento/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agendamentoId }),
      })
      if (!res.ok) throw new Error('Falha no cancelamento')
    } catch {
      alert('Erro ao cancelar agendamento.')
    } finally {
      setCancelandoId(null)
    }
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = (getDay(monthStart) + 6) % 7

  const dayMarcacoes = mockMarcacoes.filter((m) => isSameDay(m.data, selectedDate))
  const filteredMarcacoes = filterEstado === 'todos' ? dayMarcacoes : dayMarcacoes.filter((m) => m.estado === filterEstado)

  const getDiaBloqueado = (day: Date) =>
    diasBloqueados.find((d) => d.data === format(day, 'yyyy-MM-dd'))

  const getDayDots = (day: Date) => mockMarcacoes.filter((m) => isSameDay(m.data, day)).slice(0, 3)

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
      const entry: Omit<DiaBloqueado, 'id'> = {
        data: blockForm.data,
        motivo: blockForm.motivo || 'Bloqueado',
        bloqueioTotal: blockForm.bloqueioTotal,
        horasBloqueadas: blockForm.bloqueioTotal ? [] : blockForm.horasBloqueadas,
      }
      if (db) {
        const docRef = await addDoc(collection(db, 'diasBloqueados'), {
          ...entry, criadoEm: serverTimestamp(),
        })
        setDiasBloqueados((prev) => [...prev, { id: docRef.id, ...entry }])
      } else {
        setDiasBloqueados((prev) => [...prev, { id: Date.now().toString(), ...entry }])
      }
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

              return (
                <button key={day.toString()} onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-colors ${
                    blocked
                      ? isSelected ? 'bg-red-500/30 text-red-300 font-semibold' : 'bg-red-500/10 text-red-400/70 hover:bg-red-500/20'
                      : isSelected ? 'bg-rose-gold text-white font-semibold'
                      : isTodayDay ? 'bg-rose-gold/20 text-rose-gold font-medium'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {blocked && <Ban size={6} className="mt-0.5 opacity-70" />}
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
        {selectedBlocked && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Ban size={16} className="text-red-400 flex-shrink-0" />
            <div className="min-w-0">
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
          </div>
        )}

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

          {filteredMarcacoes.length === 0 ? (
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

                    <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/5">
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <Clock size={11} />{booking.horaInicio}
                      </div>
                      <div className="text-white/40 text-xs">{booking.telefone}</div>
                      <div className="ml-auto text-golden text-sm font-semibold">€{booking.valor}</div>
                    </div>

                    <div className="flex gap-2 mt-2.5">
                      {booking.estado === 'pendente' && (
                        <button className="flex-1 text-xs bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg py-1.5 transition-colors font-medium">
                          Confirmar
                        </button>
                      )}
                      {booking.estado === 'confirmado' && (
                        <button className="flex-1 text-xs bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 rounded-lg py-1.5 transition-colors font-medium">
                          Marcar Pago
                        </button>
                      )}
                      <button className="flex-1 text-xs bg-white/5 text-white/50 hover:bg-white/10 rounded-lg py-1.5 transition-colors">
                        Editar
                      </button>
                      {booking.estado !== 'cancelado' && booking.estado !== 'concluido' && (
                        <button
                          onClick={() => handleCancelar(booking.id)}
                          disabled={cancelandoId === booking.id}
                          className="text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          {cancelandoId === booking.id ? 'A cancelar...' : 'Cancelar'}
                        </button>
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
    </div>
  )
}
