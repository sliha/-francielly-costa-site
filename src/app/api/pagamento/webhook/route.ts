import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { atualizarEstadoAgendamento, getAgendamentoPorId } from '@/lib/booking'
import { createCalendarEvent } from '@/lib/googleCalendar'
import { marcarReferenciaConvertida } from '@/lib/referencias'
import { getProcessed, markProcessed, makeKey } from '@/lib/idempotency'
import { logSync } from '@/lib/syncLog'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  console.log('Webhook — STRIPE_SECRET_KEY exists:', !!secretKey)
  console.log('Webhook — STRIPE_WEBHOOK_SECRET exists:', !!webhookSecret)

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY não configurada no webhook')
    return NextResponse.json({ error: 'Pagamentos não configurados' }, { status: 503 })
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' })

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Assinatura inválida'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  console.log('Stripe webhook event:', event.type)

  // Idempotência: se já processámos este event.id com sucesso, ignorar.
  const idKey = makeKey('stripe', event.id)
  const prior = await getProcessed(idKey)
  if (prior?.result === 'ok') {
    console.log(`Webhook Stripe ${event.id} já processado anteriormente — skip`)
    await logSync({
      operation: 'webhook_stripe',
      status: 'skip',
      durationMs: 0,
      metadata: { eventId: event.id, eventType: event.type, reason: 'duplicate' },
    })
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
  }

  const startedAt = Date.now()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const agendamentoId = session.metadata?.agendamentoId

        if (agendamentoId) {
          await atualizarEstadoAgendamento(agendamentoId, 'confirmado', {
            caucaoPaga: true,
            metodoPagamento: 'stripe',
            stripeSessionId: session.id,
          })
          console.log(`Agendamento ${agendamentoId} confirmado com sucesso`)

          try {
            const agendamento = await getAgendamentoPorId(agendamentoId)
            if (agendamento) {
              const eventId = await createCalendarEvent({
                clienteNome: agendamento.clienteNome,
                clienteEmail: agendamento.clienteEmail,
                clienteTelefone: agendamento.clienteTelefone,
                servicoNome: agendamento.servicoNome,
                data: agendamento.data,
                horaInicio: agendamento.horaInicio,
                horaFim: agendamento.horaFim,
              })
              if (eventId) {
                await atualizarEstadoAgendamento(agendamentoId, 'confirmado', {
                  googleEventId: eventId,
                  lastGoogleSyncAt: new Date().toISOString(),
                })
                console.log(`Google Calendar evento criado: ${eventId}`)
              }
            }
          } catch (calErr) {
            console.error('Falha ao criar evento no Google Calendar:', calErr)
          }

          // Marcar eventual referência como convertida — fire and forget
          marcarReferenciaConvertida(agendamentoId).catch((err) =>
            console.error('Erro ao marcar referência convertida:', err)
          )
        } else {
          console.warn('checkout.session.completed sem agendamentoId no metadata')
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const agendamentoId = session.metadata?.agendamentoId
        if (agendamentoId) {
          console.log(`Sessão Stripe expirou para agendamento ${agendamentoId}`)
        }
        break
      }

      default:
        console.log(`Stripe event não tratado: ${event.type}`)
    }
    await markProcessed(idKey, 'stripe', 'ok')
    await logSync({
      operation: 'webhook_stripe',
      status: 'ok',
      durationMs: Date.now() - startedAt,
      metadata: { eventId: event.id, eventType: event.type },
    })
  } catch (err) {
    console.error('Erro ao processar evento Stripe:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    await markProcessed(idKey, 'stripe', 'error', errorMessage)
    await logSync({
      operation: 'webhook_stripe',
      status: 'error',
      durationMs: Date.now() - startedAt,
      errorMessage,
      metadata: { eventId: event.id, eventType: event.type },
    })
    return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
