import { NextRequest, NextResponse } from 'next/server'
import { verifyChannelToken, processCalendarChanges } from '@/lib/googleCalendarSync'
import { getAdminDb } from '@/lib/firebaseAdmin'

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
  const db = getAdminDb()
  if (!db) {
    // Se admin SDK não inicializou, devolvemos 200 para não causar retry — o problema é nosso
    console.error('Admin SDK não inicializado no webhook Google Calendar')
    return NextResponse.json({ received: true, warning: 'admin-sdk não disponível' })
  }

  try {
    const snap = await db.collection('settings').doc('googleCalendarSync').get()
    const state = snap.exists ? snap.data() : null
    const expectedChannelId = state?.channelId
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
    // Dispara processamento async — NÃO await
    queueMicrotask(() => {
      processCalendarChanges().catch((err) => {
        console.error('processCalendarChanges falhou:', err)
      })
    })
  }

  // 5. Sempre 200 dentro de poucos segundos
  return NextResponse.json({ received: true })
}

// Google Calendar push usa POST; outras chamadas devolvem 405
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
