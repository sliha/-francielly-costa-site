import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/firebaseAdmin'
import { getAgendamentoPorId, atualizarEstadoAgendamento, type MetodoPagamento } from '@/lib/booking'
import { upsertCalendarEventWithMetadata } from '@/lib/googleCalendar'
import { serverTimestamp, type Timestamp } from 'firebase/firestore'

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
    const newId = await upsertCalendarEventWithMetadata({
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
    if (newId && newId !== agendamento.googleEventId) {
      googleEventId = newId
      await atualizarEstadoAgendamento(body.agendamentoId, 'confirmado', {
        googleEventId: newId,
        lastGoogleSyncAt: serverTimestamp() as unknown as Timestamp,
      })
    } else if (newId) {
      // atualização (não criação): só marcar lastGoogleSyncAt
      await atualizarEstadoAgendamento(body.agendamentoId, 'confirmado', {
        lastGoogleSyncAt: serverTimestamp() as unknown as Timestamp,
      })
    } else {
      warning = 'Falha ao sincronizar com Google Calendar'
    }
  } catch (err) {
    console.error('upsertCalendarEventWithMetadata falhou:', err)
    warning = 'Erro ao sincronizar com Google Calendar'
  }

  return NextResponse.json({ success: true, googleEventId, warning })
}
