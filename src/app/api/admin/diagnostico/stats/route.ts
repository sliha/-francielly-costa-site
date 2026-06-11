import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSyncState } from '@/lib/googleCalendarSync'

export const runtime = 'nodejs'

const msFrom = (iso?: string | null) => (iso ? new Date(iso).getTime() : null)

export async function GET(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const sb = supabaseAdmin()

  const hoje = new Date()
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`

  // Estado da sincronização (settings → googleCalendarSync, via helper)
  const sync = await getSyncState()

  // Agendamentos ativos (a partir de hoje)
  const { data: ativosRows } = await sb
    .from('agendamentos')
    .select('id, cliente_nome, servico_nome, data, hora_inicio, estado, google_event_id')
    .gte('data', hojeStr)
  const ativosFiltrados = (ativosRows || []).filter((d) => {
    const e = d.estado
    return e === 'pendente' || e === 'confirmado' || e === 'pago'
  })
  const comGoogle = ativosFiltrados.filter((d) => !!d.google_event_id).length
  const semGoogle = ativosFiltrados.length - comGoogle
  const semGoogleList = ativosFiltrados
    .filter((d) => !d.google_event_id)
    .slice(0, 20)
    .map((a) => ({
      id: a.id,
      clienteNome: a.cliente_nome || '',
      servicoNome: a.servico_nome || '',
      data: a.data || '',
      horaInicio: a.hora_inicio || '',
      estado: a.estado || '',
    }))

  // Bloqueios externos (a partir de hoje)
  const { data: bloqueiosRows } = await sb
    .from('dias_bloqueados')
    .select('origem')
    .gte('data', hojeStr)
  const bloqueios = bloqueiosRows || []
  const bloqueiosExternos = bloqueios.filter((d) => d.origem === 'google-externo').length

  // Idempotência: últimos 30 dias
  const ttlCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: procRows } = await sb
    .from('processed_events')
    .select('source, processed_at')
    .gte('processed_at', ttlCutoff)
  const proc = procRows || []
  const stripeCount = proc.filter((d) => d.source === 'stripe').length
  const googleCount = proc.filter((d) => d.source === 'google-calendar').length

  // Alertas ativos
  const { data: alertasRows } = await sb
    .from('alertas')
    .select('*')
    .eq('resolvido', false)
    .order('criado_em', { ascending: false })
    .limit(10)
  const alertas = (alertasRows || []).map((d) => ({
    ...d,
    criadoEm: msFrom(d.criado_em),
  }))

  return NextResponse.json({
    sync: sync && Object.keys(sync).length > 0
      ? {
          channelId: sync.channelId || null,
          channelExpiration: sync.channelExpiration || null,
          lastSyncAt: msFrom(sync.lastSyncAt),
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
      total: bloqueios.length,
      externos: bloqueiosExternos,
    },
    idempotencia: {
      stripe30d: stripeCount,
      google30d: googleCount,
    },
    alertas,
  })
}
