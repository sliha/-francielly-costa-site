import { NextRequest, NextResponse } from 'next/server'
import { verifyChannelToken, processCalendarChanges, getSyncState } from '@/lib/googleCalendarSync'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // 1. Headers obrigatórios do Google
  const channelId = req.headers.get('x-goog-channel-id') || ''
  const resourceId = req.headers.get('x-goog-resource-id') || ''
  const resourceState = req.headers.get('x-goog-resource-state') || ''
  const channelToken = req.headers.get('x-goog-channel-token') || ''

  if (!channelId || !resourceId || !resourceState) {
    return NextResponse.json({ error: 'Headers obrigatórios em falta' }, { status: 400 })
  }

  // 2. Verificar token HMAC
  if (!channelToken || !verifyChannelToken(channelId, channelToken)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  // 3. Verificar que o canal corresponde ao registado em settings/googleCalendarSync
  try {
    const state = await getSyncState()
    const expectedChannelId = state.channelId
    if (!expectedChannelId || expectedChannelId !== channelId) {
      // Canal antigo ou desconhecido — pedimos ao Google para parar
      return NextResponse.json({ error: 'Canal desconhecido' }, { status: 410 })
    }
  } catch (err) {
    console.error('Falha ao validar canal no webhook:', err)
    return NextResponse.json({ received: true })
  }

  // 4. resource state
  // 'sync' → handshake inicial, nada a fazer
  // 'exists' → algo mudou no calendário
  // 'not_exists' → recurso desapareceu (calendário apagado?)
  if (resourceState === 'sync') {
    return NextResponse.json({ received: true, handshake: true })
  }

  if (resourceState === 'exists') {
    // Em serverless (Vercel) a função congela após a resposta — por isso AGUARDAMOS
    // o processamento (incremental e idempotente, normalmente rápido) para garantir
    // que o sync Google->Site corre mesmo. Em caso de erro respondemos 200 na mesma
    // (o Google reentrega; a idempotência evita duplicados).
    try {
      await processCalendarChanges()
    } catch (err) {
      console.error('processCalendarChanges falhou:', err)
    }
  }

  // 5. Sempre 200
  return NextResponse.json({ received: true })
}

// Google Calendar push usa POST; outras chamadas devolvem 405
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
