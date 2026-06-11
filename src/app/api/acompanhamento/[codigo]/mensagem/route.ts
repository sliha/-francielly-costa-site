import { NextRequest, NextResponse } from 'next/server'
import {
  getAcompanhamentoPorCodigo,
  adicionarMensagem,
  getMensagens,
} from '@/lib/acompanhamentos'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = (params.codigo || '').trim()
    if (!codigo) {
      return NextResponse.json({ error: 'Código em falta' }, { status: 400 })
    }

    const body = (await req.json()) as { texto?: string }
    const texto = (body.texto || '').trim()
    if (!texto) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    const acomp = await getAcompanhamentoPorCodigo(codigo)
    if (!acomp || !acomp.id) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    await adicionarMensagem(acomp.id, 'cliente', texto)
    const mensagens = await getMensagens(acomp.id)

    return NextResponse.json({ ok: true, mensagens })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro ao adicionar mensagem:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
