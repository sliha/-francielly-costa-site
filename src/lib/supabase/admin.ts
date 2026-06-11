import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente Supabase com SERVICE ROLE — só para uso em SERVIDOR (rotas /api, server components).
// Ignora RLS, tal como o firebase-admin ignorava as Firestore rules. NUNCA expor ao browser.
let _admin: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase server não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em falta)')
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}
