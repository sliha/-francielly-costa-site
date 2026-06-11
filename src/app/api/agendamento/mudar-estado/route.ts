import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import {
  getAgendamentoPorId,
  atualizarEstadoAgendamento,
  type Agendamento,
} from '@/lib/booking'
import {
  upsertCalendarEventWithMetadata,
  deleteCalendarEvent,
} from '@/lib/googleCalendar'

export const runtime = 'nodejs'

const ESTADOS_VALIDOS: Agendamento['estado'][] = [
  'pendente',
  'pendente_pagamento',
  'confirmado',
  'pago',
  'concluido',
  'cancelado',
]

interface Payload {
  agendamentoId?: string
  novoEstado?: Agendamento['estado']
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

  if (!body.agendamentoId || !body.novoEstado) {
    return NextResponse.json(
      { error: 'agendamentoId e novoEstado são obrigatórios' },
      { status: 400 },
    )
  }
  if (!ESTADOS_VALIDOS.includes(body.novoEstado)) {
    return NextResponse.json(
      { error: `novoEstado inválido. Esperado: ${ESTADOS_VALIDOS.join(', ')}` },
      { status: 400 },
    )
  }

  const agendamento = await getAgendamentoPorId(body.agendamentoId)
  if (!agendamento) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  }

  await atualizarEstadoAgendamento(body.agendamentoId, body.novoEstado)

  let warning: string | undefined
  let googleEventId = agendamento.googleEventId

  try {
    if (body.novoEstado === 'cancelado') {
      if (agendamento.googleEventId) {
        const ok = await deleteCalendarEvent(agendamento.googleEventId)
        if (!ok) warning = 'Estado atualizado mas falhou apagar evento Google'
      }
    } else {
      const newId = await upsertCalendarEventWithMetadata({
        clienteNome: agendamento.clienteNome,
        clienteEmail: agendamento.clienteEmail,
        clienteTelefone: agendamento.clienteTelefone,
        servicoNome: agendamento.servicoNome,
        data: agendamento.data,
        horaInicio: agendamento.horaInicio,
        horaFim: agendamento.horaFim,
        agendamentoId: body.agendamentoId,
        estado: body.novoEstado,
        googleEventId: agendamento.googleEventId,
      })
      if (newId && newId !== agendamento.googleEventId) {
        googleEventId = newId
        await atualizarEstadoAgendamento(body.agendamentoId, body.novoEstado, {
          googleEventId: newId,
          lastGoogleSyncAt: new Date().toISOString(),
        })
      } else if (newId) {
        await atualizarEstadoAgendamento(body.agendamentoId, body.novoEstado, {
          lastGoogleSyncAt: new Date().toISOString(),
        })
      } else {
        warning = 'Estado atualizado mas falhou sincronização Google'
      }
    }
  } catch (err) {
    console.error('Erro ao sincronizar Google na mudança de estado:', err)
    warning = 'Estado atualizado mas erro ao sincronizar Google'
  }

  return NextResponse.json({ success: true, googleEventId, warning })
}
