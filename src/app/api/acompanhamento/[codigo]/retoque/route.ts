import { NextRequest, NextResponse } from 'next/server'
import {
  getAcompanhamentoPorCodigo,
  confirmarRetoque,
} from '@/lib/acompanhamentos'
import { isBlocked, registerFailure, getClientIp, tooManyRequests } from '@/lib/rateLimit'

export const runtime = 'nodejs'

const FAIL_LIMIT = 10
const FAIL_WINDOW_MS = 15 * 60 * 1000

export async function POST(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const ip = getClientIp(req)
  const blocked = isBlocked(`acomp-fail:${ip}`, FAIL_LIMIT, FAIL_WINDOW_MS)
  if (!blocked.ok) return tooManyRequests(blocked.retryAfterSeconds)

  try {
    const codigo = (params.codigo || '').trim()
    if (!codigo || codigo.length > 32) {
      return NextResponse.json({ error: 'Código em falta' }, { status: 400 })
    }

    const acomp = await getAcompanhamentoPorCodigo(codigo)
    if (!acomp || !acomp.id) {
      registerFailure(`acomp-fail:${ip}`, FAIL_WINDOW_MS)
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    await confirmarRetoque(acomp.id, true)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao confirmar retoque:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
