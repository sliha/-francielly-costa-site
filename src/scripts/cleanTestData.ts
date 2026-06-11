import { supabaseAdmin } from '@/lib/supabase/admin'

// Tabela -> coluna PK (usada como filtro obrigatório no DELETE do Supabase).
const TEST_TABLES: { table: string; key: string }[] = [
  { table: 'agendamentos', key: 'id' },
  { table: 'clientes', key: 'email' },
  { table: 'contactos', key: 'id' },
  { table: 'fiberbrows_waitlist', key: 'id' },
]

export type CleanResult = {
  collection: string
  deleted: number
  error?: string
}

async function deleteTable(table: string, key: string): Promise<number> {
  const sb = supabaseAdmin()
  // Conta antes de apagar (para reportar quantos foram removidos).
  const { count } = await sb.from(table).select('*', { count: 'exact', head: true })

  // Apaga todas as linhas. O Supabase exige sempre um filtro no DELETE;
  // `key IS NOT NULL` é verdadeiro para todas as linhas (PK nunca nula).
  const { error } = await sb.from(table).delete().not(key, 'is', null)
  if (error) throw new Error(error.message)

  return count ?? 0
}

export async function cleanTestData(): Promise<CleanResult[]> {
  const results: CleanResult[] = []
  for (const { table, key } of TEST_TABLES) {
    try {
      const deleted = await deleteTable(table, key)
      results.push({ collection: table, deleted })
    } catch (err) {
      results.push({
        collection: table,
        deleted: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return results
}

export const TEST_COLLECTIONS_LIST = TEST_TABLES.map((t) => t.table)
