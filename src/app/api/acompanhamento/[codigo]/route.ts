import { NextRequest, NextResponse } from 'next/server'
import {
  getAcompanhamentoPorCodigo,
  getMensagens,
  getFotos,
} from '@/lib/acompanhamentos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = (params.codigo || '').trim()
    if (!codigo) {
      return NextResponse.json({ error: 'Código em falta' }, { status: 400 })
    }

    const acomp = await getAcompanhamentoPorCodigo(codigo)
    if (!acomp || !acomp.id) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    const [mensagens, fotos] = await Promise.all([
      getMensagens(acomp.id),
      getFotos(acomp.id),
    ])

    return NextResponse.json({ acompanhamento: acomp, mensagens, fotos })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro ao obter acompanhamento:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
