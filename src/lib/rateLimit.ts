import 'server-only'

/**
 * Rate limiter simples em memória (sliding window) para rotas públicas.
 * Em Vercel Fluid Compute as instâncias são reutilizadas entre pedidos,
 * pelo que isto trava abuso básico (spam de marcações, flood de IA) sem
 * dependências externas. Não é um limite distribuído perfeito — para isso
 * usar-se-ia Redis — mas elimina o vetor barato de abuso.
 */

const buckets = new Map<string, number[]>()

// Limpeza periódica para não crescer indefinidamente.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  buckets.forEach((hits, key) => {
    const fresh = hits.filter((t) => now - t < windowMs)
    if (fresh.length === 0) buckets.delete(key)
    else buckets.set(key, fresh)
  })
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * @param key   identificador (ex.: `agendar:${ip}`)
 * @param limit máximo de pedidos na janela
 * @param windowMs janela em milissegundos
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now, windowMs)
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    const oldest = Math.min(...hits)
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    }
  }
  hits.push(now)
  buckets.set(key, hits)
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 }
}

/**
 * Verifica se a chave está bloqueada SEM registar um novo hit.
 * Usar antes de operações cujo custo só deve contar em caso de falha.
 */
export function isBlocked(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    const oldest = Math.min(...hits)
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    }
  }
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 }
}

/**
 * Regista uma falha (ex.: código de acesso inválido). Combinado com isBlocked,
 * implementa lockout contra enumeração de códigos/tokens sem penalizar
 * utilizadores legítimos.
 */
export function registerFailure(key: string, windowMs: number): void {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  hits.push(now)
  buckets.set(key, hits)
}

/** Extrai o IP real do pedido (Vercel define x-forwarded-for). */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/** Resposta 429 normalizada. */
export function tooManyRequests(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({ error: 'Demasiados pedidos. Por favor, tente novamente dentro de momentos.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}
