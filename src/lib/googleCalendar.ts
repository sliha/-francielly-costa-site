import { google, calendar_v3 } from 'googleapis'
import { withRetry } from '@/lib/retry'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const TIMEZONE = 'Europe/Lisbon'
const DURACAO_PADRAO_MIN = 90

export interface AgendamentoCalendar {
  clienteNome: string
  clienteEmail: string
  clienteTelefone: string
  servicoNome: string
  data: string // 'YYYY-MM-DD'
  horaInicio: string // 'HH:MM'
  horaFim?: string // 'HH:MM' opcional
  caucaoValor?: number
  agendamentoId?: string
  estado?: 'pendente' | 'pendente_pagamento' | 'confirmado' | 'pago' | 'concluido' | 'cancelado'
}

export type EstadoAgendamento = NonNullable<AgendamentoCalendar['estado']>

function getCalendarClient(): { client: calendar_v3.Calendar; serviceAccountEmail: string } | { error: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    return { error: 'GOOGLE_SERVICE_ACCOUNT_KEY não está presente em process.env (verifica apphosting.yaml + IAM da service account no secret)' }
  }
  if (raw.length < 50) {
    return { error: `GOOGLE_SERVICE_ACCOUNT_KEY parece truncada (length=${raw.length})` }
  }

  let credentials: { client_email?: string; private_key?: string }
  try {
    credentials = JSON.parse(raw)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `GOOGLE_SERVICE_ACCOUNT_KEY não é JSON válido: ${msg} (primeiros chars: "${raw.slice(0, 30)}")` }
  }

  if (!credentials.client_email || !credentials.private_key) {
    return { error: 'JSON do GOOGLE_SERVICE_ACCOUNT_KEY não tem client_email ou private_key' }
  }

  try {
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    })
    return {
      client: google.calendar({ version: 'v3', auth }),
      serviceAccountEmail: credentials.client_email,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Erro ao criar auth JWT: ${msg}` }
  }
}

function calcularHoraFim(horaInicio: string, duracaoMin = DURACAO_PADRAO_MIN): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const total = h * 60 + m + duracaoMin
  const fimH = Math.floor(total / 60)
  const fimM = total % 60
  return `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`
}

function prefixoEstado(estado?: EstadoAgendamento): string {
  if (!estado) return ''
  const map: Record<EstadoAgendamento, string> = {
    pendente: '[PENDENTE] ',
    pendente_pagamento: '[PENDENTE] ',
    confirmado: '[CONFIRMADO] ',
    pago: '[PAGO] ',
    concluido: '[CONCLUIDO] ',
    cancelado: '',
  }
  return map[estado] || ''
}

function montarRequestBody(agendamento: AgendamentoCalendar): calendar_v3.Schema$Event {
  const horaFim = agendamento.horaFim || calcularHoraFim(agendamento.horaInicio)
  const caucao = agendamento.caucaoValor ?? 30
  const prefixo = prefixoEstado(agendamento.estado)

  const body: calendar_v3.Schema$Event = {
    summary: `${prefixo}Francielly Costa — ${agendamento.clienteNome} — ${agendamento.servicoNome}`,
    description: `Tel: ${agendamento.clienteTelefone}\nEmail: ${agendamento.clienteEmail}\nCaução: ${caucao}€${agendamento.estado === 'pago' || agendamento.estado === 'confirmado' ? ' paga' : ''}`,
    start: {
      dateTime: `${agendamento.data}T${agendamento.horaInicio}:00`,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: `${agendamento.data}T${horaFim}:00`,
      timeZone: TIMEZONE,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
    extendedProperties: {
      private: {
        ...(agendamento.agendamentoId ? { fcAgendamentoId: agendamento.agendamentoId } : {}),
        fcType: 'agendamento',
        ...(agendamento.estado ? { fcEstado: agendamento.estado } : {}),
      },
    },
  }

  // Nota: NÃO adicionamos attendees. Service accounts em contas Gmail (sem Domain-Wide
  // Delegation / Workspace) não podem convidar attendees — falharia com erro 403.
  // O cliente recebe email via Resend, não perde nada operacional.

  return body
}

/**
 * Cria evento normal no Google Calendar.
 * Mantém compatibilidade com chamadas existentes (param agendamentoId é opcional).
 */
export async function createCalendarEvent(agendamento: AgendamentoCalendar): Promise<string | null> {
  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) {
    console.warn('Calendar:', result.error)
    return null
  }
  if (!calendarId) {
    console.warn('GOOGLE_CALENDAR_ID não configurado')
    return null
  }

  const body = montarRequestBody({ ...agendamento, estado: agendamento.estado || 'confirmado' })

  try {
    const res = await withRetry(
      () =>
        result.client.events.insert({
          calendarId,
          requestBody: body,
          sendUpdates: 'externalOnly',
          conferenceDataVersion: 0,
        }),
      { label: 'createCalendarEvent.insert' },
    )
    return res.data.id ?? null
  } catch (err) {
    console.error('Erro ao criar evento no Google Calendar:', err)
    return null
  }
}

/**
 * Atualiza evento existente. Tratamento de 404 como "ok silencioso".
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<AgendamentoCalendar>
): Promise<boolean> {
  if (updates.estado === 'cancelado') {
    return deleteCalendarEvent(eventId)
  }

  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) {
    console.warn('Calendar:', result.error)
    return false
  }
  if (!calendarId) return false

  // Buscar evento atual para fazer merge com updates parciais
  let atual: calendar_v3.Schema$Event
  try {
    const get = await withRetry(
      () => result.client.events.get({ calendarId, eventId }),
      { label: 'updateCalendarEvent.get' },
    )
    atual = get.data
  } catch (err) {
    const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
    if (status === 404 || status === 410) {
      console.warn(`Evento ${eventId} já não existe no Google (status ${status}) — tratado como sucesso`)
      return true
    }
    console.error('Erro ao buscar evento Google:', err)
    return false
  }

  // Combinar dados — usa updates onde fornecido, atual onde não
  const parseSummary = (s?: string | null) => {
    if (!s) return { cliente: '', servico: '' }
    const semPrefixo = s.replace(/^\[(PENDENTE|CONFIRMADO|PAGO|CONCLUIDO)\]\s*/, '')
    const partes = semPrefixo.split(' — ')
    return { cliente: partes[1] || '', servico: partes[2] || '' }
  }
  const { cliente: clienteAtual, servico: servicoAtual } = parseSummary(atual.summary)

  // Extrair telefone/email da description atual (formato controlado)
  const descLines = (atual.description || '').split('\n')
  const telAtual = descLines.find((l) => l.startsWith('Tel:'))?.replace('Tel:', '').trim() || ''
  const emailAtual = descLines.find((l) => l.startsWith('Email:'))?.replace('Email:', '').trim() || ''

  // Extrair data/hora do start atual
  const startAtual = atual.start?.dateTime || ''
  const endAtual = atual.end?.dateTime || ''
  const dataAtual = startAtual.split('T')[0] || ''
  const horaInicioAtual = startAtual.split('T')[1]?.slice(0, 5) || ''
  const horaFimAtual = endAtual.split('T')[1]?.slice(0, 5) || ''

  const merged: AgendamentoCalendar = {
    clienteNome: updates.clienteNome ?? clienteAtual,
    clienteEmail: updates.clienteEmail ?? emailAtual,
    clienteTelefone: updates.clienteTelefone ?? telAtual,
    servicoNome: updates.servicoNome ?? servicoAtual,
    data: updates.data ?? dataAtual,
    horaInicio: updates.horaInicio ?? horaInicioAtual,
    horaFim: updates.horaFim ?? horaFimAtual,
    caucaoValor: updates.caucaoValor,
    agendamentoId:
      updates.agendamentoId ?? (atual.extendedProperties?.private?.fcAgendamentoId || undefined),
    estado:
      updates.estado ?? ((atual.extendedProperties?.private?.fcEstado as EstadoAgendamento) || 'confirmado'),
  }

  const body = montarRequestBody(merged)

  try {
    await withRetry(
      () =>
        result.client.events.patch({
          calendarId,
          eventId,
          requestBody: body,
          sendUpdates: 'externalOnly',
        }),
      { label: 'updateCalendarEvent.patch' },
    )
    return true
  } catch (err) {
    const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
    if (status === 404 || status === 410) {
      console.warn(`Evento ${eventId} desapareceu durante o patch — tratado como sucesso`)
      return true
    }
    console.error('Erro ao atualizar evento no Google Calendar:', err)
    return false
  }
}

/**
 * Cria evento de bloqueio (admin bloqueia dia/horas).
 * - bloqueioTotal=true → evento all-day.
 * - Caso contrário → evento normal entre horaInicio/horaFim.
 */
export async function createBlockEvent(params: {
  data: string // 'YYYY-MM-DD'
  horaInicio?: string // 'HH:MM' — necessário se !bloqueioTotal
  horaFim?: string // 'HH:MM'
  motivo: string
  bloqueioTotal: boolean
  docId?: string // Firestore doc id do bloqueio
}): Promise<string | null> {
  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) {
    console.warn('Calendar:', result.error)
    return null
  }
  if (!calendarId) return null

  const body: calendar_v3.Schema$Event = {
    summary: `🚫 BLOQUEADO — ${params.motivo}`,
    description: 'Bloqueio criado pelo admin do site. NÃO apagar manualmente — usar /admin/agenda.',
    extendedProperties: {
      private: {
        fcType: 'block',
        ...(params.docId ? { fcBlockDocId: params.docId } : {}),
      },
    },
  }

  if (params.bloqueioTotal) {
    // Evento all-day: end.date é o dia seguinte (exclusivo)
    const d = new Date(params.data + 'T00:00:00')
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const yyyy = next.getFullYear()
    const mm = String(next.getMonth() + 1).padStart(2, '0')
    const dd = String(next.getDate()).padStart(2, '0')
    body.start = { date: params.data }
    body.end = { date: `${yyyy}-${mm}-${dd}` }
    body.transparency = 'opaque'
  } else {
    const hi = params.horaInicio || '10:00'
    const hf = params.horaFim || calcularHoraFim(hi, 30)
    body.start = { dateTime: `${params.data}T${hi}:00`, timeZone: TIMEZONE }
    body.end = { dateTime: `${params.data}T${hf}:00`, timeZone: TIMEZONE }
  }

  try {
    const res = await withRetry(
      () => result.client.events.insert({ calendarId, requestBody: body }),
      { label: 'createBlockEvent.insert' },
    )
    return res.data.id ?? null
  } catch (err) {
    console.error('Erro ao criar evento de bloqueio:', err)
    return null
  }
}

/**
 * Upsert inteligente: se agendamento já tiver googleEventId, atualiza; senão, cria.
 */
export async function upsertCalendarEventWithMetadata(
  agendamento: AgendamentoCalendar & { googleEventId?: string }
): Promise<string | null> {
  if (agendamento.googleEventId) {
    const ok = await updateCalendarEvent(agendamento.googleEventId, agendamento)
    return ok ? agendamento.googleEventId : null
  }
  return createCalendarEvent(agendamento)
}

/**
 * Versão verbose do upsert: devolve detalhe do erro em vez de só null.
 * Usada por endpoints administrativos (ex.: resync-all) para diagnóstico.
 */
export async function upsertCalendarEventVerbose(
  agendamento: AgendamentoCalendar & { googleEventId?: string }
): Promise<{ ok: true; eventId: string; mode: 'create' | 'update' } | { ok: false; error: string }> {
  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) return { ok: false, error: result.error }
  if (!calendarId) return { ok: false, error: 'GOOGLE_CALENDAR_ID não configurado' }
  const client = result.client

  if (agendamento.googleEventId) {
    // Update path — tenta patch direto
    try {
      const body = montarRequestBody({ ...agendamento, estado: agendamento.estado || 'confirmado' })
      await withRetry(
        () =>
          client.events.patch({
            calendarId,
            eventId: agendamento.googleEventId!,
            requestBody: body,
            sendUpdates: 'externalOnly',
          }),
        { label: 'upsertVerbose.patch' },
      )
      return { ok: true, eventId: agendamento.googleEventId, mode: 'update' }
    } catch (err) {
      const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
      if (status === 404 || status === 410) {
        // Evento já não existe → criar novo abaixo
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        return { ok: false, error: `patch ${agendamento.googleEventId}: ${msg}` }
      }
    }
  }

  // Create path
  try {
    const body = montarRequestBody({ ...agendamento, estado: agendamento.estado || 'confirmado' })
    const res = await withRetry(
      () =>
        client.events.insert({
          calendarId,
          requestBody: body,
          sendUpdates: 'externalOnly',
          conferenceDataVersion: 0,
        }),
      { label: 'upsertVerbose.insert' },
    )
    if (!res.data.id) return { ok: false, error: 'insert: resposta sem eventId' }
    return { ok: true, eventId: res.data.id, mode: 'create' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `insert: ${msg}` }
  }
}

export async function createConsultaVirtualEvent(params: {
  clienteNome: string
  clienteEmail: string
  servicoInteresse: string
  data: string // 'YYYY-MM-DD'
  hora: string // 'HH:MM'
  duvida?: string
}): Promise<{ ok: true; eventId: string; meetLink: string } | { ok: false; error: string; fallbackMeetLink: string }> {
  const fallbackMeetLink = `https://meet.google.com/new`
  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) return { ok: false, error: result.error, fallbackMeetLink }
  if (!calendarId) return { ok: false, error: 'GOOGLE_CALENDAR_ID em falta', fallbackMeetLink }
  const calendar = result.client

  const horaFim = (() => {
    const [h, m] = params.hora.split(':').map(Number)
    const total = h * 60 + m + 15
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })()

  try {
    const res = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: 'externalOnly',
      requestBody: {
        summary: `Consulta Virtual — ${params.clienteNome}`,
        description: `Cliente: ${params.clienteNome}\nEmail: ${params.clienteEmail}\nServiço: ${params.servicoInteresse}\nDúvida: ${params.duvida || '—'}`,
        start: { dateTime: `${params.data}T${params.hora}:00`, timeZone: TIMEZONE },
        end: { dateTime: `${params.data}T${horaFim}:00`, timeZone: TIMEZONE },
        // attendees omitido — service account sem Workspace não pode convidar
        conferenceData: {
          createRequest: {
            requestId: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      },
    })

    const meetLink =
      res.data.hangoutLink ||
      res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
      ''

    if (!res.data.id) return { ok: false, error: 'Resposta sem eventId', fallbackMeetLink }
    if (!meetLink) {
      return { ok: false, error: 'Não foi possível gerar Meet link (precisa de Workspace)', fallbackMeetLink }
    }
    return { ok: true, eventId: res.data.id, meetLink }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg, fallbackMeetLink }
  }
}

