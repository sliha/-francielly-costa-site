import { NextResponse } from 'next/server'
import { getSyncState } from '@/lib/googleCalendarSync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {
    supabase: 'unknown',
    calendarApiReachable: 'skipped',
    syncTokenPresent: 'unknown',
  }
  let status: 'ok' | 'degraded' | 'down' = 'ok'
  let lastSyncAt: string | null = null
  let minutesSinceLastSync: number | null = null
  let channelActive = false
  let channelExpiresInDays: number | null = null

  let state: Awaited<ReturnType<typeof getSyncState>> = {}
  try {
    state = await getSyncState()
    checks.supabase = 'ok'
  } catch (err) {
    checks.supabase = `down: ${err instanceof Error ? err.message : String(err)}`
    return NextResponse.json(
      {
        status: 'down',
        lastSyncAt,
        minutesSinceLastSync,
        channelActive: false,
        channelExpiresInDays: null,
        checks,
      },
      { status: 503 },
    )
  }

  if (state.lastSyncAt) {
    const lastMs = new Date(state.lastSyncAt).getTime()
    lastSyncAt = new Date(lastMs).toISOString()
    minutesSinceLastSync = Math.floor((Date.now() - lastMs) / 60_000)
    if (minutesSinceLastSync > 60) status = 'degraded'
  }

  if (state.channelId && state.channelExpiration) {
    const now = Date.now()
    channelActive = state.channelExpiration > now
    channelExpiresInDays = Math.floor((state.channelExpiration - now) / (24 * 60 * 60 * 1000))
    if (!channelActive) status = 'down'
    else if (channelExpiresInDays < 2) status = 'degraded'
  } else {
    status = 'down'
  }

  checks.syncTokenPresent = state.syncToken ? 'ok' : 'missing'

  const httpStatus = status === 'down' ? 503 : 200

  return NextResponse.json(
    {
      status,
      lastSyncAt,
      minutesSinceLastSync,
      channelActive,
      channelExpiresInDays,
      checks,
    },
    {
      status: httpStatus,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  )
}
