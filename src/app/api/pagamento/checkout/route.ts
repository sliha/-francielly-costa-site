import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
  console.log('STRIPE_SECRET_KEY exists:', !!secretKey)

  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY não está configurada no ambiente de runtime')
    return NextResponse.json({ error: 'Pagamentos não configurados' }, { status: 503 })
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  })

  try {
    const body = await req.json()
    const {
      agendamentoId,
      servicoNome,
      clienteEmail,
      clienteNome,
      clienteTelefone,
      dataAgendamento,
    } = body

    console.log('Stripe checkout payload:', { agendamentoId, servicoNome, clienteEmail })

    if (!agendamentoId || !servicoNome || !clienteEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: agendamentoId, servicoNome e clienteEmail' },
        { status: 400 }
      )
    }

    // Guardar/actualizar dados do cliente antes de iniciar pagamento.
    // A tabela clientes tem o email como chave primária.
    try {
      await supabaseAdmin()
        .from('clientes')
        .upsert(
          {
            email: String(clienteEmail).toLowerCase(),
            nome: clienteNome || '',
            telefone: clienteTelefone || '',
            ultimo_servico: servicoNome,
            ultimo_agendamento: dataAgendamento || null,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
      console.log('Cliente guardado no Supabase:', clienteEmail)
    } catch (dbErr) {
      console.error('Erro ao guardar cliente:', dbErr)
      // Não bloquear o pagamento por erro de persistência do cliente
    }

    // SEGURANÇA: o valor da caução vem SEMPRE do servidor (definições de negócio),
    // nunca do payload do cliente.
    const caucaoValor = await getCaucaoValor()
    const valorCentimos = Math.round(caucaoValor * 100)
    console.log('Valor em cêntimos (servidor):', valorCentimos)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: clienteEmail,
      // receipt_email é configurado via payment_intent_data para envio automático
      payment_intent_data: {
        receipt_email: clienteEmail,
      },
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'}/agendamento/confirmado?session_id={CHECKOUT_SESSION_ID}&id=${agendamentoId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'}/agendamento/cancelado`,
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