/**
 * Diagnóstico estruturado: verifica passo-a-passo se a integração está OK.
 */
export interface DiagnosticoCalendar {
  checks: {
    serviceAccountKey: { ok: boolean; error?: string }
    calendarId: { ok: boolean; value?: string }
    auth: { ok: boolean; error?: string; serviceAccountEmail?: string }
    insertAndDelete: { ok: boolean; error?: string; testEventId?: string }
  }
  overallOk: boolean
  hint?: string
}

export async function diagnosticarCalendar(): Promise<DiagnosticoCalendar> {
  const out: DiagnosticoCalendar = {
    checks: {
      serviceAccountKey: { ok: false },
      calendarId: { ok: false },
      auth: { ok: false },
      insertAndDelete: { ok: false },
    },
    overallOk: false,
  }

  // 1. Service account key parseável
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    out.checks.serviceAccountKey = { ok: false, error: 'GOOGLE_SERVICE_ACCOUNT_KEY não definida' }
    return out
  }
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.client_email || !parsed.private_key) {
      out.checks.serviceAccountKey = { ok: false, error: 'JSON sem client_email ou private_key' }
      return out
    }
    out.checks.serviceAccountKey = { ok: true }
    out.checks.auth.serviceAccountEmail = parsed.client_email
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    out.checks.serviceAccountKey = { ok: false, error: `JSON inválido: ${msg}` }
    return out
  }

  // 2. Calendar ID
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) {
    out.checks.calendarId = { ok: false }
    out.hint = 'GOOGLE_CALENDAR_ID em falta em apphosting.yaml'
    return out
  }
  out.checks.calendarId = { ok: true, value: calendarId }

  // 3. Auth (criar JWT + cliente)
  const cli = getCalendarClient()
  if ('error' in cli) {
    out.checks.auth = { ok: false, error: cli.error, serviceAccountEmail: out.checks.auth.serviceAccountEmail }
    return out
  }
  out.checks.auth = { ok: true, serviceAccountEmail: cli.serviceAccountEmail }

  // 4. Insert + delete (round-trip real)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yyyy = tomorrow.getFullYear()
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  let testEventId: string | undefined
  try {
    const res = await withRetry(
      () =>
        cli.client.events.insert({
          calendarId,
          requestBody: {
            summary: 'DIAGNÓSTICO FC — Apagar este evento',
            description: 'Evento de diagnóstico gerado automaticamente — pode ser ignorado.',
            start: { dateTime: `${dateStr}T03:00:00`, timeZone: TIMEZONE },
            end: { dateTime: `${dateStr}T03:15:00`, timeZone: TIMEZONE },
            extendedProperties: { private: { fcType: 'diagnostic' } },
          },
        }),
      { label: 'diagnosticarCalendar.insert' },
    )
    testEventId = res.data.id ?? undefined
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    out.checks.insertAndDelete = { ok: false, error: msg }
    out.hint = `O calendário ${calendarId} provavelmente não está partilhado com a service account ${out.checks.auth.serviceAccountEmail}. Abre o Google Calendar com a conta da Francielly → Definições do calendário → "Partilhar com pessoas e grupos específicos" → adiciona o email da service account com permissão "Fazer alterações nos eventos".`
    return out
  }

  if (testEventId) {
    try {
      await cli.client.events.delete({ calendarId, eventId: testEventId })
    } catch {
      // Não bloqueia — só fica o evento de diagnóstico no calendário
    }
  }

  out.checks.insertAndDelete = { ok: true, testEventId }
  out.overallOk = true
  return out
}

