import { db, storage } from './firebase'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

export interface Acompanhamento {
  id?: string
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataProcedimento: string // 'YYYY-MM-DD'
  codigoAcesso: string // 6 digits
  retoqueData?: string // 'YYYY-MM-DD'
  retoqueConfirmado?: boolean
  ultimaAtividadeCliente?: Timestamp | null
  ultimaAtividadeAdmin?: Timestamp | null
  fechado?: boolean
  criadoEm?: Timestamp
}

export interface Mensagem {
  id?: string
  de: 'admin' | 'cliente'
  texto: string
  criadoEm?: Timestamp
}

export interface Foto {
  id?: string
  diaIdx?: number
  url: string
  storagePath: string
  criadoEm?: Timestamp
}

function gerarCodigo6(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function calcularRetoqueData(dataProcedimento: string): string {
  // 30 dias depois
  const d = new Date(dataProcedimento + 'T12:00:00')
  d.setDate(d.getDate() + 30)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function getTodosAcompanhamentos(): Promise<Acompanhamento[]> {
  if (!db) return []
  try {
    const q = query(collection(db, 'acompanhamentos'), orderBy('criadoEm', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Acompanhamento))
  } catch {
    return []
  }
}

export async function getAcompanhamentoPorCodigo(codigo: string): Promise<Acompanhamento | null> {
  if (!db) return null
  try {
    const q = query(collection(db, 'acompanhamentos'), where('codigoAcesso', '==', codigo))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Acompanhamento
  } catch {
    return null
  }
}

export async function getAcompanhamentoPorAgendamento(agendamentoId: string): Promise<Acompanhamento | null> {
  if (!db) return null
  try {
    const q = query(collection(db, 'acompanhamentos'), where('agendamentoId', '==', agendamentoId))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Acompanhamento
  } catch {
    return null
  }
}

export async function getAcompanhamentoPorId(id: string): Promise<Acompanhamento | null> {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, 'acompanhamentos', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Acompanhamento
  } catch {
    return null
  }
}

export async function criarAcompanhamento(params: {
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataProcedimento: string
}): Promise<{ id: string; codigoAcesso: string }> {
  // Reaproveitar se já existe para o mesmo agendamento
  if (params.agendamentoId) {
    const existente = await getAcompanhamentoPorAgendamento(params.agendamentoId)
    if (existente && existente.id) {
      return { id: existente.id, codigoAcesso: existente.codigoAcesso }
    }
  }

  const codigoAcesso = gerarCodigo6()
  const retoqueData = calcularRetoqueData(params.dataProcedimento)

  const ref = await addDoc(collection(db, 'acompanhamentos'), {
    agendamentoId: params.agendamentoId || null,
    clienteNome: params.clienteNome,
    clienteEmail: params.clienteEmail,
    clienteTelefone: params.clienteTelefone || '',
    servicoNome: params.servicoNome,
    dataProcedimento: params.dataProcedimento,
    codigoAcesso,
    retoqueData,
    retoqueConfirmado: false,
    fechado: false,
    criadoEm: serverTimestamp(),
  })

  return { id: ref.id, codigoAcesso }
}

export async function confirmarRetoque(id: string, confirmado: boolean): Promise<void> {
  await updateDoc(doc(db, 'acompanhamentos', id), { retoqueConfirmado: confirmado })
}

export async function fecharAcompanhamento(id: string): Promise<void> {
  await updateDoc(doc(db, 'acompanhamentos', id), { fechado: true })
}

// Mensagens
export async function adicionarMensagem(
  acompanhamentoId: string,
  de: 'admin' | 'cliente',
  texto: string
): Promise<void> {
  const t = texto.trim()
  if (!t) return
  await addDoc(collection(db, 'acompanhamentos', acompanhamentoId, 'mensagens'), {
    de,
    texto: t,
    criadoEm: serverTimestamp(),
  })
  await setDoc(
    doc(db, 'acompanhamentos', acompanhamentoId),
    de === 'admin'
      ? { ultimaAtividadeAdmin: serverTimestamp() }
      : { ultimaAtividadeCliente: serverTimestamp() },
    { merge: true }
  )
}

export function subscribeMensagens(
  acompanhamentoId: string,
  callback: (msgs: Mensagem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'acompanhamentos', acompanhamentoId, 'mensagens'),
    orderBy('criadoEm', 'asc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Mensagem)))
  })
}

// Fotos
export async function uploadFoto(
  acompanhamentoId: string,
  file: File,
  diaIdx?: number
): Promise<Foto> {
  if (!storage) throw new Error('Storage indisponível')
  const path = `acompanhamentos/${acompanhamentoId}/${Date.now()}_${file.name}`
  const ref = storageRef(storage, path)
  await uploadBytes(ref, file)
  const url = await getDownloadURL(ref)
  const docRef = await addDoc(collection(db, 'acompanhamentos', acompanhamentoId, 'fotos'), {
    diaIdx: diaIdx ?? null,
    url,
    storagePath: path,
    criadoEm: serverTimestamp(),
  })
  return { id: docRef.id, diaIdx, url, storagePath: path }
}

export async function getFotos(acompanhamentoId: string): Promise<Foto[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'acompanhamentos', acompanhamentoId, 'fotos'),
      orderBy('criadoEm', 'asc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Foto))
  } catch {
    return []
  }
}
