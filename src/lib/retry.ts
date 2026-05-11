/**
 * Retry com backoff exponencial + jitter para chamadas a APIs externas.
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  shouldRetry?: (err: unknown) => boolean
  label?: string
  onRetry?: (err: unknown, attempt: number) => void
}

const RETRYABLE_NETWORK_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'])

const RETRYABLE_GOOGLE_REASONS = new Set([
  'rateLimitExceeded',
  'userRateLimitExceeded',
  'backendError',
  'quotaExceeded',
])

export function defaultShouldRetry(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as {
    code?: string | number
    status?: number
    response?: { status?: number }
    errors?: Array<{ reason?: string }>
  }

  // Network error
  if (typeof e.code === 'string' && RETRYABLE_NETWORK_CODES.has(e.code)) return true

  // HTTP status
  const status = (typeof e.code === 'number' ? e.code : undefined) ?? e.status ?? e.response?.status
  if (status === 429) return true
  if (typeof status === 'number' && status >= 500 && status < 600) return true

  // Google API error reason
  if (Array.isArray(e.errors)) {
    for (const inner of e.errors) {
      if (inner.reason && RETRYABLE_GOOGLE_REASONS.has(inner.reason)) return true
    }
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const initialDelayMs = options.initialDelayMs ?? 500
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry
  const label = options.label ?? 'retry'

  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const giveUp = attempt >= maxAttempts || !shouldRetry(err)
      if (giveUp) throw err

      const baseDelay = initialDelayMs * Math.pow(2, attempt - 1)
      const jitter = Math.floor(Math.random() * (initialDelayMs / 2))
      const wait = baseDelay + jitter

      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[${label}] tentativa ${attempt}/${maxAttempts} falhou (${msg}). A retentar em ${wait}ms.`)
      options.onRetry?.(err, attempt)
      await sleep(wait)
    }
  }
  throw lastErr
}
