import { db } from './firebase'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'

export interface ConsultaVirtual {
  id?: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail: string
  servicoInteresse: string
  data: string // 'YYYY-MM-DD'
  hora: string // 'HH:MM'
  duvida?: string
  meetLink?: string
  googleEventId?: string
  estado: 'pendente' | 'confirmada' | 'concluida' | 'cancelada'
  criadoEm?: Timestamp
}

export async function criarConsultaVirtual(params: {
  clienteNome: string
  clienteTelefone: string
  clienteEmail: string
  servicoInteresse: string
  data: string
  hora: string
  duvida?: string
  meetLink?: string
  googleEventId?: string
}): Promise<string> {
  const ref = await addDoc(collection(db, 'consultasVirtuais'), {
    clienteNome: params.clienteNome,
    clienteTelefone: params.clienteTelefone,
    clienteEmail: params.clienteEmail,
    servicoInteresse: params.servicoInteresse,
    data: params.data,
    hora: params.hora,
    duvida: params.duvida || '',
    meetLink: params.meetLink || '',
    googleEventId: params.googleEventId || '',
    estado: 'pendente',
    criadoEm: serverTimestamp(),
  })
  return ref.id
}

export async function getTodasConsultasVirtuais(): Promise<ConsultaVirtual[]> {
  if (!db) return []
  try {
    const q = query(collection(db, 'consultasVirtuais'), orderBy('data', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConsultaVirtual))
  } catch {
    return []
  }
}

export async function getConsultaVirtualPorId(id: string): Promise<ConsultaVirtual | null> {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, 'consultasVirtuais', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as ConsultaVirtual
  } catch {
    return null
  }
}

export async function atualizarEstadoConsulta(
  id: string,
  estado: ConsultaVirtual['estado']
): Promise<void> {
  await updateDoc(doc(db, 'consultasVirtuais', id), { estado })
}
