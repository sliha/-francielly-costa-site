import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Diagnóstico do Resend: usa a RESEND_API_KEY que está no servidor (Vercel) para
 * perguntar ao Resend que domínios existem nessa conta e o estado de verificação
 * de cada um. A chave NUNCA é devolvida — só os nomes/estados dos domínios.
 * Serve para saber, sem expor a chave, se `franciellycosta.pt` está na conta certa
 * e se já está verificado.
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({ hasKey: false, error: 'RESEND_API_KEY não configurada na Vercel' })
  }

  // Pista para confirmar QUE chave está em uso, sem a revelar.
  const keyHint = `${key.slice(0, 6)}...${key.slice(-4)}`

  let res: Response
  try {
    res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
  } catch (err) {
    return NextResponse.json({
      hasKey: true,
      keyHint,
      ok: false,
      error: `Falha ao contactar o Resend: ${err instanceof Error ? err.message : String(err)}`,
    })
  }

  const raw = await res.json().catch(() => null)
  if (!res.ok) {
    return NextResponse.json({
      hasKey: true,
      keyHint,
      ok: false,
      status: res.status,
      error: (raw && (raw.message || raw.error)) || `Resend respondeu ${res.status}`,
    })
  }

  const domains = Array.isArray(raw?.data)
    ? raw.data.map((d: Record<string, unknown>) => ({
        name: d.name as string,
        status: d.status as string,
        region: d.region as string,
      }))
    : []

  const alvo = domains.find((d: { name: string }) => d.name === 'franciellycosta.pt')

  return NextResponse.json({
    hasKey: true,
    keyHint,
    ok: true,
    total: domains.length,
    domains,
    franciellyPt: alvo
      ? { encontrado: true, status: alvo.status, verificado: alvo.status === 'verified' }
      : { encontrado: false },
  })
}
