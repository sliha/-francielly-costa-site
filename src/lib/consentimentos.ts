import { db } from './firebase'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'

export interface RespostasAnamnese {
  alergias?: string
  medicacao?: string
  gravidaOuAmamenta?: boolean
  doencasCardiovasculares?: boolean
  problemasCoagulacao?: boolean
  diabetes?: boolean
  procedimentoAnterior?: boolean
  queloides?: boolean
  notasAdicionais?: string
}

export interface Consentimento {
  id?: string
  token: string
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataAgendamento: string // 'YYYY-MM-DD'
  estado: 'pendente' | 'submetido'
  dataLinkEnviado?: Timestamp | null
  dataSubmissao?: Timestamp | null
  respostas?: RespostasAnamnese
  assinaturaNome?: string
  consentimentoAceite?: boolean
  rgpdAceite?: boolean
  alertas?: string[]
  criadoEm?: Timestamp
}

function gerarToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  )
}

export async function getTodosConsentimentos(): Promise<Consentimento[]> {
  if (!db) return []
  try {
    const q = query(collection(db, 'consentimentos'), orderBy('criadoEm', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Consentimento))
  } catch {
    return []
  }
}

export async function getConsentimentoPorToken(token: string): Promise<Consentimento | null> {
  if (!db) return null
  try {
    const q = query(collection(db, 'consentimentos'), where('token', '==', token))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Consentimento
  } catch {
    return null
  }
}

export async function getConsentimentoPorAgendamento(
  agendamentoId: string
): Promise<Consentimento | null> {
  if (!db) return null
  try {
    const q = query(collection(db, 'consentimentos'), where('agendamentoId', '==', agendamentoId))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() } as Consentimento
  } catch {
    return null
  }
}

export async function criarConsentimento(params: {
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataAgendamento: string
}): Promise<{ id: string; token: string }> {
  const token = gerarToken()
  const ref = await addDoc(collection(db, 'consentimentos'), {
    token,
    agendamentoId: params.agendamentoId || null,
    clienteNome: params.clienteNome,
    clienteEmail: params.clienteEmail,
    clienteTelefone: params.clienteTelefone || '',
    servicoNome: params.servicoNome,
    dataAgendamento: params.dataAgendamento,
    estado: 'pendente',
    dataLinkEnviado: serverTimestamp(),
    criadoEm: serverTimestamp(),
  })
  return { id: ref.id, token }
}

export async function reenviarLinkConsentimento(id: string): Promise<void> {
  await updateDoc(doc(db, 'consentimentos', id), {
    dataLinkEnviado: serverTimestamp(),
  })
}

export async function submeterConsentimento(
  token: string,
  payload: {
    respostas: RespostasAnamnese
    assinaturaNome: string
    consentimentoAceite: boolean
    rgpdAceite: boolean
  }
): Promise<{ ok: boolean; error?: string }> {
  if (!db) return { ok: false, error: 'Base de dados indisponível' }
  if (!payload.consentimentoAceite || !payload.rgpdAceite) {
    return { ok: false, error: 'É necessário aceitar os termos.' }
  }

  const q = query(collection(db, 'consentimentos'), where('token', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return { ok: false, error: 'Link inválido ou expirado.' }

  const docSnap = snap.docs[0]
  const cur = docSnap.data() as Consentimento
  if (cur.estado === 'submetido') {
    return { ok: false, error: 'Este consentimento já foi submetido.' }
  }

  const alertas = computarAlertas(payload.respostas)

  await updateDoc(doc(db, 'consentimentos', docSnap.id), {
    estado: 'submetido',
    dataSubmissao: serverTimestamp(),
    respostas: payload.respostas,
    assinaturaNome: payload.assinaturaNome,
    consentimentoAceite: true,
    rgpdAceite: true,
    alertas,
  })

  return { ok: true }
}

export function computarAlertas(r: RespostasAnamnese): string[] {
  const alertas: string[] = []
  if (r.gravidaOuAmamenta) alertas.push('Cliente grávida ou a amamentar — procedimento contra-indicado')
  if (r.doencasCardiovasculares) alertas.push('Doenças cardiovasculares — avaliar com médico antes')
  if (r.problemasCoagulacao) alertas.push('Problemas de coagulação — risco aumentado de hemorragia')
  if (r.diabetes) alertas.push('Diabetes — atenção redobrada à cicatrização')
  if (r.queloides) alertas.push('Tendência a queloides — risco cicatricial')
  if (r.alergias && r.alergias.trim().length > 0) alertas.push(`Alergias: ${r.alergias.trim()}`)
  if (r.medicacao && r.medicacao.trim().length > 0) alertas.push(`Medicação: ${r.medicacao.trim()}`)
  return alertas
}

export async function getDocPorId(id: string): Promise<Consentimento | null> {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, 'consentimentos', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Consentimento
  } catch {
    return null
  }
}
