import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // ── diagnóstico de chave ──────────────────────────────────────────────────
  const secretKey = process.env.STRIPE_SECRET_KEY
  console.log('STRIPE_SECRET_KEY exists:', !!secretKey)

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY não está configurada no ambiente de runtime')
    return NextResponse.json({ error: 'Pagamentos não configurados' }, { status: 503 })
  }

  // Inicializar Stripe DENTRO do handler (garante leitura em runtime, não em build)
  const stripe = new Stripe(secretKey, {
    // Versão estável compatível com stripe@21
    apiVersion: '2024-09-30.acacia',
  })

  try {
    const body = await req.json()
    const { agendamentoId, servicoNome, clienteEmail, caucaoValor } = body

    console.log('Stripe checkout payload:', { agendamentoId, servicoNome, clienteEmail, caucaoValor })

    if (!agendamentoId || !servicoNome || !clienteEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: agendamentoId, servicoNome e clienteEmail' },
        { status: 400 }
      )
    }

    // 30 € em cêntimos
    const valorCentimos = Math.round((Number(caucaoValor) || 30) * 100) // = 3000
    console.log('Valor em cêntimos:', valorCentimos)

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
      success_url: `https://www.franciellycosta.pt/agendamento/confirmado?session_id={CHECKOUT_SESSION_ID}&id=${agendamentoId}`,
      cancel_url: `https://www.franciellycosta.pt/agendamento/cancelado`,
      metadata: { agendamentoId },
      locale: 'pt',
    })

    console.log('Stripe session criada com sucesso:', session.id, '| URL:', session.url ? 'OK' : 'NULA')
    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Erro ao criar sessão Stripe:', message)
    return NextResponse.json(
      { error: 'Erro ao iniciar pagamento. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
