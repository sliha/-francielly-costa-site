import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/firebaseAdmin'
import {
  getAgendamentoPorId,
  atualizarEstadoAgendamento,
  getSlotsDisponiveis,
} from '@/lib/booking'
import { upsertCalendarEventWithMetadata } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

interface Payload {
  agendamentoId?: string
  novaData?: string
  novaHoraInicio?: string
  novaHoraFim?: string
}

function calcularHoraFim(horaInicio: string, duracaoMin: number): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const total = h * 60 + m + duracaoMin
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function diferencaMinutos(hi: string, hf: string): number {
  const [hia, hib] = hi.split(':').map(Number)
  const [hfa, hfb] = hf.split(':').map(Number)
  return (hfa * 60 + hfb) - (hia * 60 + hib)
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

  if (!body.agendamentoId || !body.novaData || !body.novaHoraInicio) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: agendamentoId, novaData, novaHoraInicio' },
      { status: 400 },
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.novaData)) {
    return NextResponse.json({ error: 'Formato de data inválido (YYYY-MM-DD)' }, { status: 400 })
  }

  const agendamento = await getAgendamentoPorId(body.agendamentoId)
  if (!agendamento) {
    return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  }

  // Calcular duração original para manter
  const duracaoMin = agendamento.horaFim
    ? Math.max(diferencaMinutos(agendamento.horaInicio, agendamento.horaFim), 30)
    : 90
  const novaHoraFim = body.novaHoraFim || calcularHoraFim(body.novaHoraInicio, duracaoMin)

  // Validar slot livre (excluindo o próprio agendamento)
  const slots = await getSlotsDisponiveis(body.novaData, duracaoMin)
  const slotPretendido = slots.find((s) => s.hora === body.novaHoraInicio)
  if (slotPretendido && !slotPretendido.disponivel) {
    // Pode ser que esteja a colidir consigo mesmo se a data não mudou — verificar
    const mesmaData = agendamento.data === body.novaData
    const mesmaHora = agendamento.horaInicio === body.novaHoraInicio
    if (!(mesmaData && mesmaHora)) {
      return NextResponse.json(
        {
          success: false,
          conflito: `Slot ${body.novaHoraInicio} em ${body.novaData} não está disponível`,
        },
        { status: 409 },
      )
    }
  }

  // Atualizar Firestore
  await atualizarEstadoAgendamento(body.agendamentoId, agendamento.estado, {
    data: body.novaData,
    horaInicio: body.novaHoraInicio,
    horaFim: novaHoraFim,
  })

  // Atualizar Google Calendar
  let warning: string | undefined
  let googleEventId = agendamento.googleEventId
  try {
    const newId = await upsertCalendarEventWithMetadata({
      clienteNome: agendamento.clienteNome,
      clienteEmail: agendamento.clienteEmail,
      clienteTelefone: agendamento.clienteTelefone,
      servicoNome: agendamento.servicoNome,
      data: body.novaData,
      horaInicio: body.novaHoraInicio,
      horaFim: novaHoraFim,
      agendamentoId: body.agendamentoId,
      estado: agendamento.estado,
      googleEventId: agendamento.googleEventId,
    })
    if (newId && newId !== agendamento.googleEventId) {
      googleEventId = newId
      await atualizarEstadoAgendamento(body.agendamentoId, agendamento.estado, { googleEventId: newId })
    } else if (!newId) {
      warning = 'Reagendado mas falhou sincronização com Google Calendar'
    }
  } catch (err) {
    console.error('upsertCalendarEventWithMetadata falhou:', err)
    warning = 'Reagendado mas erro ao sincronizar com Google Calendar'
  }

  return NextResponse.json({ success: true, googleEventId, warning })
}
