import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { deleteCalendarEvent } from '@/lib/googleCalendar'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

interface Payload {
  docId?: string
}

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!body.docId) {
    return NextResponse.json({ error: 'docId é obrigatório' }, { status: 400 })
  }

  const sb = supabaseAdmin()

  const { data: bloqueio, error: getErr } = await sb
    .from('dias_bloqueados')
    .select('google_event_ids, google_event_id')
    .eq('id', body.docId)
    .maybeSingle()

  if (getErr) {
    return NextResponse.json({ error: `Base de dados: ${getErr.message}` }, { status: 500 })
  }
  if (!bloqueio) {
    return NextResponse.json({ error: 'Bloqueio não encontrado' }, { status: 404 })
  }

  // Apagar eventos Google
  const ids: string[] = []
  if (Array.isArray(bloqueio.google_event_ids)) ids.push(...bloqueio.google_event_ids)
  if (bloqueio.google_event_id) ids.push(bloqueio.google_event_id)

  let warning: string | undefined
  for (const eid of ids) {
    try {
      const ok = await deleteCalendarEvent(eid)
      if (!ok) warning = 'Bloqueio apagado mas falhou remover algum evento Google'
    } catch (err) {
      console.error('Erro ao apagar evento Google:', err)
      warning = 'Bloqueio apagado mas erro ao remover evento Google'
    }
  }

  // Apagar registo
  const { error: delErr } = await sb.from('dias_bloqueados').delete().eq('id', body.docId)
  if (delErr) {
    return NextResponse.json({ error: `Base de dados: ${delErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, warning })
}
