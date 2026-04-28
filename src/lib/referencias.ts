import { db } from './firebase'
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
} from 'firebase/firestore'

export interface Referencia {
  id?: string
  codigoUsado: string
  refenteEmail: string // email do cliente que indicou
  refenteNome: string
  novoNome: string
  novoEmail: string
  agendamentoId: string
  servicoNome: string
  estado: 'pendente' | 'convertida' | 'cancelada'
  criadoEm?: Timestamp
  convertidaEm?: Timestamp | null
}

export interface ClienteComCodigo {
  email: string
  nome: string
  codigoReferencia: string
  totalEnviadas: number
  totalConvertidas: number
}

// Gera código determinístico baseado no nome + 4 chars do email hash
function gerarCodigo(nome: string, email: string): string {
  const prefixo = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')

  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) | 0
  }
  const sufixo = Math.abs(hash).toString(36).slice(0, 4).toUpperCase().padEnd(4, '0')
  return `${prefixo}${sufixo}`
}

function clienteIdFromEmail(email: string): string {
  return email.toLowerCase().replace(/[@.]/g, '_')
}

// Garante que o cliente tem código (cria se não tiver). Retorna o código.
export async function getOuCriarCodigoCliente(email: string, nome: string): Promise<string> {
  if (!db) throw new Error('Firestore indisponível')
  const id = clienteIdFromEmail(email)
  const ref = doc(db, 'clientes', id)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data = snap.data()
    if (data.codigoReferencia && typeof data.codigoReferencia === 'string') {
      return data.codigoReferencia
    }
  }

  const codigo = gerarCodigo(nome, email)
  await setDoc(
    ref,
    {
      email: email.toLowerCase(),
      nome,
      codigoReferencia: codigo,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  )
  return codigo
}

export async function getClientePorCodigoReferencia(codigo: string): Promise<{
  email: string
  nome: string
} | null> {
  if (!db) return null
  try {
    const q = query(collection(db, 'clientes'), where('codigoReferencia', '==', codigo))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0].data()
    return { email: String(d.email || ''), nome: String(d.nome || '') }
  } catch {
    return null
  }
}

export async function registrarReferencia(params: {
  codigoUsado: string
  novoNome: string
  novoEmail: string
  agendamentoId: string
  servicoNome: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!db) return { ok: false, error: 'Firestore indisponível' }

  const refente = await getClientePorCodigoReferencia(params.codigoUsado)
  if (!refente) return { ok: false, error: 'Código de referência inválido' }

  // Não permitir auto-referência
  if (refente.email.toLowerCase() === params.novoEmail.toLowerCase()) {
    return { ok: false, error: 'Não pode usar o seu próprio código' }
  }

  await addDoc(collection(db, 'referencias'), {
    codigoUsado: params.codigoUsado.toUpperCase(),
    refenteEmail: refente.email,
    refenteNome: refente.nome,
    novoNome: params.novoNome,
    novoEmail: params.novoEmail.toLowerCase(),
    agendamentoId: params.agendamentoId,
    servicoNome: params.servicoNome,
    estado: 'pendente',
    criadoEm: serverTimestamp(),
    convertidaEm: null,
  })

  return { ok: true }
}

export async function marcarReferenciaConvertida(agendamentoId: string): Promise<void> {
  if (!db) return
  try {
    const q = query(collection(db, 'referencias'), where('agendamentoId', '==', agendamentoId))
    const snap = await getDocs(q)
    for (const d of snap.docs) {
      const data = d.data()
      if (data.estado === 'pendente') {
        await updateDoc(doc(db, 'referencias', d.id), {
          estado: 'convertida',
          convertidaEm: serverTimestamp(),
        })
      }
    }
  } catch (err) {
    console.error('Erro ao marcar referência convertida:', err)
  }
}

export async function getTodasReferencias(): Promise<Referencia[]> {
  if (!db) return []
  try {
    const q = query(collection(db, 'referencias'), orderBy('criadoEm', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Referencia))
  } catch {
    return []
  }
}

// Agrupa referências por cliente refente para o admin
export async function getReferenciasAgrupadas(): Promise<{
  refenteEmail: string
  refenteNome: string
  codigoReferencia: string
  totalEnviadas: number
  totalConvertidas: number
  ultimaActividade?: Timestamp | null
  referencias: Referencia[]
}[]> {
  const todas = await getTodasReferencias()
  const map = new Map<string, {
    refenteEmail: string
    refenteNome: string
    codigoReferencia: string
    referencias: Referencia[]
  }>()

  for (const r of todas) {
    const chave = r.refenteEmail
    const cur = map.get(chave) || {
      refenteEmail: r.refenteEmail,
      refenteNome: r.refenteNome,
      codigoReferencia: r.codigoUsado,
      referencias: [],
    }
    cur.referencias.push(r)
    map.set(chave, cur)
  }

  return Array.from(map.values()).map((g) => ({
    ...g,
    totalEnviadas: g.referencias.length,
    totalConvertidas: g.referencias.filter((x) => x.estado === 'convertida').length,
    ultimaActividade: g.referencias[0]?.criadoEm ?? null,
  })).sort((a, b) => b.totalEnviadas - a.totalEnviadas)
}
