import { NextResponse } from 'next/server'
import { verifyAdminRequest, getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { upsertCalendarEventVerbose, createBlockEvent } from '@/lib/googleCalendar'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

const ESTADOS_ATIVOS = ['pendente', 'confirmado', 'pago']

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = getAdminDb()
  if (!db) {
    return NextResponse.json(
      { error: getAdminInitError() || 'firebase-admin não inicializado' },
      { status: 500 },
    )
  }

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
  // Query simples por `data` (apenas 1 where → não requer índice composto).
  // Filtro de `estado` em memória — futuro é tipicamente <100 docs.
  try {
    const snap = await db
      .collection('agendamentos')
      .where('data', '>=', hojeStr)
      .get()

    const ativos = snap.docs.filter((d) => ESTADOS_ATIVOS.includes(d.data().estado))
    totalAgendamentos = ativos.length

    for (const docSnap of ativos) {
      const a = docSnap.data()
      const id = docSnap.id
      const tinhaEvento = !!a.googleEventId
      try {
        const result = await upsertCalendarEventVerbose({
          clienteNome: a.clienteNome || '',
          clienteEmail: a.clienteEmail || '',
          clienteTelefone: a.clienteTelefone || '',
          servicoNome: a.servicoNome || '',
          data: a.data,
          horaInicio: a.horaInicio,
          horaFim: a.horaFim || '',
          agendamentoId: id,
          estado: a.estado,
          googleEventId: a.googleEventId,
        })
        if (!result.ok) {
          falhas++
          erros.push({ id, tipo: 'agendamento', motivo: result.error })
        } else {
          const update: Record<string, unknown> = { lastGoogleSyncAt: Timestamp.now() }
          if (result.mode === 'create') update.googleEventId = result.eventId
          await db.collection('agendamentos').doc(id).update(update)
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
    const snap = await db
      .collection('diasBloqueados')
      .where('data', '>=', hojeStr)
      .get()

    totalBloqueios = snap.size

    for (const docSnap of snap.docs) {
      const d = docSnap.data()
      if (Array.isArray(d.googleEventIds) && d.googleEventIds.length > 0) continue
      // Tentar criar evento(s) de bloqueio
      try {
        const eids: string[] = []
        if (d.bloqueioTotal) {
          const eid = await createBlockEvent({
            data: d.data,
            motivo: d.motivo || 'Bloqueado',
            bloqueioTotal: true,
            docId: docSnap.id,
          })
          if (eid) eids.push(eid)
        } else if (Array.isArray(d.horasBloqueadas)) {
          for (const hora of d.horasBloqueadas) {
            const [h, m] = String(hora).split(':').map(Number)
            const total = h * 60 + m + 30
            const horaFim = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
            const eid = await createBlockEvent({
              data: d.data,
              horaInicio: hora,
              horaFim,
              motivo: d.motivo || 'Bloqueado',
              bloqueioTotal: false,
              docId: docSnap.id,
            })
            if (eid) eids.push(eid)
          }
        }
        if (eids.length > 0) {
          await db.collection('diasBloqueados').doc(docSnap.id).update({ googleEventIds: eids })
        } else {
          erros.push({ id: docSnap.id, tipo: 'bloqueio', motivo: 'sem eventos criados' })
        }
      } catch (err) {
        erros.push({
          id: docSnap.id,
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
