import { google, calendar_v3 } from 'googleapis'

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
}

function getCalendarClient(): { client: calendar_v3.Calendar } | { error: string } {
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
    return { client: google.calendar({ version: 'v3', auth }) }
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
  const calendar = result.client

  const horaFim = agendamento.horaFim || calcularHoraFim(agendamento.horaInicio)
  const caucao = agendamento.caucaoValor ?? 30

  const event: calendar_v3.Schema$Event = {
    summary: `Francielly Costa — ${agendamento.clienteNome} — ${agendamento.servicoNome}`,
    description: `Tel: ${agendamento.clienteTelefone}\nEmail: ${agendamento.clienteEmail}\nCaução: ${caucao}€ paga`,
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
  }

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })
    return res.data.id ?? null
  } catch (err) {
    console.error('Erro ao criar evento no Google Calendar:', err)
    return null
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
      requestBody: {
        summary: `Consulta Virtual — ${params.clienteNome}`,
        description: `Cliente: ${params.clienteNome}\nEmail: ${params.clienteEmail}\nServiço: ${params.servicoInteresse}\nDúvida: ${params.duvida || '—'}`,
        start: { dateTime: `${params.data}T${params.hora}:00`, timeZone: TIMEZONE },
        end: { dateTime: `${params.data}T${horaFim}:00`, timeZone: TIMEZONE },
        attendees: [{ email: params.clienteEmail, displayName: params.clienteNome }],
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
    await calendar.events.delete({ calendarId, eventId })
    return true
  } catch (err) {
    console.error('Erro ao remover evento do Google Calendar:', err)
    return false
  }
}
