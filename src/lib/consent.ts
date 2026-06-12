'use client'

/**
 * Consentimento de cookies granular (RGPD/EDPB):
 *  - analytics  → Google Analytics (estatísticas)
 *  - marketing  → Meta Pixel + Google Ads (publicidade)
 * Guardado em localStorage como JSON. Valores legados ('accepted'/'rejected')
 * são migrados: accepted → tudo true, rejected → tudo false.
 */

export const CONSENT_STORAGE_KEY = 'cookie_consent'
export const CONSENT_EVENT = 'cookie_consent_changed'

export interface CookieConsent {
  analytics: boolean
  marketing: boolean
}

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    if (raw === 'accepted') return { analytics: true, marketing: true }
    if (raw === 'rejected') return { analytics: false, marketing: false }
    const parsed = JSON.parse(raw)
    return {
      analytics: Boolean(parsed?.analytics),
      marketing: Boolean(parsed?.marketing),
    }
  } catch {
    return null
  }
}

export function saveConsent(consent: CookieConsent): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }))
  } catch {}
}

/**
 * Revoga o consentimento: limpa a escolha E apaga os cookies de tracking já
 * criados (_ga*, _gid, _fbp, _gcl*) — retirar consentimento tem de ser tão
 * eficaz como dá-lo (art. 7.º/3 RGPD).
 */
export function revokeConsent(): void {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch {}
  deleteTrackingCookies()
}

export function deleteTrackingCookies(): void {
  if (typeof document === 'undefined') return
  const cookies = document.cookie.split(';').map((c) => c.split('=')[0].trim())
  const isTracking = (name: string) =>
    name === '_gid' || name === '_fbp' || name.startsWith('_ga') || name.startsWith('_gcl')
  const hostname = window.location.hostname
  const domains = ['', hostname, `.${hostname}`, `.${hostname.replace(/^www\./, '')}`]
  for (const name of cookies) {
    if (!isTracking(name)) continue
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}
