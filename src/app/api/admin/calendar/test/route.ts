import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { createTestEvent, diagnosticarCalendar } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
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
