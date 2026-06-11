import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { forceFullResync } from '@/lib/googleCalendarSync'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const r = await forceFullResync()
  return NextResponse.json({
    ok: r.ok,
    processed: r.processed,
    errors: r.errors,
  })
}
