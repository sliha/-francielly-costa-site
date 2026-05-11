import { google, calendar_v3 } from 'googleapis'
import crypto from 'node:crypto'
import { Timestamp, FieldValue, type Firestore } from 'firebase-admin/firestore'
import { getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { getProcessed, markProcessed, makeKey } from '@/lib/idempotency'
import { withRetry } from '@/lib/retry'
import { logSync } from '@/lib/syncLog'
import { emitirAlerta, notificarAdminsPorEmail } from '@/lib/alertas'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const SYNC_DOC = 'googleCalendarSync'
const SETTINGS_COL = 'settings'
const WEBHOOK_PATH = '/api/google-calendar/webhook'
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'
const CHANNEL_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias (max Google)
const ECHO_TOLERANCE_MS = 5_000

export interface GoogleCalendarSyncState {
  syncToken?: string
  channelId?: string
  channelResourceId?: string
  channelExpiration?: number
  channelCreatedAt?: Timestamp
  lastSyncAt?: Timestamp
  lastSyncStatus?: 'ok' | 'error' | 'full-resync-needed'
  lastError?: string
  metadata?: Record<string, unknown>
}

function getCalendarClient():
  | { client: calendar_v3.Calendar; calendarId: string }
  | { error: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) return { error: 'GOOGLE_SERVICE_ACCOUNT_KEY ausente' }
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) return { error: 'GOOGLE_CALENDAR_ID ausente' }
  let credentials: { client_email?: string; private_key?: string }
  try {
    credentials = JSON.parse(raw)
  } catch (err) {
    return { error: `GOOGLE_SERVICE_ACCOUNT_KEY inválido: ${err instanceof Error ? err.message : String(err)}` }
  }
  if (!credentials.client_email || !credentials.private_key) {
    return { error: 'JSON sem client_email ou private_key' }
  }
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  })
  return { client: google.calendar({ version: 'v3', auth }), calendarId }
}

export function signChannelId(channelId: string): string {
  const secret = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET
  if (!secret) throw new Error('GOOGLE_CALENDAR_WEBHOOK_SECRET ausente')
  return crypto.createHmac('sha256', secret).update(channelId).digest('hex')
}

