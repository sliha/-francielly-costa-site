import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { upsertCalendarEventVerbose, createBlockEvent } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

const ESTADOS_ATIVOS = ['pendente', 'confirmado', 'pago']

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const sb = supabaseAdmin()

  const hojeStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const erros: Array<{ id: string; tipo: 'agendamento' | 'bloqueio'; motivo: string }> = []
  let totalAgendamentos = 0
  let criadosNovos = 0
  let atualizados = 0
  let falhas = 0
  let totalBloqueios = 0

  // 1. Agendamentos ativos a partir de hoje.
  // Query simples por `data` (>= hoje) + filtro de estados ativos.
  try {
    const { data: rows, error } = await sb
      .from('agendamentos')
      .select('*')
      .gte('data', hojeStr)
      .in('estado', ESTADOS_ATIVOS)
    if (error) throw new Error(error.message)

    const ativos = rows || []
    totalAgendamentos = ativos.length

    for (const a of ativos) {
      const id = a.id as string
      const tinhaEvento = !!a.google_event_id
      try {
        const result = await upsertCalendarEventVerbose({
          clienteNome: a.cliente_nome || '',
          clienteEmail: a.cliente_email || '',
          clienteTelefone: a.cliente_telefone || '',
          servicoNome: a.servico_nome || '',
          data: a.data,
          horaInicio: a.hora_inicio,
          horaFim: a.hora_fim || '',
          agendamentoId: id,
          estado: a.estado,
          googleEventId: a.google_event_id || undefined,
        })
        if (!result.ok) {
          falhas++
          erros.push({ id, tipo: 'agendamento', motivo: result.error })
        } else {
          const update: Record<string, unknown> = { last_google_sync_at: new Date().toISOString() }
          if (result.mode === 'create') update.google_event_id = result.eventId
          await sb.from('agendamentos').update(update).eq('id', id)
          if (tinhaEvento && result.mode === 'update') atualizados++
          else criadosNovos++
        }
      } catch (err) {
        falhas++
        erros.push({ id, tipo: 'agendamento', motivo: err instanceof Error ? err.message : String(err) })
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Erro a ler agendamentos: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }

  // 2. Bloqueios futuros sem googleEventIds
  try {
    const { data: rows, error } = await sb
      .from('dias_bloqueados')
      .select('*')
      .gte('data', hojeStr)
    if (error) throw new Error(error.message)

    const bloqueios = rows || []
    totalBloqueios = bloqueios.length

    for (const d of bloqueios) {
      const docId = d.id as string
      if (Array.isArray(d.google_event_ids) && d.google_event_ids.length > 0) continue
      // Tentar criar evento(s) de bloqueio
      try {
        const eids: string[] = []
        if (d.bloqueio_total) {
          const eid = await createBlockEvent({
            data: d.data,
            motivo: d.motivo || 'Bloqueado',
            bloqueioTotal: true,
            docId,
          })
          if (eid) eids.push(eid)
        } else if (Array.isArray(d.horas_bloqueadas)) {
          for (const hora of d.horas_bloqueadas) {
            const [h, m] = String(hora).split(':').map(Number)
            const total = h * 60 + m + 30
            const horaFim = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
            const eid = await createBlockEvent({
              data: d.data,
              horaInicio: hora,
              horaFim,
              motivo: d.motivo || 'Bloqueado',
              bloqueioTotal: false,
              docId,
            })
            if (eid) eids.push(eid)
          }
        }
        if (eids.length > 0) {
          await sb.from('dias_bloqueados').update({ google_event_ids: eids }).eq('id', docId)
        } else {
          erros.push({ id: docId, tipo: 'bloqueio', motivo: 'sem eventos criados' })
        }
      } catch (err) {
        erros.push({
          id: docId,
          tipo: 'bloqueio',
          motivo: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } catch (err) {
    console.error('Erro a sincronizar bloqueios:', err)
  }

  return NextResponse.json({
    success: true,
    totalAgendamentos,
    criadosNovos,
    atualizados,
    falhas,
    totalBloqueios,
    erros,
  })
}
