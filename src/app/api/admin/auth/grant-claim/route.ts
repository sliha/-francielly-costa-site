import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'Authorization Bearer token em falta' }, { status: 401 })
  }

  const admin = supabaseAdmin()

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: userErr?.message || 'Token inválido' }, { status: 401 })
  }

  const user = userData.user
  const userEmail = (user.email || '').toLowerCase()
  const allowedEmails = getAdminEmails()

  if (allowedEmails.length === 0) {
    return NextResponse.json(
      { error: 'ADMIN_EMAILS não configurada no servidor' },
      { status: 500 }
    )
  }

  if (!userEmail || !allowedEmails.includes(userEmail)) {
    return NextResponse.json(
      { error: `Email "${userEmail}" não está na lista de admins permitidos` },
      { status: 403 }
    )
  }

  const { error: upsertErr } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, email: userEmail, role: 'admin', is_active: true },
      { onConflict: 'id' }
    )

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    email: userEmail,
    message: 'Permissão admin concedida. A sessão já tem acesso às rotas /api/admin.',
  })
}

export async function GET(req: NextRequest) {
  // Diagnóstico: verifica se o utilizador atual já é admin
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Bearer token em falta' }, { status: 401 })

  const admin = supabaseAdmin()

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: userErr?.message || 'Token inválido' }, { status: 401 })
  }

  const user = userData.user

  const { data: prof } = await admin
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = !!prof && prof.is_active === true && prof.role === 'admin'

  return NextResponse.json({
    email: user.email,
    uid: user.id,
    isAdmin,
    adminEmailsConfigured: getAdminEmails().length > 0,
  })
}
