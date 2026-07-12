import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyAdminRequest } from '@/lib/auth'
import { CAUCAO_ATIVA } from '@/lib/caucao'
import { escapeHtml } from '@/lib/sanitize'
import { sendEmail, saudacao, botao, paragrafo } from '@/lib/emailTemplate'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

async function enviarEmailEspera(payload: {
  clienteEmail: string
  clienteNome: string
  servico: string
  link: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[lista-espera] RESEND_API_KEY não configurada — email não enviado')
    return
  }

  const nome = escapeHtml(payload.clienteNome)
  const servico = escapeHtml(payload.servico)

  await sendEmail({
    to: payload.clienteEmail,
    subject: `Surgiu uma vaga para ${payload.servico}`,
    preheader: 'Boa notícia! Confirme a sua marcação.',
    bodyHtml: `
      ${saudacao(nome)}
      ${paragrafo(`Boa notícia! Surgiu uma vaga para <strong>${servico}</strong>. Confirme a sua marcação aqui:`)}
      ${botao('Confirmar Marcação', payload.link)}
      ${paragrafo(`Ou copie este link: <a href="${payload.link}" style="color:#B76E79;">${payload.link}</a>`)}
      ${paragrafo(`Ao clicar no link, poderá escolher a data e a hora que prefere.${CAUCAO_ATIVA ? ' A caução de 30€ é descontada no valor final do procedimento.' : ''}`)}
    `,
  })
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
