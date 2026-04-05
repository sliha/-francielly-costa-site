import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
})

export async function POST(req: NextRequest) {
  try {
    const { agendamentoId, servicoNome, clienteEmail, caucaoValor } = await req.json()

    if (!agendamentoId || !servicoNome || !clienteEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: agendamentoId, servicoNome e clienteEmail' },
        { status: 400 }
      )
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.com'
    const valorCentimos = Math.round((caucaoValor || 20) * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: clienteEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Caução de Reserva — ${servicoNome}`,
              description:
                'Valor descontado no procedimento. Não reembolsável em caso de falta sem aviso prévio de 24h.',
            },
            unit_amount: valorCentimos,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/agendamento/confirmado?session_id={CHECKOUT_SESSION_ID}&id=${agendamentoId}`,
      cancel_url: `${baseUrl}/agendamento/cancelado`,
      metadata: { agendamentoId },
      locale: 'pt',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro ao criar sessão Stripe:', message)
    return NextResponse.json(
      { error: 'Erro ao iniciar pagamento. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
