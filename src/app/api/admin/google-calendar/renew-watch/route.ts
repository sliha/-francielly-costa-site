import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/firebaseAdmin'
import { renewWatchChannel } from '@/lib/googleCalendarSync'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const r = await renewWatchChannel()
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
