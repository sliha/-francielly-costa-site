import { NextRequest, NextResponse } from 'next/server'
import { renewWatchChannel, getSyncState } from '@/lib/googleCalendarSync'
import { logSync } from '@/lib/syncLog'
import crypto from 'node:crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const HORAS_LIMITE = 48
const MS_HORA = 60 * 60 * 1000

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export async function POST(req: NextRequest) {
  // Autenticação: x-cron-secret OU Authorization: Bearer <CRON_SECRET> (Vercel Cron)
  const headerSecret =
    req.headers.get('x-cron-secret') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const cronSecret = process.env.CRON_SECRET || ''
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (!safeEqual(headerSecret, cronSecret)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const state = await getSyncState()
  if (!state.channelExpiration) {
    return NextResponse.json({ ok: false, error: 'Canal não registado' }, { status: 404 })
  }

  const now = Date.now()
  const hoursLeft = (Number(state.channelExpiration) - now) / MS_HORA
  if (hoursLeft > HORAS_LIMITE) {
    await logSync({
      operation: 'auto_renew',
      status: 'skip',
      durationMs: 0,
      metadata: { reason: 'enough time left', hoursLeft: Math.round(hoursLeft) },
    })
    return NextResponse.json({ ok: true, renewed: false, hoursLeft: Math.round(hoursLeft) })
  }

  const start = Date.now()
  const r = await renewWatchChannel()
  if (!r.ok) {
    await logSync({
      operation: 'auto_renew',
      status: 'error',
      durationMs: Date.now() - start,
      errorMessage: r.error,
    })
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 })
  }
  await logSync({ operation: 'auto_renew', status: 'ok', durationMs: Date.now() - start })
  return NextResponse.json({ ok: true, renewed: true })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
