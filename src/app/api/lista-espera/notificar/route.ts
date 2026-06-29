import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyAdminRequest } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

async function enviarEmailEspera(payload: {
  clienteEmail: string
  clienteNome: string
  servico: string
  link: string
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[lista-espera] RESEND_API_KEY não configurada — email não enviado')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Francielly Costa <noreply@franciellycosta.com>',
      to: payload.clienteEmail,
      subject: `Vaga disponível — ${payload.servico}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDF8F5; padding: 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #B76E79; font-size: 28px; margin: 0;">Francielly Costa</h1>
            <p style="color: #C9A96E; margin: 4px 0 0; font-size: 14px;">Dermopigmentação Avançada</p>
          </div>
          <h2 style="color: #333; font-size: 20px;">Olá ${payload.clienteNome}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Boa notícia! Surgiu uma vaga para <strong>${payload.servico}</strong>. Confirme a sua marcação aqui:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${payload.link}"
              style="display: inline-block; background: #B76E79; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Confirmar Marcação
            </a>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">
            Ou copie este link: <a href="${payload.link}" style="color: #B76E79;">${payload.link}</a>
          </p>
          <p style="color: #777; font-size: 13px; line-height: 1.6;">
            Ao clicar no link, poderá escolher a data e hora que prefere. A caução de 30€ é descontada no valor final do procedimento.
          </p>
          <hr style="border: 1px solid #eee; margin: 24px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Em caso de dúvida: geral@franciellycosta.pt · +351 917 132 116
          </p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${res.status} — ${err}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ação admin: exige autenticação
    const auth = await verifyAdminRequest(req)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { waitlistId, clienteEmail, clienteNome, servico, servicoSlug } = await req.json()

    if (!waitlistId || !clienteEmail || !servico) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
    }

    const slug = servicoSlug || servico.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const link = `${BASE_URL}/agendar?servico=${encodeURIComponent(slug)}&ref=lista-espera&id=${waitlistId}`

    // Send email
    await enviarEmailEspera({ clienteEmail, clienteNome, servico, link })

    // Marcar como notificada na BD
    const { error } = await supabaseAdmin()
      .from('lista_espera')
      .update({
        notificada: true,
        notificada_em: new Date().toISOString(),
        link_enviado: link,
      })
      .eq('id', waitlistId)
    if (error) console.error('[lista-espera/notificar] erro update:', error.message)

    return NextResponse.json({ success: true, link })
  } catch (err) {
    console.error('[lista-espera/notificar]', err)
    return NextResponse.json({ error: 'Erro ao enviar notificação' }, { status: 500 })
  }
}
