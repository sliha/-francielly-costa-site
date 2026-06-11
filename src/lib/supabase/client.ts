import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para o BROWSER (anon key + sessão de auth do admin).
// Usado em componentes client para leituras públicas, realtime e autenticação.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'fc-admin-auth',
    },
  },
)

// Devolve o access_token da sessão atual (para chamadas autenticadas às rotas /api/admin/*).
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
