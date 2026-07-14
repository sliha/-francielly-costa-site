import { NextRequest, NextResponse } from 'next/server'
import { getSlotsDisponiveis } from '@/lib/booking'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { servicoAbreNoDia, temHorarioRestrito } from '@/lib/horariosServico'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')
  const duracao = parseInt(searchParams.get('duracao') || '60', 10)
  const servicoId = (searchParams.get('servicoId') || '').trim()

  if (!data) {
    return NextResponse.json({ error: 'Parâmetro "data" é obrigatório' }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ error: 'Formato de data inválido. Use YYYY-MM-DD' }, { status: 400 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const requestedDate = new Date(data + 'T00:00:00')
  if (requestedDate <= today) {
    return NextResponse.json(
      { slots: [], motivo: 'Não é possível agendar para datas passadas ou hoje' },
      { status: 200 }
    )
  }

  const day = requestedDate.getDay()
  if (!servicoAbreNoDia(servicoId, day)) {
    const motivo = temHorarioRestrito(servicoId)
      ? 'Este serviço não tem marcações neste dia. Por favor, escolha outro dia.'
      : 'Não abrimos ao fim de semana'
    return NextResponse.json({ slots: [], motivo }, { status: 200 })
  }

  // Check if day is fully blocked (devolve motivo personalizado).
  // Os bloqueios parciais (horas) são tratados dentro de getSlotsDisponiveis.
  try {
    const { data: bloqueios } = await supabaseAdmin()
      .from('dias_bloqueados')
      .select('motivo, bloqueio_total')
      .eq('data', data)
    const total = (bloqueios ?? []).find((b) => b.bloqueio_total)
    if (total) {
      return NextResponse.json(
        { slots: [], motivo: total.motivo || 'Dia indisponível' },
        { status: 200 }
      )
    }
  } catch {
    // If the block check fails, continue normally
  }

  const slots = await getSlotsDisponiveis(data, duracao, servicoId || undefined)
  return NextResponse.json({ slots })
}
