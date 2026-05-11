import { NextResponse } from 'next/server'
import { verifyAdminRequest, getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { deleteCalendarEvent } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

interface Payload {
  docId?: string
}

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!body.docId) {
    return NextResponse.json({ error: 'docId é obrigatório' }, { status: 400 })
  }

  const db = getAdminDb()
  if (!db) {
    return NextResponse.json(
      { error: getAdminInitError() || 'firebase-admin não inicializado' },
      { status: 500 },
    )
  }

  const snap = await db.collection('diasBloqueados').doc(body.docId).get()
  if (!snap.exists) {
    return NextResponse.json({ error: 'Bloqueio não encontrado' }, { status: 404 })
  }
  const data = snap.data() as { googleEventIds?: string[]; googleEventId?: string } | undefined

  // Apagar eventos Google
  const ids: string[] = []
  if (data?.googleEventIds && Array.isArray(data.googleEventIds)) ids.push(...data.googleEventIds)
  if (data?.googleEventId) ids.push(data.googleEventId)

  let warning: string | undefined
  for (const eid of ids) {
    try {
      const ok = await deleteCalendarEvent(eid)
      if (!ok) warning = 'Bloqueio apagado mas falhou remover algum evento Google'
    } catch (err) {
      console.error('Erro ao apagar evento Google:', err)
      warning = 'Bloqueio apagado mas erro ao remover evento Google'
    }
  }

  // Apagar doc Firestore
  try {
    await db.collection('diasBloqueados').doc(body.docId).delete()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Firestore: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, warning })
}
