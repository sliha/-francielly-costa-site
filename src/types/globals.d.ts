export {}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    fbq: (...args: unknown[]) => void
    dataLayer: unknown[]
    _fbq: unknown
    beTracker?: { t: (opts: { hash: string }) => void }
  }
}
