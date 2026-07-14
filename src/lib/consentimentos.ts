import 'server-only'
import { randomBytes, createHash } from 'crypto'
import { supabaseAdmin } from './supabase/admin'
import { CONSENTIMENTO_VERSAO } from '@/data/anamneseFiber'

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
  estado: 'pendente' | 'rascunho' | 'submetido'
  dataLinkEnviado?: string | null
  dataSubmissao?: string | null
  respostas?: RespostasAnamnese
  assinaturaNome?: string
  consentimentoAceite?: boolean
  rgpdAceite?: boolean
  alertas?: string[]
  criadoEm?: string
  // Anamnese interativa (FiberBROWS)
  tipoFormulario?: string // 'simples' | 'fiber'
  origem?: string // 'admin' | 'cliente'
  progressoStep?: number
  autorizacaoImagem?: string // 'local' | 'rosto' | 'nao'
  assinaturaImagem?: string // data URL do traço
  documentoVersao?: string
  documentoHash?: string
  atualizadoEm?: string
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
    tipoFormulario: r.tipo_formulario ?? undefined,
    origem: r.origem ?? undefined,
    progressoStep: r.progresso_step ?? undefined,
    autorizacaoImagem: r.autorizacao_imagem ?? undefined,
    assinaturaImagem: r.assinatura_imagem ?? undefined,
    documentoVersao: r.documento_versao ?? undefined,
    documentoHash: r.documento_hash ?? undefined,
    atualizadoEm: r.atualizado_em ?? undefined,
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

// ── Anamnese interativa FiberBROWS ────────────────────────────────────────────

const NAO_RESPOSTAS = new Set(['', 'nao', 'não', 'n', 'nenhum', 'nenhuma', 'nada', '-', 'n/a', 'na'])
function temConteudo(v: unknown): boolean {
  return typeof v === 'string' && !NAO_RESPOSTAS.has(v.trim().toLowerCase())
}
function comoArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : []
}

/**
 * Calcula os alertas clínicos a partir das respostas da anamnese Fiber.
 * Sinaliza à profissional contraindicações e pontos de atenção.
 */
export function computarAlertasFiber(r: Record<string, unknown>): string[] {
  const a: string[] = []
  const saude = comoArray(r.historicoSaude)
  const sobr = comoArray(r.historicoSobrancelha)
  const pele = comoArray(r.saudePele)

  if (saude.includes('gravida')) a.push('Grávida ou a amamentar: procedimento contraindicado')
  if (r.diabetes && r.diabetes !== 'nao') a.push('Diabetes: atenção redobrada à cicatrização')
  if (saude.includes('oncologicos')) a.push('Tratamentos oncológicos: avaliar antes de avançar')
  if (saude.includes('isotretinoina')) a.push('Isotretinoína (Roacutan) nos últimos 6 meses: contraindicação relativa')
  if (saude.includes('cicatrizacao')) a.push('Problema de cicatrização')
  if (saude.includes('reumatologicas')) a.push('Doenças reumatológicas: possível componente autoimune, avaliar')
  if (saude.includes('vih') || saude.includes('hepatite')) a.push('Biossegurança reforçada (VIH/hepatite)')
  if (saude.includes('antibiotico')) a.push('Antibiótico nos últimos 15 dias')
  if (saude.includes('gripe')) a.push('Gripe ou constipação recente: considerar adiar')
  if (temConteudo(r.alergiasProdutos)) a.push(`Alergias a produtos: ${String(r.alergiasProdutos).trim()}`)
  if (temConteudo(r.outrasAlergias)) a.push(`Outras alergias: ${String(r.outrasAlergias).trim()}`)
  if (temConteudo(r.anticoagulantes)) a.push(`Anticoagulantes/corticoides/imunossupressores: ${String(r.anticoagulantes).trim()}`)
  if (sobr.includes('cicatriz')) a.push('Corte, queimadura ou cicatriz na região da sobrancelha')
  if (pele.includes('peeling') || pele.includes('procedimento')) a.push('Peeling ou procedimento no rosto nos últimos 30 dias: aguardar cicatrização')

  return a
}

/** Hash de integridade que liga o conteúdo assinado (versão + respostas + assinatura + hora). */
export function hashDocumento(input: {
  versao: string
  respostas: Record<string, unknown>
  assinaturaNome: string
  autorizacaoImagem: string
  ts: string
}): string {
  const base = JSON.stringify({
    v: input.versao,
    r: input.respostas,
    a: input.assinaturaNome,
    img: input.autorizacaoImagem,
    ts: input.ts,
  })
  return createHash('sha256').update(base).digest('hex')
}

