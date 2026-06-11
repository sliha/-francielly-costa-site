import 'server-only'
/**
 * Idempotência de webhooks: gravar event.id processado no Supabase
 * para evitar reprocessamento em reentregas.
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

export type IdempotencySource = 'stripe' | 'google-calendar'

const TTL_DAYS = 30

export interface ProcessedEvent {
  source: IdempotencySource
  result: 'ok' | 'error'
  errorMessage?: string
}

export function makeKey(source: IdempotencySource, id: string, version?: string): string {
  if (source === 'google-calendar' && version) {
    const safeVer = version.replace(/[^0-9TZ:.\-]/g, '')
    return `${source}-${id}-${safeVer}`
  }
  return `${source}-${id}`
}

function ttlIso(): string {
  return new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

/** Retorna o registo se já existir; null caso contrário. */
export async function getProcessed(key: string): Promise<ProcessedEvent | null> {
  try {
    const { data } = await supabaseAdmin()
      .from('processed_events')
      .select('source, result, error_message')
      .eq('key', key)
      .maybeSingle()
    if (!data) return null
    return { source: data.source, result: data.result, errorMessage: data.error_message ?? undefined }
  } catch (err) {
    console.warn('idempotency.getProcessed falhou:', err)
    return null
  }
}

export async function markProcessed(
  key: string,
  source: IdempotencySource,
  result: 'ok' | 'error',
  errorMessage?: string,
): Promise<void> {
  try {
    await supabaseAdmin()
      .from('processed_events')
      .upsert(
        {
          key,
          source,
          result,
          error_message: errorMessage ?? null,
          processed_at: new Date().toISOString(),
          ttl_expires_at: ttlIso(),
        },
        { onConflict: 'key' }
      )
  } catch (err) {
    console.warn('idempotency.markProcessed falhou:', err)
  }
}
