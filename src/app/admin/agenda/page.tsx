'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// TODO: Replace with Firestore query — collection('marcacoes').orderBy('data')
const mockMarcacoes = [
  { id: '1', clienteNome: 'Ana Silva', servicoNome: 'Microblading', data: new Date(2026, 2, 30), horaInicio: '10:00', estado: 'confirmado', telefone: '912 345 678', valor: 180 },
  { id: '2', clienteNome: 'Marta Santos', servicoNome: 'Micropigmentação Labial', data: new Date(2026, 2, 30), horaInicio: '14:30', estado: 'pendente', telefone: '934 567 890', valor: 150 },
  { id: '3', clienteNome: 'Joana Ferreira', servicoNome: 'Microshading', data: new Date(2026, 2, 30), horaInicio: '16:00', estado: 'confirmado', telefone: '961 234 567', valor: 180 },
  { id: '4', clienteNome: 'Sofia Rodrigues', servicoNome: 'Eyeliner Permanente', data: new Date(2026, 3, 2), horaInicio: '11:00', estado: 'pago', telefone: '910 111 222', valor: 120 },
  { id: '5', clienteNome: 'Carla Mendes', servicoNome: 'Microblading', data: new Date(2026, 3, 5), horaInicio: '09:30', estado: 'confirmado', telefone: '962 333 444', valor: 180 },
  { id: '6', clienteNome: 'Beatriz Lopes', servicoNome: 'Micropigmentação Labial', data: new Date(2026, 3, 7), horaInicio: '15:00', estado: 'pendente', telefone: '935 555 666', valor: 150 },
  { id: '7', clienteNome: 'Inês Cardoso', servicoNome: 'Microshading', data: new Date(2026, 3, 10), horaInicio: '10:00', estado: 'concluido', telefone: '913 777 888', valor: 180 },
  { id: '8', clienteNome: 'Raquel Pinto', servicoNome: 'Microblading', data: new Date(2026, 3, 14), horaInicio: '14:00', estado: 'cancelado', telefone: '937 999 000', valor: 180 },
  { id: '9', clienteNome: 'Filipa Costa', servicoNome: 'Eyeliner Permanente', data: new Date(2026, 3, 17), horaInicio: '11:30', estado: 'confirmado', telefone: '914 123 456', valor: 120 },
  { id: '10', clienteNome: 'Teresa Nunes', servicoNome: 'Microblading', data: new Date(2026, 3, 21), horaInicio: '09:00', estado: 'confirmado', telefone: '963 456 789', valor: 180 },
]

const estadoConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400' },
  pago: { label: 'Pago', color: 'text-sky-400', bg: 'bg-sky-400/10', dot: 'bg-sky-400' },
  concluido: { label: 'Concluído', color: 'text-white/40', bg: 'bg-white/5', dot: 'bg-white/30' },
  cancelado: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400' },
}

const allEstados = ['todos', 'confirmado', 'pendente', 'pago', 'concluido', 'cancelado']

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterEstado, setFilterEstado] = useState('todos')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start of calendar to Monday-aligned grid
  const startPadding = (getDay(monthStart) + 6) % 7

  const dayMarcacoes = mockMarcacoes.filter((m) => isSameDay(m.data, selectedDate))
  const filteredMarcacoes =
    filterEstado === 'todos'
      ? dayMarcacoes
      : dayMarcacoes.filter((m) => m.estado === filterEstado)

  const getDayDots = (day: Date) => {
    const marcacoes = mockMarcacoes.filter((m) => isSameDay(m.data, day))
    return marcacoes.slice(0, 3)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Agenda</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <Link
          href="/admin/agenda/nova"
          className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors"
        >
          <PlusCircle size={16} />
          Nova
        </Link>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Calendar */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={16} className="text-white/60" />
            </button>
            <span className="text-white font-medium text-sm capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={16} className="text-white/60" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="text-center text-white/30 text-xs font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Padding cells */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {days.map((day) => {
              const dots = getDayDots(day)
              const isSelected = isSameDay(day, selectedDate)
              const isTodayDay = isToday(day)

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                    isSelected
                      ? 'bg-rose-gold text-white font-semibold'
                      : isTodayDay
                      ? 'bg-rose-gold/20 text-rose-gold font-medium'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {dots.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dots.map((m) => {
                        const conf = estadoConfig[m.estado]
                        return (
                          <span
                            key={m.id}
                            className={`w-1 h-1 rounded-full ${
                              isSelected ? 'bg-white/60' : conf.dot
                            }`}
                          />
                        )
                      })}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected date bookings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <Calendar size={14} className="text-rose-gold" />
              {isToday(selectedDate)
                ? 'Hoje'
                : format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              <span className="text-white/30 font-normal">
                ({dayMarcacoes.length})
              </span>
            </h2>

            {/* Status filter */}
            <div className="flex gap-1 overflow-x-auto">
              {allEstados.map((e) => (
                <button
                  key={e}
                  onClick={() => setFilterEstado(e)}
                  className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                    filterEstado === e
                      ? 'bg-rose-gold text-white'
                      : 'bg-white/5 text-white/40 hover:text-white/70'
                  }`}
                >
                  {e === 'todos' ? 'Todos' : estadoConfig[e]?.label}
                </button>
              ))}
            </div>
          </div>

          {filteredMarcacoes.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
              <Calendar size={28} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">
                {dayMarcacoes.length === 0
                  ? 'Sem marcações para este dia'
                  : 'Nenhuma marcação com este estado'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMarcacoes.map((booking) => {
                const status = estadoConfig[booking.estado] ?? estadoConfig.pendente
                return (
                  <div
                    key={booking.id}
                    className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar placeholder */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-rose-gold font-semibold text-sm">
                            {booking.clienteNome.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">
                            {booking.clienteNome}
                          </p>
                          <p className="text-white/40 text-xs truncate">
                            {booking.servicoNome}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${status.color} ${status.bg}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-white/40 text-xs">
                        <Clock size={12} />
                        {booking.horaInicio}
                      </div>
                      <div className="text-white/40 text-xs">
                        {booking.telefone}
                      </div>
                      <div className="ml-auto text-golden text-sm font-semibold">
                        €{booking.valor}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
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
                        <button className="text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 rounded-lg px-3 py-1.5 transition-colors">
                          Cancelar
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
    </div>
  )
}