/**
 * Cria ou atualiza um rascunho da anamnese (guardar para continuar mais tarde).
 * Sem token, cria um novo registo e devolve o token. Com token, atualiza (desde
 * que ainda não esteja submetido).
 */
export async function upsertRascunhoFiber(params: {
  token?: string
  nome?: string
  email?: string
  telefone?: string
  respostas: Record<string, unknown>
  progressoStep: number
  origem?: 'cliente' | 'admin'
}): Promise<{ ok: boolean; token?: string; error?: string }> {
  const sb = supabaseAdmin()

  if (params.token) {
    const { data: cur } = await sb
      .from('consentimentos')
      .select('id, estado')
      .eq('token', params.token)
      .maybeSingle()
    if (!cur) return { ok: false, error: 'Formulário não encontrado.' }
    if (cur.estado === 'submetido') return { ok: false, error: 'Este formulário já foi submetido.' }

    const patch: Record<string, unknown> = {
      respostas: params.respostas,
      progresso_step: params.progressoStep,
      estado: 'rascunho',
      tipo_formulario: 'fiber',
      atualizado_em: new Date().toISOString(),
    }
    if (params.nome !== undefined) patch.cliente_nome = params.nome
    if (params.email !== undefined) patch.cliente_email = params.email
    if (params.telefone !== undefined) patch.cliente_telefone = params.telefone

    const { error } = await sb.from('consentimentos').update(patch).eq('id', cur.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true, token: params.token }
  }

  const token = gerarToken()
  const { error } = await sb.from('consentimentos').insert({
    token,
    cliente_nome: params.nome ?? '',
    cliente_email: params.email ?? '',
    cliente_telefone: params.telefone ?? '',
    servico_nome: 'FiberBROWS',
    estado: 'rascunho',
    tipo_formulario: 'fiber',
    origem: params.origem ?? 'cliente',
    respostas: params.respostas,
    progresso_step: params.progressoStep,
    atualizado_em: new Date().toISOString(),
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true, token }
}

/** Submete a anamnese completa com assinatura simples e metadados de prova. */
export async function submeterAnamneseFiber(params: {
  token: string
  respostas: Record<string, unknown>
  assinaturaNome: string
  assinaturaImagem: string
  autorizacaoImagem: string
  consentimentoAceite: boolean
  rgpdAceite: boolean
  ip?: string
  userAgent?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.consentimentoAceite || !params.rgpdAceite) {
    return { ok: false, error: 'É necessário aceitar o consentimento e o tratamento de dados (RGPD).' }
  }
  if (!params.assinaturaNome?.trim()) {
    return { ok: false, error: 'A assinatura (nome completo) é obrigatória.' }
  }

  const sb = supabaseAdmin()
  const { data: cur } = await sb
    .from('consentimentos')
    .select('id, estado')
    .eq('token', params.token)
    .maybeSingle()
  if (!cur) return { ok: false, error: 'Formulário não encontrado.' }
  if (cur.estado === 'submetido') return { ok: false, error: 'Este formulário já foi submetido.' }

  const ts = new Date().toISOString()
  const alertas = computarAlertasFiber(params.respostas)
  const hash = hashDocumento({
    versao: CONSENTIMENTO_VERSAO,
    respostas: params.respostas,
    assinaturaNome: params.assinaturaNome.trim(),
    autorizacaoImagem: params.autorizacaoImagem || '',
    ts,
  })

  const r = params.respostas
  const { error } = await sb
    .from('consentimentos')
    .update({
      cliente_nome: typeof r.nome === 'string' && r.nome ? r.nome : undefined,
      cliente_email: typeof r.email === 'string' && r.email ? r.email : undefined,
      cliente_telefone: typeof r.telefone === 'string' && r.telefone ? r.telefone : undefined,
      estado: 'submetido',
      tipo_formulario: 'fiber',
      data_submissao: ts,
      atualizado_em: ts,
      respostas: params.respostas,
      assinatura_nome: params.assinaturaNome.trim(),
      assinatura_imagem: params.assinaturaImagem || null,
      assinatura_ip: params.ip || null,
      assinatura_user_agent: params.userAgent || null,
      autorizacao_imagem: params.autorizacaoImagem || null,
      consentimento_aceite: true,
      rgpd_aceite: true,
      documento_versao: CONSENTIMENTO_VERSAO,
      documento_hash: hash,
      alertas,
    })
    .eq('id', cur.id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
