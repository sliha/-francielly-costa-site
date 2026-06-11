import 'server-only'
import { google, calendar_v3 } from 'googleapis'
import crypto from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getProcessed, markProcessed, makeKey } from '@/lib/idempotency'
import { withRetry } from '@/lib/retry'
import { logSync } from '@/lib/syncLog'
import { emitirAlerta, notificarAdminsPorEmail } from '@/lib/alertas'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const SYNC_KEY = 'googleCalendarSync'
const WEBHOOK_PATH = '/api/google-calendar/webhook'
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'
const CHANNEL_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias (max Google)
const ECHO_TOLERANCE_MS = 5_000

export interface GoogleCalendarSyncState {
  syncToken?: string
  channelId?: string
  channelResourceId?: string
  channelExpiration?: number
  channelCreatedAt?: string
  lastSyncAt?: string
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

// ───────────── Estado de sync (tabela settings, jsonb) ─────────────
export async function getSyncState(): Promise<GoogleCalendarSyncState> {
  const { data } = await supabaseAdmin()
    .from('settings')
    .select('value')
    .eq('key', SYNC_KEY)
    .maybeSingle()
  return (data?.value as GoogleCalendarSyncState) || {}
}

// patch com valor `undefined` remove a chave
async function setSyncState(patch: Partial<Record<keyof GoogleCalendarSyncState, unknown>>): Promise<void> {
  const cur = await getSyncState()
  const next: Record<string, unknown> = { ...cur }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete next[k]
    else next[k] = v
  }
  await supabaseAdmin()
    .from('settings')
    .upsert({ key: SYNC_KEY, value: next, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

async function clearChannelFields(): Promise<void> {
  await setSyncState({
    channelId: undefined,
    channelResourceId: undefined,
    channelExpiration: undefined,
    channelCreatedAt: undefined,
  })
}

const nowIso = () => new Date().toISOString()

/**
 * Full sync inicial (lista tudo paginado) e devolve o `nextSyncToken`.
 */
async function fullSync(
  client: calendar_v3.Calendar,
  calendarId: string,
): Promise<{ syncToken?: string; processed: number; errors: string[] }> {
  const errors: string[] = []
  let pageToken: string | undefined
  let syncToken: string | undefined
  let processed = 0
  // Limita o full sync a eventos recentes/futuros (evita percorrer anos de histórico,
  // que faria a função serverless exceder o tempo-limite). Cobre alterações dos últimos
  // 7 dias em diante — suficiente para slots/bloqueios; o nextSyncToken respeita esta janela.
  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  do {
    try {
      const res = await withRetry(
        () =>
          client.events.list({
            calendarId,
            singleEvents: true,
            showDeleted: true,
            timeMin,
            pageToken,
            maxResults: 250,
          }),
        { label: 'fullSync.events.list' },
      )
      const items = res.data.items || []
      for (const event of items) {
        try {
          await applyEventToDb(event)
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

  // Parar canal antigo (best-effort)
  try {
    const prev = await getSyncState()
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

  await setSyncState({
    channelId,
    channelResourceId,
    channelExpiration,
    channelCreatedAt: nowIso(),
  })

  // Full sync inicial para obter syncToken
  try {
    const sync = await fullSync(cli.client, cli.calendarId)
    await setSyncState({
      syncToken: sync.syncToken,
      lastSyncAt: nowIso(),
      lastSyncStatus: sync.errors.length === 0 ? 'ok' : 'error',
      lastError: sync.errors.slice(0, 5).join(' | ') || undefined,
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

  const state = await getSyncState()
  if (!state.channelId || !state.channelResourceId) {
    await clearChannelFields()
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
    console.warn('channels.stop falhou:', err)
  }

  await clearChannelFields()
  await logSync({ operation: 'stop_watch', status: 'ok', durationMs: 0 })
  return { ok: true }
}

export async function renewWatchChannel(): Promise<{ ok: boolean; error?: string }> {
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

  const state = await getSyncState()
  const errors: string[] = []
  let processed = 0
  let nextSyncToken: string | undefined
  let pageToken: string | undefined

  // Sem syncToken → full sync
  if (!state.syncToken) {
    const sync = await fullSync(cli.client, cli.calendarId)
    await setSyncState({
      syncToken: sync.syncToken,
      lastSyncAt: nowIso(),
      lastSyncStatus: sync.errors.length === 0 ? 'ok' : 'error',
      lastError: sync.errors.slice(0, 5).join(' | ') || undefined,
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
          await applyEventToDb(event)
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
        await setSyncState({ syncToken: undefined })
        const sync = await fullSync(cli.client, cli.calendarId)
        await setSyncState({
          syncToken: sync.syncToken,
          lastSyncAt: nowIso(),
          lastSyncStatus: 'full-resync-needed',
          lastError: 'Token expirou; full resync executado',
        })
        return { processed: sync.processed, errors: sync.errors }
      }
      errors.push(`list: ${err instanceof Error ? err.message : String(err)}`)
      break
    }
    currentSyncToken = undefined
  } while (pageToken)

  const prevFails = (state.metadata as { failureStreak?: number } | undefined)?.failureStreak ?? 0
  const newStreak = errors.length === 0 ? 0 : prevFails + 1

  await setSyncState({
    syncToken: nextSyncToken || state.syncToken,
    lastSyncAt: nowIso(),
    lastSyncStatus: errors.length === 0 ? 'ok' : 'error',
    lastError: errors.slice(0, 5).join(' | ') || undefined,
    metadata: { failureStreak: newStreak },
  })

  await logSync({
    operation: 'webhook_google',
    status: errors.length === 0 ? 'ok' : 'error',
    durationMs: Date.now() - start,
    metadata: { processed, errorsCount: errors.length },
    ...(errors.length > 0 ? { errorMessage: errors.slice(0, 3).join(' | ') } : {}),
  })

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

export async function forceFullResync(): Promise<{ ok: boolean; processed: number; errors: string[] }> {
  await setSyncState({ syncToken: undefined })
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
  if (event.start?.date) return event.start.date
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

const msFrom = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0)

/**
 * Aplica um evento (criado/atualizado/cancelado no Google) ao Supabase. Idempotente.
 */
async function applyEventToDb(event: calendar_v3.Schema$Event): Promise<void> {
  if (!event.id) return
  const sb = supabaseAdmin()

  const idKey = makeKey('google-calendar', event.id, event.updated || event.etag || '')
  const prior = await getProcessed(idKey)
  if (prior?.result === 'ok') return

  const fcType = event.extendedProperties?.private?.fcType
  const fcAgendamentoId = event.extendedProperties?.private?.fcAgendamentoId
  const fcBlockDocId = event.extendedProperties?.private?.fcBlockDocId
  const eventUpdated = event.updated ? new Date(event.updated).getTime() : 0

  const ok = () => markProcessed(idKey, 'google-calendar', 'ok').catch(() => {})

  // ── CASO 1: evento cancelado ──
  if (event.status === 'cancelled') {
    if (fcAgendamentoId) {
      const { data: cur } = await sb
        .from('agendamentos')
        .select('estado, last_google_sync_at')
        .eq('id', fcAgendamentoId)
        .maybeSingle()
      if (cur) {
        const lastMs = msFrom(cur.last_google_sync_at)
        if (lastMs && eventUpdated && eventUpdated - lastMs <= ECHO_TOLERANCE_MS) {
          await ok()
          return
        }
        if (cur.estado !== 'cancelado') {
          await sb
            .from('agendamentos')
            .update({ estado: 'cancelado', last_google_sync_at: nowIso() })
            .eq('id', fcAgendamentoId)
        }
      }
      await ok()
      return
    }
    if (fcBlockDocId) {
      await sb.from('dias_bloqueados').delete().eq('id', fcBlockDocId)
      await ok()
      return
    }
    const extId = externalBlockDocId(event.id)
    await sb.from('dias_bloqueados').delete().eq('id', extId)
    await ok()
    return
  }

  // ── CASO 2: agendamento nosso ──
  if (fcType === 'agendamento' && fcAgendamentoId) {
    const { data: cur } = await sb
      .from('agendamentos')
      .select('data, hora_inicio, hora_fim, last_google_sync_at')
      .eq('id', fcAgendamentoId)
      .maybeSingle()
    if (!cur) { await ok(); return }

    const lastMs = msFrom(cur.last_google_sync_at)
    if (lastMs && eventUpdated && eventUpdated - lastMs <= ECHO_TOLERANCE_MS) { await ok(); return }

    const novaData = dataDoEvento(event)
    const novaHoraInicio = horaDoEvento(event)
    const novaHoraFim = horaFimDoEvento(event)

    const patch: Record<string, unknown> = {}
    if (novaData && novaData !== cur.data) patch.data = novaData
    if (novaHoraInicio && novaHoraInicio !== cur.hora_inicio) patch.hora_inicio = novaHoraInicio
    if (novaHoraFim && novaHoraFim !== cur.hora_fim) patch.hora_fim = novaHoraFim

    if (Object.keys(patch).length > 0) {
      patch.last_google_sync_at = nowIso()
      await sb.from('agendamentos').update(patch).eq('id', fcAgendamentoId)
    }
    await ok()
    return
  }

  // ── CASO 3: bloqueio criado por nós (atualizado no Google) ──
  if (fcType === 'block' && fcBlockDocId) {
    const { data: cur } = await sb
      .from('dias_bloqueados')
      .select('data')
      .eq('id', fcBlockDocId)
      .maybeSingle()
    if (!cur) { await ok(); return }
    const novaData = dataDoEvento(event)
    if (novaData && novaData !== cur.data) {
      await sb.from('dias_bloqueados').update({ data: novaData }).eq('id', fcBlockDocId)
    }
    await ok()
    return
  }

  // ── CASO 4: evento criado externamente no Google ──
  const extId = externalBlockDocId(event.id)
  const data = dataDoEvento(event)
  if (!data) { await ok(); return }

  const allDay = isAllDay(event)
  const horaInicio = horaDoEvento(event)
  const motivo = event.summary || 'Evento externo no Google Calendar'

  await sb.from('dias_bloqueados').upsert(
    {
      id: extId,
      data,
      motivo,
      bloqueio_total: allDay,
      horas_bloqueadas: allDay ? [] : (horaInicio ? [horaInicio] : []),
      origem: 'google-externo',
      google_event_id: event.id,
      google_event_updated: event.updated || null,
      atualizado_em: nowIso(),
    },
    { onConflict: 'id' },
  )
  await ok()
}
