import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { cleanTestData } from '@/scripts/cleanTestData'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const authResult = await verifyAdminRequest(req)
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const results = await cleanTestData()
    const total = results.reduce((acc, r) => acc + r.deleted, 0)
    return NextResponse.json({ ok: true, total, results, by: authResult.email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao limpar dados'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
