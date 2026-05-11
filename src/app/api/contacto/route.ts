import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

async function enviarEmailContacto(nome: string, email: string, telefone: string, servico: string, mensagem: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const adminEmail = process.env.ADMIN_EMAIL || 'geral@franciellycosta.com'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

  // Confirmation to client
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Francielly Costa <noreply@franciellycosta.com>',
      to: email,
      subject: 'Mensagem recebida — Francielly Costa',
      html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FDF8F5;padding:40px;">
        <h1 style="color:#B76E79;text-align:center;font-size:28px;margin:0 0 4px;">Francielly Costa</h1>
        <p style="color:#C9A96E;text-align:center;font-size:13px;margin:0 0 32px;">Dermopigmentação Avançada</p>
        <h2 style="color:#333;">Olá ${nome}!</h2>
        <p style="color:#555;line-height:1.7;">Obrigada pela sua mensagem! Recebi o seu contacto e responderei o mais brevemente possível, geralmente no mesmo dia útil.</p>
        ${servico ? `<div style="background:white;border-left:4px solid #B76E79;padding:16px;margin:20px 0;border-radius:4px;"><p style="margin:0;color:#555;"><strong>Serviço de interesse:</strong> ${servico}</p></div>` : ''}
        <p style="color:#888;font-size:13px;">Morada: Av. Dr. António Palha 53, 4715-091 Braga</p>
        <p style="color:#888;font-size:13px;">WhatsApp: +351 917 132 116</p>
        <hr style="border:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;text-align:center;">geral@franciellycosta.com</p>
      </div>`,
    }),
  }).catch(() => {})

  // Notification to admin
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'FC Site <noreply@franciellycosta.com>',
      to: adminEmail,
      subject: `Nova mensagem de ${nome}${servico ? ` — ${servico}` : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A1A;color:white;padding:40px;border-radius:12px;">
        <h2 style="color:#B76E79;">Nova Mensagem de Contacto</h2>
        <div style="background:#2A2A2A;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong style="color:#C9A96E;">Nome:</strong> ${nome}</p>
          <p style="margin:0 0 8px;"><strong style="color:#C9A96E;">Email:</strong> <a href="mailto:${email}" style="color:#B76E79;">${email}</a></p>
          ${telefone ? `<p style="margin:0 0 8px;"><strong style="color:#C9A96E;">Telefone:</strong> ${telefone}</p>` : ''}
          ${servico ? `<p style="margin:0 0 8px;"><strong style="color:#C9A96E;">Serviço:</strong> ${servico}</p>` : ''}
          ${mensagem ? `<p style="margin:16px 0 4px;"><strong style="color:#C9A96E;">Mensagem:</strong></p><p style="margin:0;color:#ccc;white-space:pre-wrap;">${mensagem}</p>` : ''}
        </div>
        <a href="${siteUrl}/admin" style="display:inline-block;background:#B76E79;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ir para o Admin</a>
      </div>`,
    }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, service, message } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Save to Firestore — non-blocking so email still sends even if Firestore fails
    if (db) {
      addDoc(collection(db, 'contactos'), {
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        telefone: phone?.trim() || '',
        servico: service?.trim() || '',
        mensagem: message?.trim() || '',
        criadoEm: serverTimestamp(),
        lido: false,
      }).catch((err) => console.error('Firestore contacto save error:', err))
    }

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
