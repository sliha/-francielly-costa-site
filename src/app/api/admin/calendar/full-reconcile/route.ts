import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest, getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import {
  upsertCalendarEventVerbose,
  createBlockEvent,
  deleteCalendarEvent,
} from '@/lib/googleCalendar'
import { withRetry } from '@/lib/retry'
import { logSync } from '@/lib/syncLog'
import { google, calendar_v3 } from 'googleapis'
import { Timestamp } from 'firebase-admin/firestore'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

const ESTADOS_ATIVOS = ['pendente', 'confirmado', 'pago']
const SCOPES = ['https://www.googleapis.com/auth/calendar']
const TIMEZONE = 'Europe/Lisbon'

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

function getCalendar(): { client: calendar_v3.Calendar; calendarId: string } | { error: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!raw) return { error: 'GOOGLE_SERVICE_ACCOUNT_KEY ausente' }
  if (!calendarId) return { error: 'GOOGLE_CALENDAR_ID ausente' }
  try {
    const creds = JSON.parse(raw)
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    })
    return { client: google.calendar({ version: 'v3', auth }), calendarId }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

function externalBlockDocId(eventId: string): string {
  return 'ext_' + crypto.createHash('sha256').update(eventId).digest('hex').slice(0, 20)
}

async function listFutureEvents(
  client: calendar_v3.Calendar,
  calendarId: string,
  daysAhead: number,
): Promise<calendar_v3.Schema$Event[]> {
  const timeMin = new Date()
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(timeMin.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const items: calendar_v3.Schema$Event[] = []
  let pageToken: string | undefined
  do {
    const res = await withRetry(
      () =>
        client.events.list({
          calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          showDeleted: false,
          pageToken,
          maxResults: 250,
        }),
      { label: 'fullReconcile.events.list' },
    )
    if (res.data.items) items.push(...res.data.items)
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)
  return items
}

export async function POST(req: NextRequest) {
  // Aceita admin OU cron secret
  const cronHeader = req.headers.get('x-cron-secret') || ''
  const isCron = cronHeader && process.env.CRON_SECRET && safeEqual(cronHeader, process.env.CRON_SECRET)

  if (!isCron) {
    const auth = await verifyAdminRequest(req)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: getAdminInitError() || 'admin-sdk' }, { status: 500 })

  const cal = getCalendar()
  if ('error' in cal) {
    await logSync({ operation: 'full_reconcile', status: 'error', durationMs: 0, errorMessage: cal.error })
    return NextResponse.json({ error: cal.error }, { status: 500 })
  }

  const start = Date.now()
  const hoje = new Date()
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  const counters = {
    agendamentosTotal: 0,
    agendamentosCriados: 0,
    agendamentosAtualizados: 0,
    agendamentosCancelados: 0,
    agendamentosOrfaos: 0,
    bloqueiosCriados: 0,
    bloqueiosApagados: 0,
    bloqueiosMantidos: 0,
  }
  const erros: Array<{ tipo: string; id: string; motivo: string }> = []

  // 1+2. Listar eventos futuros do Google (90 dias)
  let googleEvents: calendar_v3.Schema$Event[]
  try {
    googleEvents = await listFutureEvents(cal.client, cal.calendarId, 90)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await logSync({ operation: 'full_reconcile', status: 'error', durationMs: Date.now() - start, errorMessage: msg })
    return NextResponse.json({ error: `events.list falhou: ${msg}` }, { status: 500 })
  }

  const googleById = new Map<string, calendar_v3.Schema$Event>()
  for (const e of googleEvents) {
    if (e.id) googleById.set(e.id, e)
  }

  // 3. Query Firestore agendamentos ativos futuros (sem composto; filtrar em memória)
  const snap = await db.collection('agendamentos').where('data', '>=', hojeStr).get()
  const ativos = snap.docs.filter((d) => ESTADOS_ATIVOS.includes(d.data().estado))
  counters.agendamentosTotal = ativos.length

  // 4. Para cada agendamento, decidir ação
  for (const docSnap of ativos) {
    const a = docSnap.data()
    const id = docSnap.id
    const gEvent = a.googleEventId ? googleById.get(a.googleEventId) : undefined

    try {
      if (a.googleEventId && gEvent) {
        // Comparar campos chave; decidir vencedor por timestamp mais recente
        const eventUpdatedMs = gEvent.updated ? new Date(gEvent.updated).getTime() : 0
        const localUpdatedMs = a.lastGoogleSyncAt
          ? (a.lastGoogleSyncAt as Timestamp).toMillis()
          : 0

        const eventoStartDate = gEvent.start?.dateTime?.slice(0, 10) || gEvent.start?.date || ''
        const eventoStartHora = gEvent.start?.dateTime?.split('T')[1]?.slice(0, 5) || ''
        const eventoEndHora = gEvent.end?.dateTime?.split('T')[1]?.slice(0, 5) || ''

        const dadosIguais =
          eventoStartDate === a.data && eventoStartHora === a.horaInicio && eventoEndHora === (a.horaFim || '')

        if (dadosIguais) {
          // Marcar como visitado para depois detetar bloqueios sem agendamento
          googleById.delete(a.googleEventId)
          continue
        }

        if (eventUpdatedMs > localUpdatedMs) {
          // Google é mais recente → atualizar Firestore
          await db.collection('agendamentos').doc(id).update({
            data: eventoStartDate || a.data,
            horaInicio: eventoStartHora || a.horaInicio,
            horaFim: eventoEndHora || a.horaFim,
            lastGoogleSyncAt: Timestamp.now(),
          })
          counters.agendamentosAtualizados++
        } else {
          // Firestore é mais recente → atualizar Google
          const result = await upsertCalendarEventVerbose({
            clienteNome: a.clienteNome || '',
            clienteEmail: a.clienteEmail || '',
            clienteTelefone: a.clienteTelefone || '',
            servicoNome: a.servicoNome || '',
            data: a.data,
            horaInicio: a.horaInicio,
            horaFim: a.horaFim || '',
            agendamentoId: id,
            estado: a.estado,
            googleEventId: a.googleEventId,
          })
          if (!result.ok) {
            erros.push({ tipo: 'agendamento_update', id, motivo: result.error })
          } else {
            await db.collection('agendamentos').doc(id).update({
              lastGoogleSyncAt: Timestamp.now(),
            })
            counters.agendamentosAtualizados++
          }
        }
        googleById.delete(a.googleEventId)
      } else if (a.googleEventId && !gEvent) {
        // Tinha evento mas não está mais no Google — foi apagado externamente
        await db.collection('agendamentos').doc(id).update({
          estado: 'cancelado',
          lastGoogleSyncAt: Timestamp.now(),
        })
        counters.agendamentosCancelados++
      } else {
        // Sem googleEventId — criar
        const result = await upsertCalendarEventVerbose({
          clienteNome: a.clienteNome || '',
          clienteEmail: a.clienteEmail || '',
          clienteTelefone: a.clienteTelefone || '',
          servicoNome: a.servicoNome || '',
          data: a.data,
          horaInicio: a.horaInicio,
          horaFim: a.horaFim || '',
          agendamentoId: id,
          estado: a.estado,
        })
        if (!result.ok) {
          erros.push({ tipo: 'agendamento_create', id, motivo: result.error })
        } else {
          await db.collection('agendamentos').doc(id).update({
            googleEventId: result.eventId,
            lastGoogleSyncAt: Timestamp.now(),
          })
          counters.agendamentosCriados++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      erros.push({ tipo: 'agendamento', id, motivo: msg })
    }
  }

  // 5+6. Eventos restantes em googleById: pertencem a outros agendamentos (não ativos) ou são externos
  const bloqueiosSnap = await db.collection('diasBloqueados').where('data', '>=', hojeStr).get()
  const bloqueiosByEventId = new Map<string, string>() // googleEventId -> docId
  for (const docSnap of bloqueiosSnap.docs) {
    const d = docSnap.data()
    if (d.googleEventId) bloqueiosByEventId.set(d.googleEventId, docSnap.id)
    if (Array.isArray(d.googleEventIds)) {
      for (const eid of d.googleEventIds) bloqueiosByEventId.set(eid, docSnap.id)
    }
  }

  for (const [eventId, event] of googleById.entries()) {
    const fcType = event.extendedProperties?.private?.fcType
    const fcAgendamentoId = event.extendedProperties?.private?.fcAgendamentoId

    if (fcType === 'agendamento') {
      // Evento órfão — agendamento foi apagado mas evento ficou
      if (fcAgendamentoId) {
        const exists = await db.collection('agendamentos').doc(fcAgendamentoId).get()
        if (!exists.exists) {
          counters.agendamentosOrfaos++
          try {
            await deleteCalendarEvent(eventId)
          } catch (err) {
            erros.push({
              tipo: 'orfao_delete',
              id: eventId,
              motivo: err instanceof Error ? err.message : String(err),
            })
          }
        }
      }
      continue
    }

    if (fcType === 'block') continue // bloqueio nosso — mantém como está

    // CASO 6: criado externamente — upsert em diasBloqueados
    const extId = externalBlockDocId(eventId)
    const data = event.start?.date || event.start?.dateTime?.slice(0, 10) || ''
    if (!data) continue
    const allDay = !!event.start?.date && !event.start?.dateTime
    const horaInicio = event.start?.dateTime?.split('T')[1]?.slice(0, 5) || ''
    const motivo = event.summary || 'Evento externo'

    try {
      await db.collection('diasBloqueados').doc(extId).set(
        {
          data,
          motivo,
          bloqueioTotal: allDay,
          horasBloqueadas: allDay ? [] : (horaInicio ? [horaInicio] : []),
          origem: 'google-externo',
          googleEventId: eventId,
          googleEventUpdated: event.updated || null,
          atualizadoEm: Timestamp.now(),
        },
        { merge: true },
      )
      counters.bloqueiosCriados++
      bloqueiosByEventId.delete(eventId)
    } catch (err) {
      erros.push({
        tipo: 'bloqueio_create',
        id: eventId,
        motivo: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // Marca todos os bloqueios google-externo cujos eventos já não existem no Google
  for (const [eventId, docId] of bloqueiosByEventId.entries()) {
    const doc = bloqueiosSnap.docs.find((d) => d.id === docId)
    if (!doc) continue
    const data = doc.data()
    if (data.origem !== 'google-externo') {
      counters.bloqueiosMantidos++
      continue
    }
    // Sem retentar — se está aqui, é porque o evento Google desapareceu
    try {
      await db.collection('diasBloqueados').doc(docId).delete()
      counters.bloqueiosApagados++
    } catch (err) {
      erros.push({
        tipo: 'bloqueio_delete',
        id: docId,
        motivo: err instanceof Error ? err.message : String(err),
      })
    }
    void eventId
  }

  const durationMs = Date.now() - start
  await logSync({
    operation: 'full_reconcile',
    status: erros.length === 0 ? 'ok' : 'error',
    durationMs,
    metadata: { ...counters, errosCount: erros.length },
    ...(erros.length > 0 ? { errorMessage: erros.slice(0, 3).map((e) => `${e.tipo}/${e.id}: ${e.motivo}`).join(' | ') } : {}),
  })

  return NextResponse.json({
    success: true,
    durationMs,
    counters,
    erros,
  })
}
