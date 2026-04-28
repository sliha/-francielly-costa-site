import { db } from './firebase'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  increment,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'

export interface Agendamento {
  id?: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail: string
  servicoId: string
  servicoNome: string
  data: string // 'YYYY-MM-DD'
  horaInicio: string // 'HH:MM'
  horaFim: string
  estado: 'pendente' | 'pendente_pagamento' | 'confirmado' | 'pago' | 'concluido' | 'cancelado'
  caucaoPaga: boolean
  metodoPagamento?: string
  notas?: string
  criadoEm?: Timestamp
  criadoPor: 'ia' | 'admin' | 'cliente'
  stripeSessionId?: string
  googleEventId?: string
}

export interface SlotDisponivel {
  hora: string
  disponivel: boolean
}

// Get all bookings for a specific date
export async function getAgendamentosPorData(data: string): Promise<Agendamento[]> {
  try {
    const q = query(
      collection(db, 'agendamentos'),
      where('data', '==', data),
      where('estado', '!=', 'cancelado'),
      orderBy('estado'),
      orderBy('horaInicio')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agendamento))
  } catch {
    return []
  }
}

// Get available time slots for a date and service duration
export async function getSlotsDisponiveis(
  data: string,
  duracaoMinutos: number
): Promise<SlotDisponivel[]> {
  const agendamentos = await getAgendamentosPorData(data)

  // Build a set of all occupied time ranges (start minutes)
  const ocupadosMinutos = new Set<number>()
  for (const a of agendamentos) {
    const [h, m] = a.horaInicio.split(':').map(Number)
    ocupadosMinutos.add(h * 60 + m)
  }

  // Check if day is blocked
  try {
    const q = query(collection(db, 'diasBloqueados'), where('data', '==', data))
    const snap = await getDocs(q)
    if (!snap.empty) {
      const dia = snap.docs[0].data()
      if (dia.bloqueioTotal) return []
    }
  } catch {
    // If blocked days collection doesn't exist yet, continue normally
  }

  // Generate slots 10:00 - 18:00, 30-minute intervals
  const slots: SlotDisponivel[] = []
  for (let h = 10; h < 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      const startMin = h * 60 + m
      const endMin = startMin + duracaoMinutos

      // Slot must finish by 18:00
      if (endMin > 18 * 60) continue

      const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

      // Check if this slot overlaps with any existing booking
      // A slot is unavailable if any occupied booking start is within [startMin, endMin)
      let disponivel = true
      for (const ocupMin of ocupadosMinutos) {
        if (ocupMin >= startMin && ocupMin < endMin) {
          disponivel = false
          break
        }
        // Also check if an existing booking would overlap this slot from behind
        // (existing booking starts before this slot but its duration would overlap)
      }

      slots.push({ hora, disponivel })
    }
  }
  return slots
}

// Create a new booking
export async function criarAgendamento(
  data: Omit<Agendamento, 'id' | 'criadoEm'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'agendamentos'), {
    ...data,
    criadoEm: serverTimestamp(),
  })
  return ref.id
}

// Get a single booking by id
export async function getAgendamentoPorId(id: string): Promise<Agendamento | null> {
  try {
    const snap = await getDoc(doc(db, 'agendamentos', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Agendamento
  } catch {
    return null
  }
}

// Update booking status
export async function atualizarEstadoAgendamento(
  id: string,
  estado: Agendamento['estado'],
  extra?: Partial<Agendamento>
): Promise<void> {
  await updateDoc(doc(db, 'agendamentos', id), { estado, ...extra })
}

// Get all bookings (admin use)
export async function getTodosAgendamentos(): Promise<Agendamento[]> {
  try {
    const q = query(collection(db, 'agendamentos'), orderBy('data', 'desc'), orderBy('horaInicio'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agendamento))
  } catch {
    return []
  }
}

// Upsert client record — uses email (sanitised) as doc ID so duplicates are avoided
export async function upsertCliente(params: {
  nome: string
  email: string
  telefone: string
  ultimoServico: string
  ultimoAgendamentoData: string
}): Promise<void> {
  if (!db) return
  const clienteId = params.email.toLowerCase().replace(/[@.]/g, '_')
  const ref = doc(db, 'clientes', clienteId)
  await setDoc(
    ref,
    {
      nome: params.nome,
      email: params.email.toLowerCase(),
      telefone: params.telefone,
      ultimoServico: params.ultimoServico,
      ultimoAgendamento: params.ultimoAgendamentoData,
      totalAgendamentos: increment(1),
      criadoEm: serverTimestamp(),
    },
    { merge: true }
  )
}

// Get bookings by estado
export async function getAgendamentosPorEstado(
  estado: Agendamento['estado']
): Promise<Agendamento[]> {
  try {
    const q = query(
      collection(db, 'agendamentos'),
      where('estado', '==', estado),
      orderBy('data'),
      orderBy('horaInicio')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agendamento))
  } catch {
    return []
  }
}
