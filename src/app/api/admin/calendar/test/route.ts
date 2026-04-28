import { NextRequest, NextResponse } from 'next/server'
import { createTestEvent } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

async function verifyAdminToken(token: string): Promise<boolean> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) return false
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    )
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data.users) && data.users.length > 0
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const valid = await verifyAdminToken(token)
  if (!valid) {
    return NextResponse.json({ ok: false, error: 'Sessão inválida' }, { status: 401 })
  }

  const result = await createTestEvent()
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 })
  }
  return NextResponse.json(result)
}
