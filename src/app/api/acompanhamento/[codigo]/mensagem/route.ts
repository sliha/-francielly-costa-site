import { NextRequest, NextResponse } from 'next/server'
import {
  getAcompanhamentoPorCodigo,
  adicionarMensagem,
  getMensagens,
} from '@/lib/acompanhamentos'
import {
  isBlocked,
  registerFailure,
  rateLimit,
  getClientIp,
  tooManyRequests,
} from '@/lib/rateLimit'

export const runtime = 'nodejs'

const FAIL_LIMIT = 10
const FAIL_WINDOW_MS = 15 * 60 * 1000
const MAX_TEXTO_CHARS = 2000

export async function POST(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const ip = getClientIp(req)
  const blocked = isBlocked(`acomp-fail:${ip}`, FAIL_LIMIT, FAIL_WINDOW_MS)
  if (!blocked.ok) return tooManyRequests(blocked.retryAfterSeconds)

  const rl = rateLimit(`acomp-msg:${ip}`, 30, 10 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const codigo = (params.codigo || '').trim()
    if (!codigo || codigo.length > 32) {
      return NextResponse.json({ error: 'Código em falta' }, { status: 400 })
    }

    const body = (await req.json()) as { texto?: string }
    const texto = (body.texto || '').trim().slice(0, MAX_TEXTO_CHARS)
    if (!texto) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    const acomp = await getAcompanhamentoPorCodigo(codigo)
    if (!acomp || !acomp.id) {
      registerFailure(`acomp-fail:${ip}`, FAIL_WINDOW_MS)
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    await adicionarMensagem(acomp.id, 'cliente', texto)
    const mensagens = await getMensagens(acomp.id)

    return NextResponse.json({ ok: true, mensagens })
  } catch (err) {
    console.error('Erro ao adicionar mensagem:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
