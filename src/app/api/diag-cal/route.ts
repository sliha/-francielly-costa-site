import { NextRequest, NextResponse } from 'next/server'
import { diagnosticarCalendar } from '@/lib/googleCalendar'

// ── Endpoint de diagnóstico TEMPORÁRIO ────────────────────────────────────────
// Corre o diagnóstico do Google Calendar com as env vars reais da Vercel e devolve
// o email da conta de serviço, o id do calendário e o erro exato do insert. Serve
// para confirmar QUE conta e QUE calendário a produção usa. REMOVER após usar.
const TOKEN = 'fc-diag-7f3a9'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const diag = await diagnosticarCalendar()
  return NextResponse.json(diag)
}
