import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  upsertCalendarEventVerbose,
  deleteCalendarEvent,
} from '@/lib/googleCalendar'
import { withRetry } from '@/lib/retry'
import { logSync } from '@/lib/syncLog'
import { google, calendar_v3 } from 'googleapis'
import crypto from 'node:crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const ESTADOS_ATIVOS = ['pendente', 'confirmado', 'pago']
const SCOPES = ['https://www.googleapis.com/auth/calendar']

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

const msFrom = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0)

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
  // Aceita admin OU cron secret (x-cron-secret OU Authorization: Bearer do Vercel Cron)
  const cronHeader =
    req.headers.get('x-cron-secret') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const isCron = cronHeader && process.env.CRON_SECRET && safeEqual(cronHeader, process.env.CRON_SECRET)

  if (!isCron) {
    const auth = await verifyAdminRequest(req)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const sb = supabaseAdmin()

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

  // 3. Agendamentos ativos futuros no Supabase
  const { data: ativosRows, error: ativosErr } = await sb
    .from('agendamentos')
    .select('*')
    .gte('data', hojeStr)
    .in('estado', ESTADOS_ATIVOS)
  if (ativosErr) {
    await logSync({ operation: 'full_reconcile', status: 'error', durationMs: Date.now() - start, errorMessage: ativosErr.message })
    return NextResponse.json({ error: `Erro a ler agendamentos: ${ativosErr.message}` }, { status: 500 })
  }
  const ativos = ativosRows || []
  counters.agendamentosTotal = ativos.length

  // 4. Para cada agendamento, decidir ação
  for (const a of ativos) {
    const id = a.id as string
    const gEvent = a.google_event_id ? googleById.get(a.google_event_id) : undefined

    try {
      if (a.google_event_id && gEvent) {
        // Comparar campos chave; decidir vencedor por timestamp mais recente
        const eventUpdatedMs = gEvent.updated ? new Date(gEvent.updated).getTime() : 0
        const localUpdatedMs = msFrom(a.last_google_sync_at)

        const eventoStartDate = gEvent.start?.dateTime?.slice(0, 10) || gEvent.start?.date || ''
        const eventoStartHora = gEvent.start?.dateTime?.split('T')[1]?.slice(0, 5) || ''
        const eventoEndHora = gEvent.end?.dateTime?.split('T')[1]?.slice(0, 5) || ''

        const dadosIguais =
          eventoStartDate === a.data && eventoStartHora === a.hora_inicio && eventoEndHora === (a.hora_fim || '')

        if (dadosIguais) {
          // Marcar como visitado para depois detetar bloqueios sem agendamento
          googleById.delete(a.google_event_id)
          continue
        }

        if (eventUpdatedMs > localUpdatedMs) {
          // Google é mais recente → atualizar Supabase
          await sb
            .from('agendamentos')
            .update({
              data: eventoStartDate || a.data,
              hora_inicio: eventoStartHora || a.hora_inicio,
              hora_fim: eventoEndHora || a.hora_fim,
              last_google_sync_at: new Date().toISOString(),
            })
            .eq('id', id)
          counters.agendamentosAtualizados++
        } else {
          // Supabase é mais recente → atualizar Google
          const result = await upsertCalendarEventVerbose({
            clienteNome: a.cliente_nome || '',
            clienteEmail: a.cliente_email || '',
            clienteTelefone: a.cliente_telefone || '',
            servicoNome: a.servico_nome || '',
            data: a.data,
            horaInicio: a.hora_inicio,
            horaFim: a.hora_fim || '',
            agendamentoId: id,
            estado: a.estado,
            googleEventId: a.google_event_id,
          })
          if (!result.ok) {
            erros.push({ tipo: 'agendamento_update', id, motivo: result.error })
          } else {
            await sb
              .from('agendamentos')
              .update({ last_google_sync_at: new Date().toISOString() })
              .eq('id', id)
            counters.agendamentosAtualizados++
          }
        }
        googleById.delete(a.google_event_id)
      } else if (a.google_event_id && !gEvent) {
        // Tinha evento mas não está mais no Google — foi apagado externamente
        await sb
          .from('agendamentos')
          .update({ estado: 'cancelado', last_google_sync_at: new Date().toISOString() })
          .eq('id', id)
        counters.agendamentosCancelados++
      } else {
        // Sem googleEventId — criar
        const result = await upsertCalendarEventVerbose({
          clienteNome: a.cliente_nome || '',
          clienteEmail: a.cliente_email || '',
          clienteTelefone: a.cliente_telefone || '',
          servicoNome: a.servico_nome || '',
          data: a.data,
          horaInicio: a.hora_inicio,
          horaFim: a.hora_fim || '',
          agendamentoId: id,
          estado: a.estado,
        })
        if (!result.ok) {
          erros.push({ tipo: 'agendamento_create', id, motivo: result.error })
        } else {
          await sb
            .from('agendamentos')
            .update({ google_event_id: result.eventId, last_google_sync_at: new Date().toISOString() })
            .eq('id', id)
          counters.agendamentosCriados++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      erros.push({ tipo: 'agendamento', id, motivo: msg })
    }
  }

  // 5+6. Eventos restantes em googleById: pertencem a outros agendamentos (não ativos) ou são externos
  const { data: bloqueiosRows } = await sb
    .from('dias_bloqueados')
    .select('*')
    .gte('data', hojeStr)
  const bloqueios = bloqueiosRows || []
  const bloqueiosByEventId = new Map<string, string>() // googleEventId -> docId
  const bloqueiosById = new Map<string, Record<string, any>>()
  for (const d of bloqueios) {
    bloqueiosById.set(d.id, d)
    if (d.google_event_id) bloqueiosByEventId.set(d.google_event_id, d.id)
    if (Array.isArray(d.google_event_ids)) {
      for (const eid of d.google_event_ids) bloqueiosByEventId.set(eid, d.id)
    }
  }

  for (const [eventId, event] of googleById.entries()) {
    const fcType = event.extendedProperties?.private?.fcType
    const fcAgendamentoId = event.extendedProperties?.private?.fcAgendamentoId

    if (fcType === 'agendamento') {
      // Evento órfão — agendamento foi apagado mas evento ficou
      if (fcAgendamentoId) {
        const { data: exists } = await sb
          .from('agendamentos')
          .select('id')
          .eq('id', fcAgendamentoId)
          .maybeSingle()
        if (!exists) {
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

    // CASO 6: criado externamente — upsert em dias_bloqueados
    const extId = externalBlockDocId(eventId)
    const data = event.start?.date || event.start?.dateTime?.slice(0, 10) || ''
    if (!data) continue
    const allDay = !!event.start?.date && !event.start?.dateTime
    const horaInicio = event.start?.dateTime?.split('T')[1]?.slice(0, 5) || ''
    const motivo = event.summary || 'Evento externo'

    try {
      await sb.from('dias_bloqueados').upsert(
        {
          id: extId,
          data,
          motivo,
          bloqueio_total: allDay,
          horas_bloqueadas: allDay ? [] : (horaInicio ? [horaInicio] : []),
          origem: 'google-externo',
          google_event_id: eventId,
          google_event_updated: event.updated || null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'id' },
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
    const data = bloqueiosById.get(docId)
    if (!data) continue
    if (data.origem !== 'google-externo') {
      counters.bloqueiosMantidos++
      continue
    }
    // Sem retentar — se está aqui, é porque o evento Google desapareceu
    try {
      await sb.from('dias_bloqueados').delete().eq('id', docId)
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
