import { NextResponse } from 'next/server'
import { getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import type { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

interface SyncStateLite {
  syncToken?: string
  channelId?: string
  channelExpiration?: number
  lastSyncAt?: Timestamp
}

export async function GET() {
  const checks: Record<string, string> = {
    firestore: 'unknown',
    calendarApiReachable: 'skipped',
    syncTokenPresent: 'unknown',
  }
  let status: 'ok' | 'degraded' | 'down' = 'ok'
  let lastSyncAt: string | null = null
  let minutesSinceLastSync: number | null = null
  let channelActive = false
  let channelExpiresInDays: number | null = null

  const db = getAdminDb()
  if (!db) {
    checks.firestore = `down: ${getAdminInitError() || 'admin-sdk não inicializado'}`
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
  checks.firestore = 'ok'

  let state: SyncStateLite = {}
  try {
    const snap = await db.collection('settings').doc('googleCalendarSync').get()
    state = snap.exists ? (snap.data() as SyncStateLite) : {}
  } catch (err) {
    checks.firestore = `error: ${err instanceof Error ? err.message : String(err)}`
    status = 'down'
  }

  if (state.lastSyncAt) {
    const lastMs = state.lastSyncAt.toMillis()
    lastSyncAt = new Date(lastMs).toISOString()
    minutesSinceLastSync = Math.floor((Date.now() - lastMs) / 60_000)
    if (minutesSinceLastSync > 60) status = status === 'down' ? 'down' : 'degraded'
  }

  if (state.channelId && state.channelExpiration) {
    const now = Date.now()
    channelActive = state.channelExpiration > now
    channelExpiresInDays = Math.floor((state.channelExpiration - now) / (24 * 60 * 60 * 1000))
    if (!channelActive) status = 'down'
    else if (channelExpiresInDays < 2) status = status === 'down' ? 'down' : 'degraded'
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
