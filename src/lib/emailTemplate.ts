import 'server-only'

// ── Endereços de envio ────────────────────────────────────────────────────────
// Tudo sai do domínio real da Francielly (franciellycosta.pt), verificado no Resend.
// Configuráveis por env para poder alternar sem alterar código.
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Francielly Costa <geral@franciellycosta.pt>'
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'geral@franciellycosta.pt'

// ── Dados de contacto (rodapé dos emails) ─────────────────────────────────────
const MORADA = 'Av. Dr. António Palha 53, 4715-091 Braga'
const TELEFONE = '+351 917 132 116'
const EMAIL_CONTACTO = 'geral@franciellycosta.pt'
const SITE = 'https://franciellycosta.pt'
const INSTAGRAM = 'https://www.instagram.com/franciellycostamaster/'
// Logo branca (PNG, para compatibilidade com clientes de email que não suportam SVG),
// servida do próprio site num URL absoluto.
const LOGO_URL = `${SITE}/logo/logo-francielly-branco.png`

// ── Cores da marca ────────────────────────────────────────────────────────────
const ROSE = '#B76E79'
const GOLD = '#C9A96E'
const CREAM = '#FDF8F5'
const INK = '#4a4a4a'

/**
 * Envolve o conteúdo (bodyHtml) no layout de marca da Francielly Costa: cabeçalho
 * com gradiente rosa/dourado, corpo, e rodapé com contactos. O bodyHtml deve já
 * vir seguro (input do utilizador escapado com escapeHtml antes de entrar aqui).
 */
export function emailShell({
  bodyHtml,
  preheader = '',
}: {
  bodyHtml: string
  preheader?: string
}): string {
  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:0;background:#F4ECE8;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F4ECE8;">${preheader}</div>` : ''}
    <div style="width:100%;background:#F4ECE8;padding:24px 12px;">
      <div style="max-width:600px;margin:0 auto;background:${CREAM};border-radius:16px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;box-shadow:0 4px 24px rgba(183,110,121,0.12);">
        <div style="text-align:center;padding:36px 40px 32px;background:linear-gradient(135deg,${ROSE},${GOLD});">
          <img src="${LOGO_URL}" alt="Francielly Costa, Dermopigmentação Avançada" width="300" style="width:300px;max-width:80%;height:auto;border:0;display:inline-block;" />
        </div>
        <div style="height:4px;background:linear-gradient(90deg,${GOLD},${ROSE},${GOLD});"></div>
        <div style="padding:38px 40px;color:${INK};font-size:15px;line-height:1.7;">
          ${bodyHtml}
        </div>
        <div style="padding:24px 40px 34px;border-top:1px solid #ecdfd9;color:#9a8f8a;font-size:12px;line-height:1.7;text-align:center;">
          <p style="margin:0 0 4px;">${MORADA}</p>
          <p style="margin:0 0 4px;">${TELEFONE} &middot; <a href="mailto:${EMAIL_CONTACTO}" style="color:${ROSE};text-decoration:none;">${EMAIL_CONTACTO}</a></p>
          <p style="margin:10px 0 0;">
            <a href="${SITE}" style="color:${ROSE};text-decoration:none;">franciellycosta.pt</a>
            &nbsp;&middot;&nbsp;
            <a href="${INSTAGRAM}" style="color:${ROSE};text-decoration:none;">Instagram</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`
}

// ── Blocos reutilizáveis para o corpo dos emails ──────────────────────────────

/** Saudação "Olá {nome}!" (nome já deve vir escapado). */
export function saudacao(nome: string): string {
  return `<h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Olá ${nome}!</h2>`
}

/** Cartão de destaque com os detalhes da marcação (linhas já escapadas). */
export function cartaoDetalhes(linhas: Array<{ label: string; valor: string }>): string {
  const itens = linhas
    .map(
      (l) =>
        `<p style="margin:0 0 8px;color:#555555;"><strong style="color:${ROSE};">${l.label}:</strong> ${l.valor}</p>`,
    )
    .join('')
  return `<div style="background:#ffffff;border-left:4px solid ${ROSE};padding:20px;margin:22px 0;border-radius:8px;">${itens}</div>`
}

/** Botão principal (CTA). */
export function botao(texto: string, href: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,${ROSE},${GOLD});color:#ffffff;padding:15px 34px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;font-family:Arial,sans-serif;">${texto}</a>
  </div>`
}

/** Parágrafo simples. */
export function paragrafo(html: string): string {
  return `<p style="margin:0 0 14px;color:#555555;line-height:1.7;">${html}</p>`
}

/**
 * Envia um email já embrulhado no layout de marca, via Resend.
 * Propaga o erro se o envio falhar (quem chama decide se ignora ou reporta).
 * Devolve o id da mensagem no Resend (útil para rastrear a entrega).
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  bodyHtml: string
  preheader?: string
  from?: string
  replyTo?: string
}): Promise<string | null> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) throw new Error('RESEND_API_KEY não configurada no servidor')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from || EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      reply_to: opts.replyTo || EMAIL_REPLY_TO,
      html: emailShell({ bodyHtml: opts.bodyHtml, preheader: opts.preheader }),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend API error: ${res.status} — ${err}`)
  }

  const data = (await res.json().catch(() => null)) as { id?: string } | null
  return data?.id ?? null
}
