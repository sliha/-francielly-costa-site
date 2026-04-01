import { NextRequest, NextResponse } from 'next/server'

import Stripe from 'stripe'

import { atualizarEstadoAgendamento } from '@/lib/booking'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {

apiVersion: '2024-06-20',

})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {

if (!webhookSecret) {

console.error('STRIPE_WEBHOOK_SECRET não configurado')

return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 })

}

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

try {

switch (event.type) {

case 'checkout.session.completed': {

const session = [event.data](http://event.data).object as Stripe.CheckoutSession

const agendamentoId = session.metadata?.agendamentoId

if (agendamentoId) {

await atualizarEstadoAgendamento(agendamentoId, 'pago', {

caucaoPaga: true,

metodoPagamento: 'stripe',

stripeSessionId: [session.id](http://session.id),

})

console.log(`Agendamento ${agendamentoId} atualizado para "pago"`)

}

break

}

case 'checkout.session.expired': {

const session = [event.data](http://event.data).object as Stripe.CheckoutSession

const agendamentoId = session.metadata?.agendamentoId

if (agendamentoId) {

console.log(`Sessão Stripe expirou para agendamento ${agendamentoId}`)

}

break

}

default: {

console.log(`Unhandled event type: ${event.type}`)

break

}

}

} catch (err) {

console.error('Erro processando evento Stripe:', err)

// Stripe recomenda responder 2xx se você não quer re-tentativas infinitas,

// mas se isso for um erro crítico seu, você pode devolver 500.

return NextResponse.json({ error: 'Erro interno' }, { status: 500 })

}

return NextResponse.json({ received: true }, { status: 200 })

}