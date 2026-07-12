import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { escapeHtml } from '@/lib/sanitize'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'
import { sendEmail, saudacao, cartaoDetalhes, botao, paragrafo } from '@/lib/emailTemplate'

async function enviarEmailContacto(nomeRaw: string, emailRaw: string, telefoneRaw: string, servicoRaw: string, mensagemRaw: string) {
  // Todo o input do utilizador é escapado antes de entrar no HTML dos emails.
  const nome = escapeHtml(nomeRaw)
  const email = escapeHtml(emailRaw)
  const telefone = escapeHtml(telefoneRaw)
  const servico = escapeHtml(servicoRaw)
  const mensagem = escapeHtml(mensagemRaw)
  if (!process.env.RESEND_API_KEY) return
  const adminEmail = process.env.ADMIN_EMAIL || 'geral@franciellycosta.pt'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

  // ── Confirmação à cliente ──
  await sendEmail({
    to: emailRaw,
    subject: 'Recebemos a sua mensagem',
    preheader: 'Obrigada pelo seu contacto. Respondemos o mais breve possível.',
    replyTo: adminEmail,
    bodyHtml: `
      ${saudacao(nome)}
      ${paragrafo('Obrigada pela sua mensagem! Recebemos o seu contacto e respondemos o mais breve possível, geralmente no mesmo dia útil.')}
      ${servico ? cartaoDetalhes([{ label: 'Serviço de interesse', valor: servico }]) : ''}
      ${paragrafo('Se for urgente, fale connosco pelo WhatsApp: +351 917 132 116.')}
    `,
  }).catch(() => {})

  // ── Notificação à Francielly ──
  await sendEmail({
    to: adminEmail,
    subject: `Nova mensagem de ${nomeRaw}${servicoRaw ? ` (${servicoRaw})` : ''}`,
    replyTo: emailRaw,
    bodyHtml: `
      ${paragrafo('<strong>Nova mensagem de contacto pelo site.</strong>')}
      ${cartaoDetalhes([
        { label: 'Nome', valor: nome },
        { label: 'Email', valor: `<a href="mailto:${email}" style="color:#B76E79;">${email}</a>` },
        ...(telefone ? [{ label: 'Telefone', valor: telefone }] : []),
        ...(servico ? [{ label: 'Serviço', valor: servico }] : []),
      ])}
      ${mensagem ? paragrafo(`<strong>Mensagem:</strong><br><span style="white-space:pre-wrap;">${mensagem}</span>`) : ''}
      ${botao('Ir para o Admin', `${siteUrl}/admin`)}
    `,
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  // Anti-spam: máx. 5 mensagens por IP a cada 15 minutos.
  const rl = rateLimit(`contacto:${getClientIp(req)}`, 5, 15 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim().slice(0, 120)
    const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 254)
    const phone = String(body?.phone ?? '').trim().slice(0, 30)
    const service = String(body?.service ?? '').trim().slice(0, 80)
    const message = String(body?.message ?? '').trim().slice(0, 3000)

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Nome, email e telefone são obrigatórios' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Guardar na BD — non-blocking, o email envia mesmo que a escrita falhe
    supabaseAdmin()
      .from('contactos')
      .insert({
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        telefone: phone?.trim() || '',
        servico: service?.trim() || '',
        mensagem: message?.trim() || '',
        criado_em: new Date().toISOString(),
        lido: false,
      })
      .then(({ error }) => {
        if (error) console.error('Erro ao guardar contacto:', error.message)
      })

    // Send emails — fire and forget
    enviarEmailContacto(
      name.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || '',
      service?.trim() || '',
      message?.trim() || ''
    ).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao processar contacto:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