export async function createTestEvent(): Promise<{ ok: true; eventId: string; htmlLink?: string } | { ok: false; error: string }> {
  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) return { ok: false, error: result.error }
  if (!calendarId) return { ok: false, error: 'GOOGLE_CALENDAR_ID não configurado em process.env' }
  const calendar = result.client

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yyyy = tomorrow.getFullYear()
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: 'TESTE — Apagar este evento',
        description: 'Evento de teste da integração do site',
        start: { dateTime: `${dateStr}T10:00:00`, timeZone: TIMEZONE },
        end: { dateTime: `${dateStr}T10:30:00`, timeZone: TIMEZONE },
      },
    })
    if (!res.data.id) return { ok: false, error: 'Resposta sem eventId' }
    return { ok: true, eventId: res.data.id, htmlLink: res.data.htmlLink ?? undefined }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const result = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if ('error' in result) {
    console.warn('Calendar:', result.error)
    return false
  }
  if (!calendarId) return false
  const calendar = result.client

  try {
    await withRetry(
      () => calendar.events.delete({ calendarId, eventId }),
      { label: 'deleteCalendarEvent' },
    )
    return true
  } catch (err) {
    const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
    if (status === 404 || status === 410) {
      console.warn(`Evento ${eventId} já não existe — tratado como sucesso`)
      return true
    }
    console.error('Erro ao remover evento do Google Calendar:', err)
    return false
  }
}
