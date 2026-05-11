import { NextRequest, NextResponse } from 'next/server'
import { createTestEvent, diagnosticarCalendar } from '@/lib/googleCalendar'

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
      },
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

  // Diagnóstico estruturado
  const diag = await diagnosticarCalendar()

  // Compat: continuar a devolver eventId + htmlLink se tudo OK (para a UI antiga que ainda lê isto)
  let legacyEventId: string | undefined
  let legacyLink: string | undefined
  if (diag.overallOk) {
    const test = await createTestEvent()
    if (test.ok) {
      legacyEventId = test.eventId
      legacyLink = test.htmlLink
    }
  }

  return NextResponse.json({
    ok: diag.overallOk,
    diagnostico: diag,
    eventId: legacyEventId,
    htmlLink: legacyLink,
    // Para retrocompatibilidade com a UI antiga
    ...(diag.overallOk ? {} : { error: diag.hint || 'Diagnóstico falhou — ver detalhe em .diagnostico' }),
  })
}
