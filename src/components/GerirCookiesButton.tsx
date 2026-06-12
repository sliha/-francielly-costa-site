'use client'

import { revokeConsent } from '@/lib/consent'

/**
 * Limpa a escolha de cookies, APAGA os cookies de tracking já criados
 * (_ga*, _gid, _fbp, _gcl*) e recarrega para voltar a mostrar o banner.
 */
export default function GerirCookiesButton() {
  const reabrir = () => {
    revokeConsent()
    window.location.reload()
  }

  return (
    <button
      onClick={reabrir}
      className="inline-flex items-center px-5 py-2.5 rounded-xl bg-rose-gold text-white font-semibold text-sm font-inter hover:bg-rose-gold-dark transition-colors duration-200"
    >
      Alterar preferências de cookies
    </button>
  )
}
