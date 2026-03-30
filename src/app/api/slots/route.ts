import { NextRequest, NextResponse } from 'next/server'
import { getSlotsDisponiveis } from '@/lib/booking'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')
  const duracao = parseInt(searchParams.get('duracao') || '60', 10)

  if (!data) {
    return NextResponse.json({ error: 'Parâmetro "data" é obrigatório' }, { status: 400 })
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ error: 'Formato de data inválido. Use YYYY-MM-DD' }, { status: 400 })
  }

  // Validate date is not in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const requestedDate = new Date(data + 'T00:00:00')
  if (requestedDate <= today) {
    return NextResponse.json(
      { slots: [], motivo: 'Não é possível agendar para datas passadas ou hoje' },
      { status: 200 }
    )
  }

  // Validate date is not weekend
  const day = requestedDate.getDay()
  if (day === 0 || day === 6) {
    return NextResponse.json(
      { slots: [], motivo: 'Não abrimos ao fim de semana' },
      { status: 200 }
    )
  }

  const slots = await getSlotsDisponiveis(data, duracao)
  return NextResponse.json({ slots })
}
