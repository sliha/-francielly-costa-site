import { NextResponse } from 'next/server'
import { verifyAdminRequest, getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { createBlockEvent } from '@/lib/googleCalendar'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

interface Payload {
  data?: string // YYYY-MM-DD
  motivo?: string
  bloqueioTotal?: boolean
  horasBloqueadas?: string[]
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

  if (!body.data || !/^\d{4}-\d{2}-\d{2}$/.test(body.data)) {
    return NextResponse.json({ error: 'data (YYYY-MM-DD) é obrigatória' }, { status: 400 })
  }

  const db = getAdminDb()
  if (!db) {
    return NextResponse.json(
      { error: getAdminInitError() || 'firebase-admin não inicializado' },
      { status: 500 },
    )
  }

  const motivo = body.motivo?.trim() || 'Bloqueado'
  const bloqueioTotal = body.bloqueioTotal ?? true
  const horasBloqueadas = bloqueioTotal ? [] : (body.horasBloqueadas || [])

  // 1. Cria doc Firestore
  let docId: string
  try {
    const ref = await db.collection('diasBloqueados').add({
      data: body.data,
      motivo,
      bloqueioTotal,
      horasBloqueadas,
      criadoEm: Timestamp.now(),
    })
    docId = ref.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Firestore: ${msg}` }, { status: 500 })
  }

  // 2. Cria evento(s) no Google Calendar
  let warning: string | undefined
  const googleEventIds: string[] = []
  try {
    if (bloqueioTotal) {
      const eid = await createBlockEvent({
        data: body.data,
        motivo,
        bloqueioTotal: true,
        docId,
      })
      if (eid) googleEventIds.push(eid)
    } else {
      // Para horas específicas, criar um evento por hora bloqueada
      for (const hora of horasBloqueadas) {
        const [h, m] = hora.split(':').map(Number)
        const total = h * 60 + m + 30
        const horaFim = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
        const eid = await createBlockEvent({
          data: body.data,
          horaInicio: hora,
          horaFim,
          motivo,
          bloqueioTotal: false,
          docId,
        })
        if (eid) googleEventIds.push(eid)
      }
    }

    if (googleEventIds.length > 0) {
      await db.collection('diasBloqueados').doc(docId).update({
        googleEventIds,
      })
    } else if (bloqueioTotal || horasBloqueadas.length > 0) {
      warning = 'Bloqueio guardado mas falhou sincronização com Google Calendar'
    }
  } catch (err) {
    console.error('createBlockEvent falhou:', err)
    warning = 'Bloqueio guardado mas erro ao criar evento Google'
  }

  return NextResponse.json({ success: true, docId, googleEventIds, warning })
}
