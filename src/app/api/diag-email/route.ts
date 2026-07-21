import { NextRequest, NextResponse } from 'next/server'

// ── Endpoint de diagnóstico TEMPORÁRIO ────────────────────────────────────────
// Só existe para investigar por que os emails de produção não chegam. Reporta,
// usando as env vars reais da Vercel: se há chave Resend, que domínios essa conta
// tem verificados, e o resultado exato de uma tentativa de envio. Nunca devolve a
// chave. Protegido por token. REMOVER assim que o diagnóstico terminar.
const TOKEN = 'fc-diag-7f3a9'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Francielly Costa <geral@franciellycosta.pt>'
  const out: Record<string, unknown> = {
    hasKey: !!key,
    keyPrefix: key ? key.slice(0, 5) : null,
    keyLen: key ? key.length : 0,
    emailFrom: from,
    adminEmail: process.env.ADMIN_EMAIL || null,
  }

  if (key) {
    try {
      const d = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${key}` },
      })
      const dj = (await d.json().catch(() => null)) as
        | { data?: Array<{ name: string; status: string }> }
        | null
      out.domainsStatus = d.status
      out.domains = dj?.data?.map((x) => `${x.name}:${x.status}`) ?? dj
    } catch (e) {
      out.domainsError = String(e)
    }

    // Consultar o estado de entrega de um email já enviado (last_event do Resend).
    const statusId = req.nextUrl.searchParams.get('status')
    if (statusId) {
      try {
        const st = await fetch(`https://api.resend.com/emails/${statusId}`, {
          headers: { Authorization: `Bearer ${key}` },
        })
        out.emailStatus = st.status
        out.emailInfo = await st.json().catch(() => null)
      } catch (e) {
        out.statusError = String(e)
      }
    }

    const to = req.nextUrl.searchParams.get('to')
    if (to) {
      try {
        const s = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to,
            subject: 'Diagnostico de email (teste)',
            html: '<p>Teste de diagnostico do envio em producao.</p>',
          }),
        })
        out.sendStatus = s.status
        out.sendBody = await s.text()
      } catch (e) {
        out.sendError = String(e)
      }
    }
  }

  return NextResponse.json(out)
}
