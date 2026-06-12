import { NextRequest, NextResponse } from 'next/server'
import {
  getAcompanhamentoPorCodigo,
  getMensagens,
  getFotos,
  resolverFotosUrls,
} from '@/lib/acompanhamentos'
import { isBlocked, registerFailure, getClientIp, tooManyRequests } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Lockout anti-enumeração: 10 códigos inválidos por IP a cada 15 minutos.
// Pedidos com código VÁLIDO não contam, por isso o polling do chat não é afetado.
const FAIL_LIMIT = 10
const FAIL_WINDOW_MS = 15 * 60 * 1000

export async function GET(
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

    const [mensagens, fotosRaw] = await Promise.all([
      getMensagens(acomp.id),
      getFotos(acomp.id),
    ])
    const fotos = await resolverFotosUrls(fotosRaw)

    return NextResponse.json({ acompanhamento: acomp, mensagens, fotos })
  } catch (err) {
    console.error('Erro ao obter acompanhamento:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
