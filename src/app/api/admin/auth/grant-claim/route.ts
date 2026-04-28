import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminInitError } from '@/lib/firebaseAdmin'

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

  const auth = getAdminAuth()
  if (!auth) {
    return NextResponse.json(
      { error: getAdminInitError() || 'firebase-admin não inicializado' },
      { status: 500 }
    )
  }

  let decoded
  try {
    decoded = await auth.verifyIdToken(token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token inválido'
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  const allowedEmails = getAdminEmails()
  const userEmail = (decoded.email || '').toLowerCase()

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

  // Se já é admin, não faz nada
  if (decoded.admin === true) {
    return NextResponse.json({ ok: true, already: true, email: userEmail })
  }

  try {
    await auth.setCustomUserClaims(decoded.uid, { admin: true })
    return NextResponse.json({
      ok: true,
      email: userEmail,
      message: 'Claim admin concedida. Faz logout/login ou força refresh do token para aplicar.',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao conceder claim'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Diagnóstico: verifica se o utilizador atual já é admin
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Bearer token em falta' }, { status: 401 })

  const auth = getAdminAuth()
  if (!auth) {
    return NextResponse.json({ error: getAdminInitError() || 'admin não init' }, { status: 500 })
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    return NextResponse.json({
      email: decoded.email,
      uid: decoded.uid,
      isAdmin: decoded.admin === true,
      adminEmailsConfigured: getAdminEmails().length > 0,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Token inválido' }, { status: 401 })
  }
}
