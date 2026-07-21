import { escapeHtml } from './sanitize'
import { sendEmail, saudacao, cartaoDetalhes, botao, paragrafo } from './emailTemplate'
import { CAUCAO_ATIVA } from './caucao'
import { isFiberBrows } from './horariosServico'

export interface BookingData {
  id: string
  clienteNome: string
  clienteEmail: string
  servicoNome: string
  data: string
  horaInicio: string
  // Id do serviço (não o nome). Usado para decidir extras específicos, como o
  // convite à ficha de anamnese no FiberBROWS.
  servicoId?: string
}

function formatarData(dataStr: string): string {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'geral@franciellycosta.pt'
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

/**
 * Confirmação de marcação: email à cliente + notificação à Francielly.
 * Cada envio é isolado (um falha, o outro segue).
 */
export async function sendBookingConfirmation(booking: BookingData): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) return null

  const nome = escapeHtml(booking.clienteNome)
  const servico = escapeHtml(booking.servicoNome)
  const dataFormatada = formatarData(booking.data)

  const detalhes = cartaoDetalhes([
    { label: 'Serviço', valor: servico },
    { label: 'Data', valor: dataFormatada },
    { label: 'Hora', valor: escapeHtml(booking.horaInicio) },
  ])

  // Só o FiberBROWS tem ficha de anamnese. Convida a preencher antes da sessão,
  // com link direto para a ficha interativa (o cliente identifica-se lá).
  const blocoAnamnese = isFiberBrows(booking.servicoId ?? '')
    ? `
      ${paragrafo('<strong>Antes da sua sessão de FiberBROWS</strong>, precisamos que preencha a sua ficha de anamnese e consentimento. É rápido, faz-se pelo telemóvel e ajuda-nos a preparar tudo com segurança para si. Pode guardar a meio e continuar mais tarde.')}
      ${botao('Preencher a minha ficha de anamnese', `${SITE_URL}/anamnese`)}
    `
    : ''

  // ── Email à cliente ──
  const clienteEmailId = await sendEmail({
    to: booking.clienteEmail,
    subject: `A sua marcação de ${booking.servicoNome} foi recebida`,
    preheader: 'Recebemos a sua marcação. Entraremos em contacto para confirmar.',
    bodyHtml: `
      ${saudacao(nome)}
      ${paragrafo('A sua marcação foi recebida com sucesso. Vamos entrar em contacto para confirmar o dia e a hora consigo.')}
      ${detalhes}
      ${CAUCAO_ATIVA ? paragrafo('A caução é descontada no valor final do procedimento.') : ''}
      ${blocoAnamnese}
      ${paragrafo('Se precisar de alterar ou cancelar, responda a este email ou contacte-nos pelo WhatsApp.')}
    `,
  }).catch((err) => {
    console.error('Erro email confirmação (cliente):', err)
    return null
  })

  // ── Notificação à Francielly ──
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nova marcação: ${booking.clienteNome} (${booking.servicoNome})`,
    preheader: `${booking.servicoNome} · ${dataFormatada} · ${booking.horaInicio}`,
    bodyHtml: `
      ${paragrafo('<strong>Nova marcação recebida pelo site.</strong>')}
      ${cartaoDetalhes([
        { label: 'Cliente', valor: nome },
        { label: 'Serviço', valor: servico },
        { label: 'Data', valor: dataFormatada },
        { label: 'Hora', valor: escapeHtml(booking.horaInicio) },
      ])}
      ${botao('Ver na Agenda', `${SITE_URL}/admin/agenda`)}
    `,
  }).catch((err) => console.error('Erro email confirmação (admin):', err))

  return clienteEmailId
}

/**
 * Pede à cliente que CONFIRME a marcação por resposta a este email, sem caução.
 * Usado para recuperar marcações que ficaram pendentes por causa do pagamento.
 * Propaga o erro (não é fire-and-forget) para o admin ver no painel se falhou.
 */
export async function sendPedidoConfirmacao(booking: BookingData): Promise<void> {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY não configurada no servidor')

  const nome = escapeHtml(booking.clienteNome)
  const servico = escapeHtml(booking.servicoNome)
  const dataFormatada = formatarData(booking.data)

  await sendEmail({
    to: booking.clienteEmail,
    subject: `Confirma a sua marcação de ${booking.servicoNome}?`,
    preheader: 'Basta responder a este email a confirmar. Sem pagamento.',
    bodyHtml: `
      ${saudacao(nome)}
      ${paragrafo('Recebemos o seu pedido de marcação e queremos garantir que fica tudo certo consigo.')}
      ${cartaoDetalhes([
        { label: 'Serviço', valor: servico },
        { label: 'Data', valor: dataFormatada },
        { label: 'Hora', valor: escapeHtml(booking.horaInicio) },
      ])}
      ${paragrafo('Boa notícia: <strong>não precisa de pagar qualquer caução</strong>. Para garantir a sua marcação, basta <strong>responder a este email a confirmar</strong> que quer manter este horário.')}
      ${paragrafo('Se preferir outra data ou hora, responda também a dizer, que tratamos disso consigo.')}
      ${paragrafo('<span style="color:#b45309;"><strong>Importante:</strong> sem a sua confirmação por resposta a este email, a marcação não fica garantida.</span>')}
    `,
  })
}

/** Lembrete no dia anterior à marcação. */
export async function sendReminderEmail(booking: BookingData): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const nome = escapeHtml(booking.clienteNome)
  const servico = escapeHtml(booking.servicoNome)
  const dataFormatada = formatarData(booking.data)

  await sendEmail({
    to: booking.clienteEmail,
    subject: `Lembrete: amanhã tem a sua marcação de ${booking.servicoNome}`,
    preheader: `${dataFormatada} às ${booking.horaInicio}`,
    bodyHtml: `
      ${saudacao(nome)}
      ${paragrafo('Este é um lembrete da sua marcação <strong>amanhã</strong>:')}
      ${cartaoDetalhes([
        { label: 'Serviço', valor: servico },
        { label: 'Data', valor: dataFormatada },
        { label: 'Hora', valor: escapeHtml(booking.horaInicio) },
      ])}
      ${paragrafo('Precisa de remarcar? Responda a este email ou contacte-nos pelo WhatsApp: +351 917 132 116.')}
    `,
  }).catch((err) => console.error('Erro email lembrete:', err))
}
