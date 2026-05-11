import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export const runtime = 'nodejs'

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
      caucaoValor,
      clienteNome,
      clienteTelefone,
      dataAgendamento,
    } = body

    console.log('Stripe checkout payload:', { agendamentoId, servicoNome, clienteEmail, caucaoValor })

    if (!agendamentoId || !servicoNome || !clienteEmail) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: agendamentoId, servicoNome e clienteEmail' },
        { status: 400 }
      )
    }

    // Guardar/actualizar dados do cliente no Firestore antes de iniciar pagamento
    if (db) {
      try {
        await setDoc(
          doc(db, 'clientes', agendamentoId),
          {
            nome: clienteNome || '',
            email: clienteEmail,
            telefone: clienteTelefone || '',
            servico: servicoNome,
            dataAgendamento: dataAgendamento || '',
            estado: 'pendente',
            criadoEm: serverTimestamp(),
          },
          { merge: true }
        )
        console.log('Cliente guardado no Firestore:', agendamentoId)
      } catch (firestoreErr) {
        console.error('Erro ao guardar cliente no Firestore:', firestoreErr)
        // Não bloquear o pagamento por erro de Firestore
      }
    }

    const valorCentimos = Math.round((Number(caucaoValor) || 30) * 100)
    console.log('Valor em cêntimos:', valorCentimos)

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
