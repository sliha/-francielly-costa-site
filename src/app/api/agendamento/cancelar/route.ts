import { NextRequest, NextResponse } from 'next/server'
import { atualizarEstadoAgendamento, getAgendamentoPorId } from '@/lib/booking'
import { deleteCalendarEvent } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { agendamentoId } = await req.json()
    if (!agendamentoId) {
      return NextResponse.json({ error: 'agendamentoId em falta' }, { status: 400 })
    }

    const agendamento = await getAgendamentoPorId(agendamentoId)
    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    if (agendamento.googleEventId) {
      const ok = await deleteCalendarEvent(agendamento.googleEventId)
      if (!ok) console.warn(`Falha ao apagar evento ${agendamento.googleEventId} no Google Calendar`)
    }

    await atualizarEstadoAgendamento(agendamentoId, 'cancelado')
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro ao cancelar agendamento:', message)
    return NextResponse.json({ error: 'Erro ao cancelar' }, { status: 500 })
  }
}
