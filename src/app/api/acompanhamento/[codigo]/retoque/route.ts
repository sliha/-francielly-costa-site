import { NextRequest, NextResponse } from 'next/server'
import {
  getAcompanhamentoPorCodigo,
  confirmarRetoque,
} from '@/lib/acompanhamentos'

export const runtime = 'nodejs'

export async function POST(
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

    await confirmarRetoque(acomp.id, true)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro ao confirmar retoque:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
