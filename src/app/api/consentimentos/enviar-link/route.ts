import { NextRequest, NextResponse } from 'next/server'
import { criarConsentimento, getConsentimentoPorAgendamento, reenviarLinkConsentimento } from '@/lib/consentimentos'

export const runtime = 'nodejs'

interface Payload {
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataAgendamento: string
}

async function enviarEmailConsentimento(params: {
  to: string
  clienteNome: string
  servicoNome: string
  dataAgendamento: string
  link: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const dataFmt = new Date(params.dataAgendamento + 'T12:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDF8F5; padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #B76E79; font-size: 28px; margin: 0;">Francielly Costa</h1>
        <p style="color: #C9A96E; margin: 4px 0 0; font-size: 14px;">Dermopigmentação Avançada</p>
      </div>
      <h2 style="color: #333; font-size: 20px;">Olá ${params.clienteNome},</h2>
      <p style="color: #555; line-height: 1.6;">
        Antes do seu procedimento <strong>${params.servicoNome}</strong> em <strong>${dataFmt}</strong>,
        precisamos que preencha o formulário de anamnese e consentimento informado.
      </p>
      <p style="color: #555; line-height: 1.6;">
        Demora menos de 3 minutos a preencher e ajuda-nos a garantir a sua segurança.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.link}" style="display: inline-block; background: #B76E79; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Preencher Formulário
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
        Se tem dúvidas, contacte-nos: geral@franciellycosta.com · +351 913 112 232
      </p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Francielly Costa <noreply@franciellycosta.com>',
      to: params.to,
      subject: `Formulário de consentimento — ${params.servicoNome}`,
      html,
    }),
  })

  if (!res.ok) {
    throw new Error(`Resend error: ${res.status} ${await res.text()}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload

    if (!body.clienteNome || !body.clienteEmail || !body.servicoNome || !body.dataAgendamento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: clienteNome, clienteEmail, servicoNome, dataAgendamento' },
        { status: 400 }
      )
    }

    let token: string
    let consentimentoId: string

    // Reaproveitar consentimento existente para este agendamento
    if (body.agendamentoId) {
      const existente = await getConsentimentoPorAgendamento(body.agendamentoId)
      if (existente && existente.id) {
        if (existente.estado === 'submetido') {
          return NextResponse.json({ error: 'Consentimento já submetido para este agendamento.' }, { status: 409 })
        }
        token = existente.token
        consentimentoId = existente.id
        await reenviarLinkConsentimento(consentimentoId)
      } else {
        const novo = await criarConsentimento(body)
        token = novo.token
        consentimentoId = novo.id
      }
    } else {
      const novo = await criarConsentimento(body)
      token = novo.token
      consentimentoId = novo.id
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'
    const link = `${baseUrl}/consentimento/${token}`

    try {
      await enviarEmailConsentimento({
        to: body.clienteEmail,
        clienteNome: body.clienteNome,
        servicoNome: body.servicoNome,
        dataAgendamento: body.dataAgendamento,
        link,
      })
    } catch (emailErr) {
      console.error('Erro envio email consentimento:', emailErr)
      return NextResponse.json({ ok: true, link, warning: 'Doc criado mas email falhou' }, { status: 200 })
    }

    return NextResponse.json({ ok: true, consentimentoId, link })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro enviar-link:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
