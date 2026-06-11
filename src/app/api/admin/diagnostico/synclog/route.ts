import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const operation = searchParams.get('operation') || ''
  const status = searchParams.get('status') || ''

  try {
    let q = supabaseAdmin()
      .from('sync_log')
      .select('*')
      .order('ts', { ascending: false })
    if (operation) q = q.eq('operation', operation)
    if (status) q = q.eq('status', status)
    q = q.limit(limit)

    const { data, error } = await q
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const entries = (data || []).map((d) => ({
      id: d.id,
      operation: d.operation,
      status: d.status,
      agendamentoId: d.agendamento_id ?? null,
      googleEventId: d.google_event_id ?? null,
      durationMs: d.duration_ms ?? null,
      attempt: d.attempt ?? null,
      errorMessage: d.error_message ?? null,
      metadata: d.metadata ?? null,
      timestamp: d.ts ? new Date(d.ts).getTime() : null,
    }))
    return NextResponse.json({ entries })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
