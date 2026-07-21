import { NextRequest, NextResponse } from 'next/server'
import { escapeHtml } from '@/lib/sanitize'
import {
  emailShell,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  saudacao,
  cartaoDetalhes,
  botao,
  paragrafo,
} from '@/lib/emailTemplate'

// ── Endpoint de diagnóstico TEMPORÁRIO ────────────────────────────────────────
// Reenvia o email de marca REAL (confirmação de marcação de FiberBROWS, com o
// botão da anamnese) e devolve a resposta exata do Resend + estado de entrega,
// para distinguir "falhou o envio" de "caiu no spam". REMOVER após o diagnóstico.
const TOKEN = 'fc-diag-7f3a9'
const SITE_URL = 'https://franciellycosta.pt'

export const dynamic = 'force-dynamic'

function corpoConfirmacaoFiber(nome: string): string {
  const detalhes = cartaoDetalhes([
    { label: 'Serviço', valor: 'FiberBROWS' },
    { label: 'Data', valor: 'quarta-feira, 22 de julho de 2026' },
    { label: 'Hora', valor: '10:00' },
  ])
  const blocoAnamnese = `
    ${paragrafo('<strong>Antes da sua sessão de FiberBROWS</strong>, precisamos que preencha a sua ficha de anamnese e consentimento. É rápido, faz-se pelo telemóvel e ajuda-nos a preparar tudo com segurança para si. Pode guardar a meio e continuar mais tarde.')}
    ${botao('Preencher a minha ficha de anamnese', `${SITE_URL}/anamnese`)}
  `
  return `
    ${saudacao(escapeHtml(nome))}
    ${paragrafo('A sua marcação foi recebida com sucesso. Vamos entrar em contacto para confirmar o dia e a hora consigo.')}
    ${detalhes}
    ${blocoAnamnese}
    ${paragrafo('Se precisar de alterar ou cancelar, responda a este email ou contacte-nos pelo WhatsApp.')}
  `
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const key = process.env.RESEND_API_KEY
  const out: Record<string, unknown> = {}
  if (!key) return NextResponse.json({ error: 'sem chave' }, { status: 500 })

  // Reenviar o email de marca real (confirmação FiberBROWS + botão da anamnese).
  const to = p.get('to')
  if (p.get('send') === '1' && to) {
    const html = emailShell({
      bodyHtml: corpoConfirmacaoFiber('Sergio'),
      preheader: 'Recebemos a sua marcação. Entraremos em contacto para confirmar.',
    })
    try {
      const s = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to,
          reply_to: EMAIL_REPLY_TO,
          subject: 'A sua marcação de FiberBROWS foi recebida',
          html,
        }),
      })
      out.sendStatus = s.status
      out.sendBody = await s.text()
    } catch (e) {
      out.sendError = String(e)
    }
  }

  // Consultar estado de entrega por id.
  const statusId = p.get('status')
  if (statusId) {
    const st = await fetch(`https://api.resend.com/emails/${statusId}`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    const info = (await st.json().catch(() => null)) as
      | { last_event?: string; subject?: string; to?: string[] }
      | null
    out.lastEvent = info?.last_event ?? null
    out.subject = info?.subject ?? null
  }

  // Listar emails recentes para um destinatário, com estado.
  if (p.get('list') === '1' && to) {
    const r = await fetch('https://api.resend.com/emails?limit=25', {
      headers: { Authorization: `Bearer ${key}` },
    })
    const j = (await r.json().catch(() => null)) as
      | { data?: Array<{ id: string; to: string[]; subject: string; last_event: string; created_at: string }> }
      | null
    out.recent = (j?.data ?? [])
      .filter((e) => e.to?.includes(to))
      .map((e) => ({ id: e.id, subject: e.subject, last_event: e.last_event, created_at: e.created_at }))
  }

  return NextResponse.json(out)
}
