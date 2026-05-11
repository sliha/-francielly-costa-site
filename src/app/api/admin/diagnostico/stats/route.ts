import { NextResponse } from 'next/server'
import { verifyAdminRequest, getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: getAdminInitError() || 'admin-sdk' }, { status: 500 })

  const hoje = new Date()
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  // Estado da sincronização
  const syncSnap = await db.collection('settings').doc('googleCalendarSync').get()
  const sync = syncSnap.exists ? syncSnap.data() : null

  // Agendamentos ativos
  const ativos = await db.collection('agendamentos').where('data', '>=', hojeStr).get()
  const ativosFiltrados = ativos.docs.filter((d) => {
    const e = d.data().estado
    return e === 'pendente' || e === 'confirmado' || e === 'pago'
  })
  const comGoogle = ativosFiltrados.filter((d) => !!d.data().googleEventId).length
  const semGoogle = ativosFiltrados.length - comGoogle
  const semGoogleList = ativosFiltrados
    .filter((d) => !d.data().googleEventId)
    .slice(0, 20)
    .map((d) => {
      const a = d.data()
      return {
        id: d.id,
        clienteNome: a.clienteNome || '',
        servicoNome: a.servicoNome || '',
        data: a.data || '',
        horaInicio: a.horaInicio || '',
        estado: a.estado || '',
      }
    })

  // Bloqueios externos
  const bloqueios = await db.collection('diasBloqueados').where('data', '>=', hojeStr).get()
  const bloqueiosExternos = bloqueios.docs.filter((d) => d.data().origem === 'google-externo').length

  // Idempotência: últimos 30 dias
  const ttlCutoff = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const procSnap = await db.collection('processedEvents').where('processedAt', '>=', ttlCutoff).get()
  const stripeCount = procSnap.docs.filter((d) => d.data().source === 'stripe').length
  const googleCount = procSnap.docs.filter((d) => d.data().source === 'google-calendar').length

  // Alertas ativos
  const alertasSnap = await db.collection('alertas').where('resolvido', '==', false).get()
  const alertas = alertasSnap.docs
    .sort((a, b) => {
      const ta = (a.data().criadoEm as Timestamp)?.toMillis() ?? 0
      const tb = (b.data().criadoEm as Timestamp)?.toMillis() ?? 0
      return tb - ta
    })
    .slice(0, 10)
    .map((d) => ({
      id: d.id,
      ...d.data(),
      criadoEm: (d.data().criadoEm as Timestamp)?.toMillis() ?? null,
    }))

  return NextResponse.json({
    sync: sync
      ? {
          channelId: sync.channelId || null,
          channelExpiration: sync.channelExpiration || null,
          lastSyncAt: (sync.lastSyncAt as Timestamp)?.toMillis() ?? null,
          lastSyncStatus: sync.lastSyncStatus || null,
          lastError: sync.lastError || null,
          syncTokenPresent: !!sync.syncToken,
        }
      : null,
    agendamentos: {
      ativos: ativosFiltrados.length,
      comGoogle,
      semGoogle,
      semGoogleList,
    },
    bloqueios: {
      total: bloqueios.size,
      externos: bloqueiosExternos,
    },
    idempotencia: {
      stripe30d: stripeCount,
      google30d: googleCount,
    },
    alertas,
  })
}
