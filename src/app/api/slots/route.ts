import { NextRequest, NextResponse } from 'next/server'
import { getSlotsDisponiveis } from '@/lib/booking'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')
  const duracao = parseInt(searchParams.get('duracao') || '60', 10)

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
  if (day === 0 || day === 6) {
    return NextResponse.json(
      { slots: [], motivo: 'Não abrimos ao fim de semana' },
      { status: 200 }
    )
  }

  // Check if day is blocked in Firestore
  if (db) {
    try {
      const q = query(collection(db, 'diasBloqueados'), where('data', '==', data))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const bloqueio = snap.docs[0].data()
        if (bloqueio.bloqueioTotal) {
          return NextResponse.json(
            { slots: [], motivo: bloqueio.motivo || 'Dia indisponível' },
            { status: 200 }
          )
        }
        // Partial block: filter out blocked hours later
        const horasBloqueadas: string[] = bloqueio.horasBloqueadas ?? []
        if (horasBloqueadas.length > 0) {
          const slots = await getSlotsDisponiveis(data, duracao)
          const filtered = slots.map((s) => ({
            ...s,
            disponivel: s.disponivel && !horasBloqueadas.includes(s.hora),
          }))
          return NextResponse.json({ slots: filtered })
        }
      }
    } catch {
      // If Firestore check fails, continue normally
    }
  }

  const slots = await getSlotsDisponiveis(data, duracao)
  return NextResponse.json({ slots })
}
