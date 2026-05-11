import { NextRequest, NextResponse } from 'next/server'
import { renewWatchChannel } from '@/lib/googleCalendarSync'
import { getAdminDb } from '@/lib/firebaseAdmin'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

const HORAS_LIMITE = 48
const MS_HORA = 60 * 60 * 1000

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

export async function POST(req: NextRequest) {
  // Autenticação via header bearer + CRON_SECRET
  const headerSecret = req.headers.get('x-cron-secret') || ''
  const cronSecret = process.env.CRON_SECRET || ''
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (!safeEqual(headerSecret, cronSecret)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = getAdminDb()
  if (!db) return NextResponse.json({ ok: false, error: 'admin-sdk não inicializado' }, { status: 500 })

  const snap = await db.collection('settings').doc('googleCalendarSync').get()
  const state = snap.exists ? snap.data() : null
  if (!state?.channelExpiration) {
    return NextResponse.json({ ok: false, error: 'Canal não registado' }, { status: 404 })
  }

  const now = Date.now()
  const hoursLeft = (Number(state.channelExpiration) - now) / MS_HORA
  if (hoursLeft > HORAS_LIMITE) {
    return NextResponse.json({ ok: true, renewed: false, hoursLeft: Math.round(hoursLeft) })
  }

  const r = await renewWatchChannel()
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 500 })
  return NextResponse.json({ ok: true, renewed: true })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
