type Params = Record<string, unknown>

export function trackEvent(eventName: string, params?: Params) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params ?? {})
  }
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params ?? {})
  }
}

function gtag(name: string, params?: Params) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params ?? {})
}

function fbq(name: string, params?: Params, options?: { eventID?: string }) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  if (options) {
    window.fbq('track', name, params ?? {}, options)
  } else {
    window.fbq('track', name, params ?? {})
  }
}

export function trackSchedule(params?: { service?: string }) {
  fbq('Schedule', params)
  gtag('begin_checkout', { currency: 'EUR', service: params?.service })
}

export function trackPurchase(params: { value: number; currency?: string; transactionId?: string; eventId?: string }) {
  const value = params.value
  const currency = params.currency ?? 'EUR'
  fbq('Purchase', { value, currency }, params.eventId ? { eventID: params.eventId } : undefined)
  gtag('purchase', { value, currency, transaction_id: params.transactionId })
}

export function trackContactWhatsapp(params?: { source?: string }) {
  fbq('Contact', params)
  gtag('contact_whatsapp', { source: params?.source ?? 'unknown' })
}

// Conversao "Marcacao concluida" da conta Google Ads nova (AW-18387543172).
// Evento a nivel de conta criado no Ads: conversion_event_book_appointment.
// Disparado na marcacao sem caucao, no checkout Stripe e na consulta virtual.
export function trackMarcacaoAds() {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion_event_book_appointment')
  }
}

export function trackContactPhone(params?: { source?: string }) {
  fbq('Contact', params)
  gtag('contact_phone', { source: params?.source ?? 'unknown' })
}

export function trackLead(params?: { source?: string }) {
  fbq('Lead', params)
  gtag('generate_lead', { source: params?.source ?? 'contact_form' })
}

export function trackChatInitiated(params?: { source?: string }) {
  fbq('InitiateCheckout', params)
  gtag('chat_started', { source: params?.source ?? 'sofia' })
}
