import { NextRequest, NextResponse } from 'next/server'
import { submeterConsentimento, type RespostasAnamnese } from '@/lib/consentimentos'

export const runtime = 'nodejs'

interface Payload {
  token: string
  respostas: RespostasAnamnese
  assinaturaNome: string
  consentimentoAceite: boolean
  rgpdAceite: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload

    if (!body.token || !body.assinaturaNome) {
      return NextResponse.json({ error: 'Token ou assinatura em falta' }, { status: 400 })
    }

    const result = await submeterConsentimento(body.token, {
      respostas: body.respostas || {},
      assinaturaNome: body.assinaturaNome,
      consentimentoAceite: !!body.consentimentoAceite,
      rgpdAceite: !!body.rgpdAceite,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro submeter consentimento:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
