import { escapeHtml } from './sanitize'

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
  reply_to?: string
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

// Remetente e reply-to no domínio real da Francielly (franciellycosta.pt).
// IMPORTANTE: só funciona depois de franciellycosta.pt estar verificado no Resend
// (Domains → Add Domain → registos DNS). Enquanto não estiver, o Resend devolve 403
// "domain is not verified". Configurável por env caso seja preciso alternar.
const FRANCIELLY_FROM = process.env.CONFIRM_FROM_EMAIL || 'Francielly Costa <geral@franciellycosta.pt>'
const FRANCIELLY_REPLY_TO = process.env.CONFIRM_REPLY_TO || 'geral@franciellycosta.pt'

/**
 * Pede à cliente que CONFIRME a marcação por resposta a este email, sem caução.
 * Usado para recuperar marcações que ficaram pendentes por causa do pagamento.
 * Ao contrário dos restantes envios, propaga o erro (não é fire-and-forget) para
 * o admin ver no painel se o envio falhou.
 */
export async function sendPedidoConfirmacao(booking: BookingData): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) throw new Error('RESEND_API_KEY não configurada no servidor')

  const dataFormatada = formatarData(booking.data)

  await enviarEmail({
    from: FRANCIELLY_FROM,
    reply_to: FRANCIELLY_REPLY_TO,
    to: booking.clienteEmail,
    subject: `Confirma a sua marcação de ${booking.servicoNome}?`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDF8F5; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #B76E79; font-size: 28px; margin: 0;">Francielly Costa</h1>
          <p style="color: #C9A96E; margin: 4px 0 0; font-size: 14px;">Dermopigmentação Avançada</p>
        </div>
        <h2 style="color: #333; font-size: 20px;">Olá ${escapeHtml(booking.clienteNome)}!</h2>
        <p style="color: #555; line-height: 1.7;">
          Recebemos o seu pedido de marcação e queremos garantir que fica tudo certo consigo.
        </p>
        <div style="background: white; border-left: 4px solid #B76E79; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${escapeHtml(booking.servicoNome)}</p>
          <p style="margin: 0 0 8px;"><strong>Data:</strong> ${dataFormatada}</p>
          <p style="margin: 0;"><strong>Hora:</strong> ${booking.horaInicio}</p>
        </div>
        <p style="color: #555; line-height: 1.7;">
          Boa notícia: <strong>não precisa de pagar qualquer caução</strong>. Para garantir a sua
          marcação, basta <strong>responder a este email a confirmar</strong> que quer manter este horário.
        </p>
        <p style="color: #555; line-height: 1.7;">
          Se preferir outra data ou hora, responda também a dizer, que tratamos disso consigo.
        </p>
        <p style="color: #b45309; line-height: 1.7; font-size: 14px;">
          <strong>Importante:</strong> sem a sua confirmação por resposta a este email, a marcação não fica garantida.
        </p>
        <hr style="border: 1px solid #eee; margin: 24px 0;">
        <p style="color: #888; font-size: 13px;">Morada: Av. Dr. António Palha 53, 4715-091 Braga</p>
        <p style="color: #888; font-size: 13px;">WhatsApp: +351 917 132 116</p>
      </div>
    `,
  })
}

export async function sendBookingConfirmation(booking: BookingData): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const adminEmail = process.env.ADMIN_EMAIL || 'geral@franciellycosta.com'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'
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
        <h2 style="color: #333; font-size: 20px;">Olá ${escapeHtml(booking.clienteNome)}!</h2>
        <p style="color: #555; line-height: 1.6;">
          A sua marcação foi recebida com sucesso. Em breve entraremos em contacto para confirmar.
        </p>
        <div style="background: white; border-left: 4px solid #B76E79; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${escapeHtml(booking.servicoNome)}</p>
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
          <p><strong style="color: #C9A96E;">Cliente:</strong> ${escapeHtml(booking.clienteNome)}</p>
          <p><strong style="color: #C9A96E;">Serviço:</strong> ${escapeHtml(booking.servicoNome)}</p>
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
        <h2 style="color: #333;">Olá ${escapeHtml(booking.clienteNome)}!</h2>
        <p style="color: #555; line-height: 1.6;">
          Este é um lembrete da sua marcação <strong>amanhã</strong>:
        </p>
        <div style="background: white; border-left: 4px solid #B76E79; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${escapeHtml(booking.servicoNome)}</p>
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
