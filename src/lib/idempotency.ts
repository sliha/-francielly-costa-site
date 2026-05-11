/**
 * Idempotência de webhooks: gravar event.id processado em Firestore
 * para evitar reprocessamento em reentregas.
 */
import { getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export type IdempotencySource = 'stripe' | 'google-calendar'

const COL = 'processedEvents'
const TTL_DAYS = 30

export interface ProcessedEvent {
  source: IdempotencySource
  processedAt: Timestamp
  result: 'ok' | 'error'
  errorMessage?: string
  ttlExpiresAt: Timestamp
}

export function makeKey(source: IdempotencySource, id: string, version?: string): string {
  if (source === 'google-calendar' && version) {
    // Use só hash dos timestamps p/ evitar caracteres inválidos em doc ID
    const safeVer = version.replace(/[^0-9TZ:.\\-]/g, '')
    return `${source}-${id}-${safeVer}`
  }
  return `${source}-${id}`
}

function ttlTimestamp(): Timestamp {
  return Timestamp.fromMillis(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000)
}

/** Retorna o doc se já existir; null caso contrário. */
export async function getProcessed(key: string): Promise<ProcessedEvent | null> {
  const db = getAdminDb()
  if (!db) {
    console.warn('idempotency: admin SDK indisponível:', getAdminInitError())
    return null
  }
  try {
    const snap = await db.collection(COL).doc(key).get()
    return snap.exists ? (snap.data() as ProcessedEvent) : null
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
  const db = getAdminDb()
  if (!db) return
  try {
    await db.collection(COL).doc(key).set({
      source,
      processedAt: Timestamp.now(),
      result,
      ...(errorMessage ? { errorMessage } : {}),
      ttlExpiresAt: ttlTimestamp(),
    } satisfies ProcessedEvent)
  } catch (err) {
    console.warn('idempotency.markProcessed falhou:', err)
  }
}
