type FbqArgs =
  | ['track', string]
  | ['track', string, Record<string, unknown>]
  | ['trackCustom', string, Record<string, unknown>]

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
  }
}

function fbq(...args: FbqArgs) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  ;(window.fbq as (...a: unknown[]) => void)(...args)
}

function gtag(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', event, params ?? {})
}

export function trackSchedule(params?: { service?: string }) {
  fbq('track', 'Schedule', params ?? {})
  gtag('begin_checkout', {
    currency: 'EUR',
    items: params?.service ? [{ item_name: params.service }] : undefined,
  })
}

export function trackPurchase(params: { value: number; currency?: string; transactionId?: string }) {
  const value = params.value
  const currency = params.currency ?? 'EUR'
  fbq('track', 'Purchase', { value, currency })
  gtag('purchase', {
    value,
    currency,
    transaction_id: params.transactionId,
  })
}

export function trackContactWhatsapp(params?: { source?: string }) {
  fbq('track', 'Contact', params ?? {})
  gtag('contact_whatsapp', { source: params?.source ?? 'unknown' })
}

export function trackLead(params?: { source?: string }) {
  fbq('track', 'Lead', params ?? {})
  gtag('generate_lead', { source: params?.source ?? 'contact_form' })
}

export function trackChatInitiated(params?: { source?: string }) {
  fbq('track', 'InitiateCheckout', params ?? {})
  gtag('chat_initiated', { source: params?.source ?? 'sofia' })
}
