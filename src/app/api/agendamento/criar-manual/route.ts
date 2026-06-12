import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { criarAgendamento, atualizarEstadoAgendamento, upsertCliente, getSlotsDisponiveis, type Agendamento } from '@/lib/booking'
import { createCalendarEvent } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

interface Payload {
  clienteNome: string
  clienteTelefone: string
  clienteEmail?: string
  servicoId: string
  servicoNome: string
  data: string // YYYY-MM-DD
  horaInicio: string // HH:MM
  horaFim?: string // HH:MM
  duracaoMinutos?: number
  notas?: string
  estado?: Agendamento['estado']
  caucaoPaga?: boolean
}

function calcularHoraFim(horaInicio: string, duracaoMin: number): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const total = h * 60 + m + duracaoMin
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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

  if (!body.clienteNome || !body.clienteTelefone || !body.servicoId || !body.data || !body.horaInicio) {
    return NextResponse.json(
      { error: 'Campos obrigatórios em falta: clienteNome, clienteTelefone, servicoId, data, horaInicio' },
      { status: 400 },
    )
  }

  const duracaoMin = body.duracaoMinutos ?? 90
  const horaFim = body.horaFim || calcularHoraFim(body.horaInicio, duracaoMin)
  const estado: Agendamento['estado'] = body.estado || 'confirmado'

  // Validar conflito de horário / dia bloqueado (a menos que seja cancelado).
  // Sem isto, a admin podia sobrepor duas clientes no mesmo horário sem aviso.
  if (estado !== 'cancelado' && !body.horaFim) {
    try {
      const slots = await getSlotsDisponiveis(body.data, duracaoMin)
      const slot = slots.find((s) => s.hora === body.horaInicio)
      if (!slot || !slot.disponivel) {
        return NextResponse.json(
          { error: 'Conflito: esse horário já está ocupado ou bloqueado. Escolha outra hora.' },
          { status: 409 },
        )
      }
    } catch (err) {
      console.error('Falha ao validar disponibilidade (criar-manual):', err)
      // Não bloqueia a criação manual se a verificação falhar tecnicamente.
    }
  }

  let agendamentoId: string
  try {
    agendamentoId = await criarAgendamento({
      clienteNome: body.clienteNome,
      clienteTelefone: body.clienteTelefone,
      clienteEmail: body.clienteEmail || '',
      servicoId: body.servicoId,
      servicoNome: body.servicoNome,
      data: body.data,
      horaInicio: body.horaInicio,
      horaFim,
      estado,
      caucaoPaga: body.caucaoPaga ?? false,
      notas: body.notas || '',
      criadoPor: 'admin',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Falha ao criar agendamento: ${msg}` }, { status: 500 })
  }

  // Upsert cliente (fire-and-forget)
  if (body.clienteEmail) {
    upsertCliente({
      nome: body.clienteNome,
      email: body.clienteEmail,
      telefone: body.clienteTelefone,
      ultimoServico: body.servicoNome,
      ultimoAgendamentoData: body.data,
    }).catch((err) => console.error('upsertCliente falhou:', err))
  }

  // Criar evento Google Calendar (não bloquear o resultado se falhar)
  let googleEventId: string | null = null
  let warning: string | undefined
  if (estado !== 'cancelado') {
    try {
      googleEventId = await createCalendarEvent({
        clienteNome: body.clienteNome,
        clienteEmail: body.clienteEmail || '',
        clienteTelefone: body.clienteTelefone,
        servicoNome: body.servicoNome,
        data: body.data,
        horaInicio: body.horaInicio,
        horaFim,
        agendamentoId,
        estado,
      })
      if (googleEventId) {
        await atualizarEstadoAgendamento(agendamentoId, estado, {
          googleEventId,
          lastGoogleSyncAt: new Date().toISOString(),
        })
      } else {
        warning = 'Marcação criada, mas falhou sincronização com Google Calendar. Usar "Re-sincronizar" em Definições.'
      }
    } catch (err) {
      console.error('createCalendarEvent falhou:', err)
      warning = 'Marcação criada, mas erro ao criar evento Google. Usar "Re-sincronizar" em Definições.'
    }
  }

  return NextResponse.json({ success: true, agendamentoId, googleEventId, warning })
}
