/**
 * Escapa texto fornecido pelo utilizador antes de o interpolar em HTML
 * (emails Resend, etc.). Sem isto, um atacante pode injetar markup/links de
 * phishing nos emails que chegam à caixa da administradora ou das clientes.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
