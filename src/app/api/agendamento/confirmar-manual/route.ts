import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { getAgendamentoPorId, atualizarEstadoAgendamento, type MetodoPagamento } from '@/lib/booking'
import { upsertCalendarEventVerbose } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

const METODOS_VALIDOS: MetodoPagamento[] = ['whatsapp', 'transferencia', 'dinheiro', 'mbway', 'outro']

interface Payload {
  agendamentoId?: string
  metodoPagamento?: MetodoPagamento
}

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.agendamentoId) {
    return NextResponse.json({ error: 'agendamentoId em falta' }, { status: 400 })
  }
  if (!body.metodoPagamento || !METODOS_VALIDOS.includes(body.metodoPagamento)) {
    return NextResponse.json(
      { error: `metodoPagamento inválido. Esperado: ${METODOS_VALIDOS.join(', ')}` },
      { status: 400 },
    )
  }

  const agendamento = await getAgendamentoPorId(body.agendamentoId)
  if (!agendamento) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  }

  await atualizarEstadoAgendamento(body.agendamentoId, 'confirmado', {
    caucaoPaga: true,
    metodoPagamento: body.metodoPagamento,
  })

  let warning: string | undefined
  let googleEventId = agendamento.googleEventId
  try {
    const sync = await upsertCalendarEventVerbose({
      clienteNome: agendamento.clienteNome,
      clienteEmail: agendamento.clienteEmail,
      clienteTelefone: agendamento.clienteTelefone,
      servicoNome: agendamento.servicoNome,
      data: agendamento.data,
      horaInicio: agendamento.horaInicio,
      horaFim: agendamento.horaFim,
      agendamentoId: body.agendamentoId,
      estado: 'confirmado',
      googleEventId: agendamento.googleEventId,
    })
    if (sync.ok && sync.eventId !== agendamento.googleEventId) {
      googleEventId = sync.eventId
      await atualizarEstadoAgendamento(body.agendamentoId, 'confirmado', {
        googleEventId: sync.eventId,
        lastGoogleSyncAt: new Date().toISOString(),
      })
    } else if (sync.ok) {
      // atualização (não criação): só marcar lastGoogleSyncAt
      await atualizarEstadoAgendamento(body.agendamentoId, 'confirmado', {
        lastGoogleSyncAt: new Date().toISOString(),
      })
    } else {
      warning = `Marcação confirmada, mas falhou o Google Calendar: ${sync.error}`
    }
  } catch (err) {
    console.error('upsertCalendarEventVerbose falhou:', err)
    warning = `Marcação confirmada, mas erro ao sincronizar Google: ${err instanceof Error ? err.message : String(err)}`
  }

  return NextResponse.json({ success: true, googleEventId, warning })
}
