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

function getCalendarClient(): calendar_v3.Calendar | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    console.warn('GOOGLE_SERVICE_ACCOUNT_KEY não configurada — calendar desativado')
    return null
  }

  let credentials: { client_email: string; private_key: string }
  try {
    credentials = JSON.parse(raw)
  } catch (err) {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY inválido (não é JSON):', err)
    return null
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  })

  return google.calendar({ version: 'v3', auth })
}

function calcularHoraFim(horaInicio: string, duracaoMin = DURACAO_PADRAO_MIN): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const total = h * 60 + m + duracaoMin
  const fimH = Math.floor(total / 60)
  const fimM = total % 60
  return `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`
}

export async function createCalendarEvent(agendamento: AgendamentoCalendar): Promise<string | null> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendar || !calendarId) return null

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

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendar = getCalendarClient()
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendar || !calendarId) return false

  try {
    await calendar.events.delete({ calendarId, eventId })
    return true
  } catch (err) {
    console.error('Erro ao remover evento do Google Calendar:', err)
    return false
  }
}
