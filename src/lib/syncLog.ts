/**
 * Log de auditoria para operações de sincronização.
 * Coleção `syncLog`, TTL 90 dias (configurar via Firebase Console).
 */
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

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
  timestamp: Timestamp
  operation: SyncOperation
  status: SyncStatus
  agendamentoId?: string
  googleEventId?: string
  durationMs: number
  attempt?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
  ttlExpiresAt: Timestamp
}

const COL = 'syncLog'
const TTL_DAYS = 90

function ttlTimestamp(): Timestamp {
  return Timestamp.fromMillis(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000)
}

export async function logSync(entry: Omit<SyncLogEntry, 'timestamp' | 'ttlExpiresAt'>): Promise<void> {
  const db = getAdminDb()
  if (!db) return
  try {
    await db.collection(COL).add({
      ...entry,
      timestamp: Timestamp.now(),
      ttlExpiresAt: ttlTimestamp(),
    })
  } catch (err) {
    console.warn('logSync falhou:', err)
  }
}

/**
 * Mede tempo de execução de `fn` e grava entry em syncLog automaticamente.
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