export function verifyChannelToken(channelId: string, token: string): boolean {
  const secret = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(channelId).digest('hex')
  const a = Buffer.from(expected, 'utf-8')
  const b = Buffer.from(token, 'utf-8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

async function getSyncState(db: Firestore): Promise<GoogleCalendarSyncState> {
  const snap = await db.collection(SETTINGS_COL).doc(SYNC_DOC).get()
  if (!snap.exists) return {}
  return snap.data() as GoogleCalendarSyncState
}

async function setSyncState(db: Firestore, patch: Partial<GoogleCalendarSyncState>): Promise<void> {
  await db.collection(SETTINGS_COL).doc(SYNC_DOC).set(patch, { merge: true })
}

async function clearChannelFields(db: Firestore): Promise<void> {
  await db.collection(SETTINGS_COL).doc(SYNC_DOC).set(
    {
      channelId: FieldValue.delete(),
      channelResourceId: FieldValue.delete(),
      channelExpiration: FieldValue.delete(),
      channelCreatedAt: FieldValue.delete(),
    },
    { merge: true },
  )
}

/**
 * Faz um full sync inicial (lista tudo paginado) e devolve o `nextSyncToken`.
 * Usado depois de registar canal ou quando o token expira (410 Gone).
 */
async function fullSync(
  client: calendar_v3.Calendar,
  calendarId: string,
): Promise<{ syncToken?: string; processed: number; errors: string[] }> {
  const db = getAdminDb()
  if (!db) return { processed: 0, errors: [getAdminInitError() || 'admin-sdk não inicializado'] }
  const errors: string[] = []
  let pageToken: string | undefined
  let syncToken: string | undefined
  let processed = 0
  do {
    try {
      const res = await withRetry(
        () =>
          client.events.list({
            calendarId,
            singleEvents: true,
            showDeleted: true,
            pageToken,
            maxResults: 250,
          }),
        { label: 'fullSync.events.list' },
      )
      const items = res.data.items || []
      for (const event of items) {
        try {
          await applyEventToFirestore(db, event)
          processed++
        } catch (err) {
          errors.push(`event ${event.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      pageToken = res.data.nextPageToken ?? undefined
      if (res.data.nextSyncToken) syncToken = res.data.nextSyncToken
    } catch (err) {
      errors.push(`page fetch: ${err instanceof Error ? err.message : String(err)}`)
      break
    }
  } while (pageToken)
  return { syncToken, processed, errors }
}

export async function registerWatchChannel(): Promise<{
  ok: boolean
  channelId?: string
  expiration?: number
  error?: string
}> {
  const cli = getCalendarClient()
  if ('error' in cli) return { ok: false, error: cli.error }
  const db = getAdminDb()
  if (!db) return { ok: false, error: getAdminInitError() || 'admin-sdk não inicializado' }

  // Parar canal antigo (best-effort)
  try {
    const prev = await getSyncState(db)
    if (prev.channelId && prev.channelResourceId) {
      try {
        await cli.client.channels.stop({
          requestBody: { id: prev.channelId, resourceId: prev.channelResourceId },
        })
      } catch (err) {
        console.warn('Stop canal antigo falhou (ignorado):', err)
      }
    }
  } catch (err) {
    console.warn('getSyncState falhou (ignorado):', err)
  }

  const channelId = crypto.randomUUID()
  let token: string
  try {
    token = signChannelId(channelId)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
  const expiration = Date.now() + CHANNEL_TTL_MS

  let response: calendar_v3.Schema$Channel
  try {
    const res = await withRetry(
      () =>
        cli.client.events.watch({
          calendarId: cli.calendarId,
          requestBody: {
            id: channelId,
            type: 'web_hook',
            address: `${WEBHOOK_BASE_URL}${WEBHOOK_PATH}`,
            token,
            expiration: String(expiration),
          },
        }),
      { label: 'registerWatchChannel.watch' },
    )
    response = res.data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  const channelResourceId = response.resourceId || undefined
  const channelExpiration = response.expiration ? Number(response.expiration) : expiration

  await setSyncState(db, {
    channelId,
    channelResourceId,
    channelExpiration,
    channelCreatedAt: Timestamp.now(),
  })

  // Full sync inicial para obter syncToken
  try {
    const sync = await fullSync(cli.client, cli.calendarId)
    await setSyncState(db, {
      syncToken: sync.syncToken,
      lastSyncAt: Timestamp.now(),
      lastSyncStatus: sync.errors.length === 0 ? 'ok' : 'error',
      lastError: sync.errors.slice(0, 5).join(' | ') || FieldValue.delete() as unknown as string,
    })
  } catch (err) {
    console.error('Full sync inicial falhou:', err)
  }

  await logSync({
    operation: 'register_watch',
    status: 'ok',
    durationMs: 0,
    metadata: { channelId, channelResourceId, channelExpiration },
  })

  return { ok: true, channelId, expiration: channelExpiration }
}

export async function stopWatchChannel(): Promise<{ ok: boolean; error?: string }> {
  const cli = getCalendarClient()
  if ('error' in cli) return { ok: false, error: cli.error }
  const db = getAdminDb()
  if (!db) return { ok: false, error: getAdminInitError() || 'admin-sdk não inicializado' }

  const state = await getSyncState(db)
  if (!state.channelId || !state.channelResourceId) {
    await clearChannelFields(db)
    return { ok: true }
  }

  try {
    await withRetry(
      () =>
        cli.client.channels.stop({
          requestBody: { id: state.channelId!, resourceId: state.channelResourceId! },
        }),
      { label: 'stopWatchChannel.channels.stop' },
    )
  } catch (err) {
    // Mesmo que o stop falhe, limpamos local — o canal expirará sozinho.
    console.warn('channels.stop falhou:', err)
  }

  await clearChannelFields(db)
  await logSync({ operation: 'stop_watch', status: 'ok', durationMs: 0 })
  return { ok: true }
}

export async function renewWatchChannel(): Promise<{ ok: boolean; error?: string }> {
  // Stop + register (mantém syncToken)
  await stopWatchChannel()
  const r = await registerWatchChannel()
  if (!r.ok) return { ok: false, error: r.error }
  return { ok: true }
}

export async function processCalendarChanges(): Promise<{ processed: number; errors: string[] }> {
  const start = Date.now()
  const cli = getCalendarClient()
  if ('error' in cli) {
    await logSync({ operation: 'webhook_google', status: 'error', durationMs: 0, errorMessage: cli.error })
    return { processed: 0, errors: [cli.error] }
  }
  const db = getAdminDb()
  if (!db) return { processed: 0, errors: [getAdminInitError() || 'admin-sdk não inicializado'] }

  const state = await getSyncState(db)
  const errors: string[] = []
  let processed = 0
  let nextSyncToken: string | undefined
  let pageToken: string | undefined

  // Sem syncToken → full sync
  if (!state.syncToken) {
    const sync = await fullSync(cli.client, cli.calendarId)
    await setSyncState(db, {
      syncToken: sync.syncToken,
      lastSyncAt: Timestamp.now(),
      lastSyncStatus: sync.errors.length === 0 ? 'ok' : 'error',
      lastError: sync.errors.slice(0, 5).join(' | ') || FieldValue.delete() as unknown as string,
    })
    return { processed: sync.processed, errors: sync.errors }
  }

  let currentSyncToken: string | undefined = state.syncToken
  do {
    try {
      const res = await withRetry(
        () =>
          cli.client.events.list({
            calendarId: cli.calendarId,
            syncToken: currentSyncToken,
            showDeleted: true,
            pageToken,
            maxResults: 250,
          }),
        { label: 'processChanges.events.list' },
      )
      const items = res.data.items || []
      for (const event of items) {
        try {
          await applyEventToFirestore(db, event)
          processed++
        } catch (err) {
          errors.push(`event ${event.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      pageToken = res.data.nextPageToken ?? undefined
      if (res.data.nextSyncToken) nextSyncToken = res.data.nextSyncToken
    } catch (err) {
      const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
      if (status === 410) {
        // Token expirou — full re-sync
        await setSyncState(db, { syncToken: FieldValue.delete() as unknown as string })
        const sync = await fullSync(cli.client, cli.calendarId)
        await setSyncState(db, {
          syncToken: sync.syncToken,
          lastSyncAt: Timestamp.now(),
          lastSyncStatus: 'full-resync-needed',
          lastError: 'Token expirou; full resync executado',
        })
        return { processed: sync.processed, errors: sync.errors }
      }
      errors.push(`list: ${err instanceof Error ? err.message : String(err)}`)
      break
    }
    // Para a próxima página, o syncToken não é usado — só o pageToken
    currentSyncToken = undefined
  } while (pageToken)

  // Contador de falhas consecutivas para alerta
  const prevFails = (state.metadata as { failureStreak?: number } | undefined)?.failureStreak ?? 0
  const newStreak = errors.length === 0 ? 0 : prevFails + 1

  await setSyncState(db, {
    syncToken: nextSyncToken || state.syncToken,
    lastSyncAt: Timestamp.now(),
    lastSyncStatus: errors.length === 0 ? 'ok' : 'error',
    lastError: errors.slice(0, 5).join(' | ') || FieldValue.delete() as unknown as string,
    metadata: { failureStreak: newStreak },
  })

  await logSync({
    operation: 'webhook_google',
    status: errors.length === 0 ? 'ok' : 'error',
    durationMs: Date.now() - start,
    metadata: { processed, errorsCount: errors.length },
    ...(errors.length > 0 ? { errorMessage: errors.slice(0, 3).join(' | ') } : {}),
  })

  // Alerta após 3 falhas consecutivas
  if (newStreak >= 3) {
    const mensagem = `Sincronização Google → Site falhou ${newStreak} vezes consecutivas. Último erro: ${errors[0] || 'desconhecido'}`
    const res = await emitirAlerta({
      tipo: 'multiple_failures',
      severidade: 'critico',
      mensagem,
      metadata: { failureStreak: newStreak, lastError: errors[0] },
    })
    if (res.created) {
      await notificarAdminsPorEmail({
        subject: '[ALERTA CRÍTICO] Sincronização Google Calendar — Francielly Costa',
        htmlBody: `<p>${mensagem}</p><p>Ver detalhes em <a href="${WEBHOOK_BASE_URL}/admin/diagnostico">/admin/diagnostico</a>.</p>`,
      })
    }
  }

  return { processed, errors }
}

/**
 * Apaga o syncToken para forçar full re-sync na próxima chamada a processCalendarChanges.
 */
export async function forceFullResync(): Promise<{ ok: boolean; processed: number; errors: string[] }> {
  const db = getAdminDb()
  if (!db) return { ok: false, processed: 0, errors: [getAdminInitError() || 'admin-sdk não inicializado'] }
  await setSyncState(db, { syncToken: FieldValue.delete() as unknown as string })
  const r = await processCalendarChanges()
  return { ok: r.errors.length === 0, processed: r.processed, errors: r.errors }
}

function externalBlockDocId(eventId: string): string {
  return 'ext_' + crypto.createHash('sha256').update(eventId).digest('hex').slice(0, 20)
}

function isAllDay(event: calendar_v3.Schema$Event): boolean {
  return !!event.start?.date && !event.start?.dateTime
}

function dataDoEvento(event: calendar_v3.Schema$Event): string {
  if (event.start?.date) return event.start.date // YYYY-MM-DD
  if (event.start?.dateTime) return event.start.dateTime.slice(0, 10)
  return ''
}

function horaDoEvento(event: calendar_v3.Schema$Event): string {
  if (event.start?.dateTime) return event.start.dateTime.split('T')[1]?.slice(0, 5) || ''
  return ''
}

function horaFimDoEvento(event: calendar_v3.Schema$Event): string {
  if (event.end?.dateTime) return event.end.dateTime.split('T')[1]?.slice(0, 5) || ''
  return ''
}

/**
 * Aplica um evento (criado/atualizado/cancelado no Google) ao Firestore.
 * Idempotente.
 */
async function applyEventToFirestore(db: Firestore, event: calendar_v3.Schema$Event): Promise<void> {
  if (!event.id) return

  // Idempotência: já processámos este event.id + version?
  const idKey = makeKey('google-calendar', event.id, event.updated || event.etag || '')
  const prior = await getProcessed(idKey)
  if (prior?.result === 'ok') return

  const fcType = event.extendedProperties?.private?.fcType
  const fcAgendamentoId = event.extendedProperties?.private?.fcAgendamentoId
  const fcBlockDocId = event.extendedProperties?.private?.fcBlockDocId
  const eventUpdated = event.updated ? new Date(event.updated).getTime() : 0

  // Helper para gravar idempotência ao final
  const ok = () => markProcessed(idKey, 'google-calendar', 'ok').catch(() => {})

  // ── CASO 1: evento cancelado ────────────────────────────────────────────────
  if (event.status === 'cancelled') {
    if (fcAgendamentoId) {
      const ref = db.collection('agendamentos').doc(fcAgendamentoId)
      const snap = await ref.get()
      if (snap.exists) {
        const cur = snap.data() || {}
        if (cur.lastGoogleSyncAt) {
          const lastMs = (cur.lastGoogleSyncAt as Timestamp).toMillis()
          if (eventUpdated && eventUpdated - lastMs <= ECHO_TOLERANCE_MS) {
            await ok()
            return
          }
        }
        if (cur.estado !== 'cancelado') {
          await ref.update({ estado: 'cancelado', lastGoogleSyncAt: Timestamp.now() })
        }
      }
      await ok()
      return
    }
    if (fcBlockDocId) {
      try {
        await db.collection('diasBloqueados').doc(fcBlockDocId).delete()
      } catch { /* ignored */ }
      await ok()
      return
    }
    const extId = externalBlockDocId(event.id)
    const extSnap = await db.collection('diasBloqueados').doc(extId).get()
    if (extSnap.exists) {
      await db.collection('diasBloqueados').doc(extId).delete()
    }
    await ok()
    return
  }

  // ── CASO 2: agendamento nosso ───────────────────────────────────────────────
  if (fcType === 'agendamento' && fcAgendamentoId) {
    const ref = db.collection('agendamentos').doc(fcAgendamentoId)
    const snap = await ref.get()
    if (!snap.exists) { await ok(); return }
    const cur = snap.data() || {}

    if (cur.lastGoogleSyncAt) {
      const lastMs = (cur.lastGoogleSyncAt as Timestamp).toMillis()
      if (eventUpdated && eventUpdated - lastMs <= ECHO_TOLERANCE_MS) { await ok(); return }
    }

    const novaData = dataDoEvento(event)
    const novaHoraInicio = horaDoEvento(event)
    const novaHoraFim = horaFimDoEvento(event)

    const patch: Record<string, unknown> = {}
    if (novaData && novaData !== cur.data) patch.data = novaData
    if (novaHoraInicio && novaHoraInicio !== cur.horaInicio) patch.horaInicio = novaHoraInicio
    if (novaHoraFim && novaHoraFim !== cur.horaFim) patch.horaFim = novaHoraFim

    if (Object.keys(patch).length > 0) {
      patch.lastGoogleSyncAt = Timestamp.now()
      await ref.update(patch)
    }
    await ok()
    return
  }

  // ── CASO 3: bloqueio criado por nós (atualizado no Google) ─────────────────
  if (fcType === 'block' && fcBlockDocId) {
    const ref = db.collection('diasBloqueados').doc(fcBlockDocId)
    const snap = await ref.get()
    if (!snap.exists) { await ok(); return }
    const cur = snap.data() || {}
    const novaData = dataDoEvento(event)
    if (novaData && novaData !== cur.data) {
      await ref.update({ data: novaData })
    }
    await ok()
    return
  }

  // ── CASO 4: evento criado externamente no Google ────────────────────────────
  const extId = externalBlockDocId(event.id)
  const data = dataDoEvento(event)
  if (!data) { await ok(); return }

  const allDay = isAllDay(event)
  const horaInicio = horaDoEvento(event)
  const motivo = event.summary || 'Evento externo no Google Calendar'

  await db.collection('diasBloqueados').doc(extId).set(
    {
      data,
      motivo,
      bloqueioTotal: allDay,
      horasBloqueadas: allDay ? [] : (horaInicio ? [horaInicio] : []),
      origem: 'google-externo',
      googleEventId: event.id,
      googleEventUpdated: event.updated || null,
      atualizadoEm: Timestamp.now(),
    },
    { merge: true },
  )
  await ok()
}
