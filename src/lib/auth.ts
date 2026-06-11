import { supabaseAdmin } from './supabase/admin'

/**
 * Verifica se o request tem um access token Supabase válido de um utilizador admin ativo.
 * Mantém a mesma assinatura/retorno do antigo verifyAdminRequest (Firebase) para
 * minimizar alterações nas rotas que já o usavam.
 */
export async function verifyAdminRequest(req: Request): Promise<
  | { ok: true; uid: string; email?: string }
  | { ok: false; status: number; error: string }
> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return { ok: false, status: 401, error: 'Authorization Bearer token em falta' }
  }

  const admin = supabaseAdmin()

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return { ok: false, status: 401, error: userErr?.message || 'Token inválido' }
  }

  const { data: prof, error: profErr } = await admin
    .from('profiles')
    .select('id, is_active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (profErr) {
    return { ok: false, status: 500, error: profErr.message }
  }
  if (!prof || !prof.is_active) {
    return { ok: false, status: 403, error: 'Utilizador sem permissão admin' }
  }

  return { ok: true, uid: userData.user.id, email: userData.user.email ?? undefined }
}

/** Lista de emails admin (compatibilidade — usada em alertas/notificações). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}
