import type { Firestore } from 'firebase-admin/firestore'

const TEST_COLLECTIONS = [
  'agendamentos',
  'clientes',
  'contactos',
  'fiberbrows-waitlist',
] as const

export type CleanResult = {
  collection: string
  deleted: number
  error?: string
}

async function deleteCollection(
  db: Firestore,
  collection: string,
  batchSize = 200,
): Promise<number> {
  let total = 0
  while (true) {
    const snap = await db.collection(collection).limit(batchSize).get()
    if (snap.empty) break
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    total += snap.size
    if (snap.size < batchSize) break
  }
  return total
}

export async function cleanTestData(db: Firestore): Promise<CleanResult[]> {
  const results: CleanResult[] = []
  for (const col of TEST_COLLECTIONS) {
    try {
      const deleted = await deleteCollection(db, col)
      results.push({ collection: col, deleted })
    } catch (err) {
      results.push({
        collection: col,
        deleted: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return results
}

export const TEST_COLLECTIONS_LIST = TEST_COLLECTIONS
