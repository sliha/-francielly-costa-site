import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { getConsultaVirtualPorId, atualizarEstadoConsulta } from '@/lib/consultasVirtuais'
import { deleteCalendarEvent } from '@/lib/googleCalendar'

export const runtime = 'nodejs'

// Cancela a consulta virtual E remove o evento/Meet do Google Calendar.
// (O update direto na UI deixava a videochamada ativa na agenda da Francielly.)
export async function POST(req: Request) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let id = ''
  try {
    const body = await req.json()
    id = typeof body?.id === 'string' ? body.id : ''
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!id) return NextResponse.json({ error: 'id em falta' }, { status: 400 })

  const consulta = await getConsultaVirtualPorId(id)
  if (!consulta) return NextResponse.json({ error: 'Consulta não encontrada' }, { status: 404 })

  let warning: string | undefined
  if (consulta.googleEventId) {
    try {
      await deleteCalendarEvent(consulta.googleEventId)
    } catch (err) {
      console.error('Falha ao remover evento Google da consulta virtual:', err)
      warning = 'Estado atualizado, mas falhou remover o evento do Google Calendar.'
    }
  }

  await atualizarEstadoConsulta(id, 'cancelada')
  return NextResponse.json({ success: true, warning })
}
