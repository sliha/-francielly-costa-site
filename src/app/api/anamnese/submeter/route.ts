import { NextRequest, NextResponse } from 'next/server'
import { submeterAnamneseFiber } from '@/lib/consentimentos'
import { sendCopiaAnamnese } from '@/lib/emailAnamnese'
import { CONSENTIMENTO_VERSAO } from '@/data/anamneseFiber'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'

export const runtime = 'nodejs'

/**
 * Submete a anamnese completa com assinatura simples.
 * Guarda IP, user-agent, versão e hash de integridade, e envia cópia por email.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`anamnese-submeter:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const body = await req.json()
    const token = typeof body?.token === 'string' ? body.token : ''
    if (!token) return NextResponse.json({ error: 'Token em falta.' }, { status: 400 })

    const respostas =
      body?.respostas && typeof body.respostas === 'object' ? (body.respostas as Record<string, unknown>) : {}
    const assinaturaNome = typeof body?.assinaturaNome === 'string' ? body.assinaturaNome.slice(0, 120) : ''
    // data URL do traço (limite ~500 KB para evitar abuso)
    const assinaturaImagem = typeof body?.assinaturaImagem === 'string' ? body.assinaturaImagem.slice(0, 500000) : ''
    const autorizacaoImagem = typeof body?.autorizacaoImagem === 'string' ? body.autorizacaoImagem : ''
    const consentimentoAceite = !!body?.consentimentoAceite
    const rgpdAceite = !!body?.rgpdAceite
    const userAgent = req.headers.get('user-agent') || undefined

    const result = await submeterAnamneseFiber({
      token,
      respostas,
      assinaturaNome,
      assinaturaImagem,
      autorizacaoImagem,
      consentimentoAceite,
      rgpdAceite,
      ip,
      userAgent,
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

    // Cópia por email (não bloqueia a resposta)
    const email = typeof respostas.email === 'string' ? respostas.email : ''
    if (email) {
      sendCopiaAnamnese({
        to: email,
        nome: typeof respostas.nome === 'string' ? respostas.nome : undefined,
        dataSubmissao: new Date().toISOString(),
        versao: CONSENTIMENTO_VERSAO,
        autorizacaoImagem,
      }).catch((e) => console.error('Erro a enviar cópia da anamnese:', e))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro submeter anamnese:', err)
    return NextResponse.json({ error: 'Erro ao submeter. Tente novamente.' }, { status: 500 })
  }
}
