import 'server-only'
import { supabaseAdmin } from './supabase/admin'

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
  criadoEm?: string
  convertidaEm?: string | null
}

function rowToReferencia(r: Record<string, any>): Referencia {
  return {
    id: r.id,
    codigoUsado: r.codigo_usado ?? '',
    refenteEmail: r.refente_email ?? '',
    refenteNome: r.refente_nome ?? '',
    novoNome: r.novo_nome ?? '',
    novoEmail: r.novo_email ?? '',
    agendamentoId: r.agendamento_id ?? '',
    servicoNome: r.servico_nome ?? '',
    estado: r.estado,
    criadoEm: r.criado_em ?? undefined,
    convertidaEm: r.convertida_em ?? null,
  }
}

// Gera código determinístico baseado no nome + 4 chars do hash do email
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

// Garante que o cliente tem código (cria se não tiver). Retorna o código.
export async function getOuCriarCodigoCliente(email: string, nome: string): Promise<string> {
  const sb = supabaseAdmin()
  const lower = email.toLowerCase()
  const { data: existing } = await sb
    .from('clientes')
    .select('codigo_referencia')
    .eq('email', lower)
    .maybeSingle()

  if (existing?.codigo_referencia) return existing.codigo_referencia

  const codigo = gerarCodigo(nome, email)
  await sb.from('clientes').upsert(
    {
      email: lower,
      nome,
      codigo_referencia: codigo,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )
  return codigo
}

export async function getClientePorCodigoReferencia(codigo: string): Promise<{
  email: string
  nome: string
} | null> {
  const { data } = await supabaseAdmin()
    .from('clientes')
    .select('email, nome')
    .eq('codigo_referencia', codigo)
    .maybeSingle()
  if (!data) return null
  return { email: String(data.email || ''), nome: String(data.nome || '') }
}

// Resumo do programa de referências para um cliente (pela página pública).
// Só devolve código se o email já pertence a um cliente (que já agendou).
export async function getResumoReferenciasPorEmail(email: string): Promise<{
  existe: boolean
  codigo?: string
  nome?: string
  totalEnviadas: number
  totalConvertidas: number
  totalPendentes: number
}> {
  const sb = supabaseAdmin()
  const lower = email.toLowerCase()

  const { data: cliente } = await sb
    .from('clientes')
    .select('codigo_referencia, nome')
    .eq('email', lower)
    .maybeSingle()

  if (!cliente) {
    return { existe: false, totalEnviadas: 0, totalConvertidas: 0, totalPendentes: 0 }
  }

  // Garante código mesmo que o registo seja antigo e ainda não o tenha.
  const codigo =
    cliente.codigo_referencia ||
    (await getOuCriarCodigoCliente(lower, String(cliente.nome || '')))

  const { data: refs } = await sb
    .from('referencias')
    .select('estado')
    .eq('refente_email', lower)

  const lista = refs ?? []
  return {
    existe: true,
    codigo,
    nome: String(cliente.nome || ''),
    totalEnviadas: lista.length,
    totalConvertidas: lista.filter((r) => r.estado === 'convertida').length,
    totalPendentes: lista.filter((r) => r.estado === 'pendente').length,
  }
}

export async function registrarReferencia(params: {
  codigoUsado: string
  novoNome: string
  novoEmail: string
  agendamentoId: string
  servicoNome: string
}): Promise<{ ok: boolean; error?: string }> {
  const refente = await getClientePorCodigoReferencia(params.codigoUsado.toUpperCase())
  if (!refente) return { ok: false, error: 'Código de referência inválido' }

  if (refente.email.toLowerCase() === params.novoEmail.toLowerCase()) {
    return { ok: false, error: 'Não pode usar o seu próprio código' }
  }

  const { error } = await supabaseAdmin().from('referencias').insert({
    codigo_usado: params.codigoUsado.toUpperCase(),
    refente_email: refente.email,
    refente_nome: refente.nome,
    novo_nome: params.novoNome,
    novo_email: params.novoEmail.toLowerCase(),
    agendamento_id: params.agendamentoId,
    servico_nome: params.servicoNome,
    estado: 'pendente',
    convertida_em: null,
  })
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

export async function marcarReferenciaConvertida(agendamentoId: string): Promise<void> {
  try {
    await supabaseAdmin()
      .from('referencias')
      .update({ estado: 'convertida', convertida_em: new Date().toISOString() })
      .eq('agendamento_id', agendamentoId)
      .eq('estado', 'pendente')
  } catch (err) {
    console.error('Erro ao marcar referência convertida:', err)
  }
}

export async function getTodasReferencias(): Promise<Referencia[]> {
  const { data, error } = await supabaseAdmin()
    .from('referencias')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error || !data) return []
  return data.map(rowToReferencia)
}

// Agrupa referências por cliente refente para o admin
export async function getReferenciasAgrupadas(): Promise<{
  refenteEmail: string
  refenteNome: string
  codigoReferencia: string
  totalEnviadas: number
  totalConvertidas: number
  ultimaActividade?: string | null
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
