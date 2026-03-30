export interface BookingData {
  id: string
  clienteNome: string
  clienteEmail: string
  servicoNome: string
  data: string
  horaInicio: string
}

function formatarData(dataStr: string): string {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function enviarEmail(payload: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error: ${res.status} — ${err}`)
  }
}

export async function sendBookingConfirmation(booking: BookingData): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const adminEmail = process.env.ADMIN_EMAIL || 'geral@franciellycosta.com'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.com'
  const dataFormatada = formatarData(booking.data)

  // Email to client
  await enviarEmail({
    from: 'Francielly Costa <noreply@franciellycosta.com>',
    to: booking.clienteEmail,
    subject: `Marcação recebida — ${booking.servicoNome}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDF8F5; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #B76E79; font-size: 28px; margin: 0;">Francielly Costa</h1>
          <p style="color: #C9A96E; margin: 4px 0 0; font-size: 14px;">Dermopigmentação Avançada</p>
        </div>
        <h2 style="color: #333; font-size: 20px;">Olá ${booking.clienteNome}!</h2>
        <p style="color: #555; line-height: 1.6;">
          A sua marcação foi recebida com sucesso. Em breve entraremos em contacto para confirmar.
        </p>
        <div style="background: white; border-left: 4px solid #B76E79; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${booking.servicoNome}</p>
          <p style="margin: 0 0 8px;"><strong>Data:</strong> ${dataFormatada}</p>
          <p style="margin: 0;"><strong>Hora:</strong> ${booking.horaInicio}</p>
        </div>
        <p style="color: #555; font-size: 14px;">
          Morada: Av. Dr. António Palha 53, 4715-091 Braga
        </p>
        <p style="color: #555; font-size: 14px;">Telefone: +351 913 112 232</p>
        <hr style="border: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Em caso de dúvida, contacte-nos: geral@franciellycosta.com
        </p>
      </div>
    `,
  })

  // Email to admin
  await enviarEmail({
    from: 'FC Site <noreply@franciellycosta.com>',
    to: adminEmail,
    subject: `Nova marcação — ${booking.clienteNome} | ${booking.servicoNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: white; padding: 40px; border-radius: 12px;">
        <h2 style="color: #B76E79;">Nova Marcação Recebida!</h2>
        <div style="background: #2A2A2A; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong style="color: #C9A96E;">Cliente:</strong> ${booking.clienteNome}</p>
          <p><strong style="color: #C9A96E;">Serviço:</strong> ${booking.servicoNome}</p>
          <p><strong style="color: #C9A96E;">Data:</strong> ${dataFormatada}</p>
          <p><strong style="color: #C9A96E;">Hora:</strong> ${booking.horaInicio}</p>
        </div>
        <a
          href="${siteUrl}/admin/agenda"
          style="display: inline-block; background: #B76E79; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;"
        >
          Ver na Agenda
        </a>
      </div>
    `,
  })
}

export async function sendReminderEmail(booking: BookingData): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const dataFormatada = formatarData(booking.data)

  await enviarEmail({
    from: 'Francielly Costa <noreply@franciellycosta.com>',
    to: booking.clienteEmail,
    subject: `Lembrete: amanhã tem marcação — ${booking.servicoNome}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDF8F5; padding: 40px;">
        <h1 style="color: #B76E79; text-align: center;">Francielly Costa</h1>
        <h2 style="color: #333;">Olá ${booking.clienteNome}!</h2>
        <p style="color: #555; line-height: 1.6;">
          Este é um lembrete da sua marcação <strong>amanhã</strong>:
        </p>
        <div style="background: white; border-left: 4px solid #B76E79; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${booking.servicoNome}</p>
          <p style="margin: 0 0 8px;"><strong>Data:</strong> ${dataFormatada}</p>
          <p style="margin: 0;"><strong>Hora:</strong> ${booking.horaInicio}</p>
        </div>
        <p style="color: #555; font-size: 14px;">
          Morada: Av. Dr. António Palha 53, 4715-091 Braga
        </p>
        <p style="color: #555; font-size: 14px;">
          Precisar remarcar? Contacte-nos: +351 913 112 232
        </p>
      </div>
    `,
  })
}
