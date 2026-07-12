import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { getAgendamentoPorId } from '@/lib/booking'
import { sendPedidoConfirmacao } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * Envia à cliente um email a pedir que CONFIRME a marcação (por resposta), sem caução.
 * Serve para recuperar marcações que ficaram pendentes por causa do pagamento.
 * Só o admin autenticado pode disparar. Não altera o estado da marcação nem cria
 * evento no Google Calendar — a confirmação real fica manual, depois de a cliente responder.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let agendamentoId = ''
  try {
    const body = await req.json()
    agendamentoId = String(body?.agendamentoId ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Corpo do pedido inválido' }, { status: 400 })
  }

  if (!agendamentoId) {
    return NextResponse.json({ error: 'agendamentoId em falta' }, { status: 400 })
  }

  const ag = await getAgendamentoPorId(agendamentoId)
  if (!ag) {
    return NextResponse.json({ error: 'Marcação não encontrada' }, { status: 404 })
  }
  if (!ag.clienteEmail) {
    return NextResponse.json(
      { error: 'Esta marcação não tem email da cliente para enviar o pedido' },
      { status: 400 },
    )
  }

  try {
    await sendPedidoConfirmacao({
      id: ag.id ?? agendamentoId,
      clienteNome: ag.clienteNome,
      clienteEmail: ag.clienteEmail,
      servicoNome: ag.servicoNome,
      data: ag.data,
      horaInicio: ag.horaInicio,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Erro ao enviar pedido de confirmação:', msg)
    return NextResponse.json(
      { error: `Não foi possível enviar o email: ${msg}` },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true, email: ag.clienteEmail })
}
