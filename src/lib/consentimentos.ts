import 'server-only'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase/admin'

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
  dataLinkEnviado?: string | null
  dataSubmissao?: string | null
  respostas?: RespostasAnamnese
  assinaturaNome?: string
  consentimentoAceite?: boolean
  rgpdAceite?: boolean
  alertas?: string[]
  criadoEm?: string
}

function rowToConsentimento(r: Record<string, any>): Consentimento {
  return {
    id: r.id,
    token: r.token,
    agendamentoId: r.agendamento_id ?? undefined,
    clienteNome: r.cliente_nome ?? '',
    clienteEmail: r.cliente_email ?? '',
    clienteTelefone: r.cliente_telefone ?? undefined,
    servicoNome: r.servico_nome ?? '',
    dataAgendamento: r.data_agendamento ?? '',
    estado: r.estado,
    dataLinkEnviado: r.data_link_enviado ?? null,
    dataSubmissao: r.data_submissao ?? null,
    respostas: r.respostas ?? undefined,
    assinaturaNome: r.assinatura_nome ?? undefined,
    consentimentoAceite: r.consentimento_aceite ?? undefined,
    rgpdAceite: r.rgpd_aceite ?? undefined,
    alertas: r.alertas ?? undefined,
    criadoEm: r.criado_em ?? undefined,
  }
}

// Token criptográfico (192 bits) — protege um formulário com dados de saúde,
// por isso tem de ser imprevisível (o anterior usava Math.random, reconstruível).
function gerarToken(): string {
  return randomBytes(24).toString('base64url')
}

export async function getTodosConsentimentos(): Promise<Consentimento[]> {
  const { data, error } = await supabaseAdmin()
    .from('consentimentos')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error || !data) return []
  return data.map(rowToConsentimento)
}

export async function getConsentimentoPorToken(token: string): Promise<Consentimento | null> {
  const { data, error } = await supabaseAdmin()
    .from('consentimentos')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  if (error || !data) return null
  return rowToConsentimento(data)
}

export async function getConsentimentoPorAgendamento(
  agendamentoId: string
): Promise<Consentimento | null> {
  const { data, error } = await supabaseAdmin()
    .from('consentimentos')
    .select('*')
    .eq('agendamento_id', agendamentoId)
    .maybeSingle()
  if (error || !data) return null
  return rowToConsentimento(data)
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
  const { data, error } = await supabaseAdmin()
    .from('consentimentos')
    .insert({
      token,
      agendamento_id: params.agendamentoId || null,
      cliente_nome: params.clienteNome,
      cliente_email: params.clienteEmail,
      cliente_telefone: params.clienteTelefone || '',
      servico_nome: params.servicoNome,
      data_agendamento: params.dataAgendamento,
      estado: 'pendente',
      data_link_enviado: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'Falha ao criar consentimento')
  return { id: data.id, token }
}

export async function reenviarLinkConsentimento(id: string): Promise<void> {
  await supabaseAdmin()
    .from('consentimentos')
    .update({ data_link_enviado: new Date().toISOString() })
    .eq('id', id)
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
  if (!payload.consentimentoAceite || !payload.rgpdAceite) {
    return { ok: false, error: 'É necessário aceitar os termos.' }
  }

  const sb = supabaseAdmin()
  const { data: cur } = await sb
    .from('consentimentos')
    .select('id, estado')
    .eq('token', token)
    .maybeSingle()
  if (!cur) return { ok: false, error: 'Link inválido ou expirado.' }
  if (cur.estado === 'submetido') {
    return { ok: false, error: 'Este consentimento já foi submetido.' }
  }

  const alertas = computarAlertas(payload.respostas)

  const { error } = await sb
    .from('consentimentos')
    .update({
      estado: 'submetido',
      data_submissao: new Date().toISOString(),
      respostas: payload.respostas,
      assinatura_nome: payload.assinaturaNome,
      consentimento_aceite: true,
      rgpd_aceite: true,
      alertas,
    })
    .eq('id', cur.id)
  if (error) return { ok: false, error: error.message }

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
  const { data, error } = await supabaseAdmin()
    .from('consentimentos')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToConsentimento(data)
}
