import 'server-only'
/**
 * Log de auditoria para operações de sincronização.
 * Tabela `sync_log`, TTL 90 dias (limpeza via pg_cron).
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

export type SyncOperation =
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'block_event'
  | 'webhook_stripe'
  | 'webhook_google'
  | 'full_resync'
  | 'full_reconcile'
  | 'auto_renew'
  | 'register_watch'
  | 'stop_watch'

export type SyncStatus = 'ok' | 'error' | 'retry' | 'skip'

export interface SyncLogEntry {
  operation: SyncOperation
  status: SyncStatus
  agendamentoId?: string
  googleEventId?: string
  durationMs: number
  attempt?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
}

const TTL_DAYS = 90

function ttlIso(): string {
  return new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export async function logSync(entry: SyncLogEntry): Promise<void> {
  try {
    await supabaseAdmin().from('sync_log').insert({
      operation: entry.operation,
      status: entry.status,
      agendamento_id: entry.agendamentoId ?? null,
      google_event_id: entry.googleEventId ?? null,
      duration_ms: entry.durationMs,
      attempt: entry.attempt ?? null,
      error_message: entry.errorMessage ?? null,
      metadata: entry.metadata ?? null,
      ttl_expires_at: ttlIso(),
    })
  } catch (err) {
    console.warn('logSync falhou:', err)
  }
}

/**
 * Mede tempo de execução de `fn` e grava entry em sync_log automaticamente.
 * Em erro, grava status=error com a mensagem e re-throws.
 */
export async function timedLog<T>(
  operation: SyncOperation,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    await logSync({
      operation,
      status: 'ok',
      durationMs: Date.now() - start,
      ...(metadata ? { metadata } : {}),
    })
    return result
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    await logSync({
      operation,
      status: 'error',
      durationMs: Date.now() - start,
      errorMessage,
      ...(metadata ? { metadata } : {}),
    })
    throw err
  }
}
