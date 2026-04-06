import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

async function notificarWaitlist(nome: string, email: string, telefone: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const adminEmail = process.env.ADMIN_EMAIL || 'geral@franciellycosta.com'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.com'

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Francielly Costa <noreply@franciellycosta.com>',
      to: email,
      subject: 'Ficou na lista de espera FiberBROWS! ✨',
      html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#FDF8F5;padding:40px;">
        <h1 style="color:#B76E79;text-align:center;font-size:28px;margin:0 0 4px;">Francielly Costa</h1>
        <p style="color:#C9A96E;text-align:center;font-size:13px;margin:0 0 32px;">Dermopigmentação Avançada</p>
        <h2 style="color:#333;">Olá ${nome}! ✨</h2>
        <p style="color:#555;line-height:1.7;">Foi inscrita com sucesso na lista de espera da <strong>FiberBROWS</strong> — a técnica revolucionária de fios sintéticos biocompatíveis que está a chegar a Portugal!</p>
        <div style="background:linear-gradient(135deg,#B76E7915,#C9A96E15);border:1px solid #C9A96E30;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;color:#555;"><strong>O que acontece a seguir?</strong></p>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">Assim que a FiberBROWS estiver disponível (previsto para <strong>Maio 2026</strong>), será uma das primeiras a ser contactada com prioridade de marcação.</p>
        </div>
        <p style="color:#888;font-size:13px;">Morada: Av. Dr. António Palha 53, 4715-091 Braga</p>
        <hr style="border:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:12px;text-align:center;">Dúvidas? geral@franciellycosta.com · +351 917 132 116</p>
      </div>`,
    }),
  }).catch(() => {})

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'FC Site <noreply@franciellycosta.com>',
      to: adminEmail,
      subject: `Nova inscrição FiberBROWS — ${nome}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1A1A1A;color:white;padding:40px;border-radius:12px;">
        <h2 style="color:#C9A96E;">Nova Inscrição na Lista FiberBROWS</h2>
        <div style="background:#2A2A2A;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong style="color:#C9A96E;">Nome:</strong> ${nome}</p>
          <p style="margin:0 0 8px;"><strong style="color:#C9A96E;">Email:</strong> ${email}</p>
          <p style="margin:0;"><strong style="color:#C9A96E;">Telefone:</strong> ${telefone}</p>
        </div>
        <a href="${siteUrl}/admin/fiberbrows-waitlist" style="display:inline-block;background:#C9A96E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver Lista de Espera</a>
      </div>`,
    }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  try {
    const { nome, email, telefone } = await req.json()

    if (!nome || !email || !telefone) {
      return NextResponse.json(
        { error: 'nome, email e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Base de dados não configurada' },
        { status: 503 }
      )
    }

    await addDoc(collection(db, 'fiberbrows-waitlist'), {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim(),
      criadoEm: serverTimestamp(),
      contactada: false,
    })

    // Fire and forget
    notificarWaitlist(nome.trim(), email.trim().toLowerCase(), telefone.trim()).catch(() => {})

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Erro ao guardar waitlist:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
