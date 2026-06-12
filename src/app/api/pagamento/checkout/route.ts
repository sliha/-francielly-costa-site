import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAgendamentoPorId } from '@/lib/booking'

export const runtime = 'nodejs'

// Lê o valor da caução das definições de negócio (servidor). NUNCA confiar no valor
// enviado pelo cliente. Fallback fixo de 30€.
async function getCaucaoValor(): Promise<number> {
  try {
    const { data } = await supabaseAdmin()
      .from('settings')
      .select('value')
      .eq('key', 'negocio')
      .maybeSingle()
    const raw = (data?.value as { caucao?: unknown } | null)?.caucao
    const num = Number(raw)
    if (Number.isFinite(num) && num > 0) return num
  } catch (err) {
    console.error('Erro ao ler caução das definições:', err)
  }
  return 30
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY não está configurada no ambiente de runtime')
    return NextResponse.json({ error: 'Pagamentos não configurados' }, { status: 503 })
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  })

  try {
    const body = await req.json().catch(() => ({}))
    const agendamentoId = typeof body?.agendamentoId === 'string' ? body.agendamentoId : ''

    if (!agendamentoId) {
      return NextResponse.json({ error: 'agendamentoId em falta' }, { status: 400 })
    }

    // SEGURANÇA: todos os dados (cliente, serviço, valor) vêm do registo no servidor.
    // O payload do cliente nunca é usado para escrever na BD nem para definir valores.
    const agendamento = await getAgendamentoPorId(agendamentoId)
    if (!agendamento) {
      return NextResponse.json({ error: 'Marcação não encontrada' }, { status: 404 })
    }

    // Só faz sentido pagar caução de marcações ainda por confirmar.
    if (agendamento.estado !== 'pendente_pagamento' && agendamento.estado !== 'pendente') {
      return NextResponse.json(
        { error: 'Esta marcação já não aguarda pagamento de caução.' },
        { status: 409 }
      )
    }

    const caucaoValor = await getCaucaoValor()
    const valorCentimos = Math.round(caucaoValor * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: agendamento.clienteEmail,
      payment_intent_data: {
        receipt_email: agendamento.clienteEmail,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Caução de Reserva — ${agendamento.servicoNome || 'Procedimento'}`,
              description:
                'Valor descontado no procedimento. Não reembolsável em caso de cancelamento com menos de 48h de antecedência ou falta sem aviso.',
            },
            unit_amount: valorCentimos,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'}/agendamento/confirmado?session_id={CHECKOUT_SESSION_ID}&id=${encodeURIComponent(agendamentoId)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'}/agendamento/cancelado`,
      metadata: { agendamentoId },
      locale: 'pt',
    })

    console.log('Stripe session criada:', session.id)
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
