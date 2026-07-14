import { NextRequest, NextResponse } from 'next/server'
import { upsertRascunhoFiber } from '@/lib/consentimentos'
import { sendLinkContinuarAnamnese } from '@/lib/emailAnamnese'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'

export const runtime = 'nodejs'

/**
 * Guarda um rascunho da anamnese (guardar para continuar mais tarde).
 * Público. Se `enviarLink` e houver email, envia o link de continuação.
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`anamnese-guardar:${getClientIp(req)}`, 30, 15 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const body = await req.json()
    const token = typeof body?.token === 'string' && body.token ? body.token : undefined
    const respostas =
      body?.respostas && typeof body.respostas === 'object' ? (body.respostas as Record<string, unknown>) : {}
    const progressoStep = Number.isFinite(body?.progressoStep) ? Number(body.progressoStep) : 0
    const enviarLink = !!body?.enviarLink

    const nome = typeof respostas.nome === 'string' ? respostas.nome.slice(0, 120) : undefined
    const email =
      typeof respostas.email === 'string' ? respostas.email.trim().toLowerCase().slice(0, 254) : undefined
    const telefone = typeof respostas.telefone === 'string' ? respostas.telefone.slice(0, 30) : undefined

    if (enviarLink && !email) {
      return NextResponse.json(
        { error: 'Para receber o link por email, indique primeiro o seu email.' },
        { status: 400 },
      )
    }

    const result = await upsertRascunhoFiber({
      token,
      nome,
      email,
      telefone,
      respostas,
      progressoStep,
      origem: 'cliente',
    })
    if (!result.ok || !result.token) {
      return NextResponse.json({ error: result.error || 'Erro ao guardar.' }, { status: 400 })
    }

    let emailEnviado = false
    if (enviarLink && email) {
      try {
        await sendLinkContinuarAnamnese({ to: email, nome, token: result.token })
        emailEnviado = true
      } catch (e) {
        console.error('Erro a enviar link de continuar:', e)
      }
    }

    return NextResponse.json({ ok: true, token: result.token, emailEnviado })
  } catch (err) {
    console.error('Erro guardar anamnese:', err)
    return NextResponse.json({ error: 'Erro ao guardar. Tente novamente.' }, { status: 500 })
  }
}
