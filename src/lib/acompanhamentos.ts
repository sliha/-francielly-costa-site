import 'server-only'
import { randomInt } from 'crypto'
import { supabaseAdmin } from './supabase/admin'

/** Bucket privado onde ficam as fotos de acompanhamento (dados de saúde). */
export const ACOMP_BUCKET = 'acompanhamentos'

/**
 * Código de acesso seguro: 12 caracteres de um alfabeto sem ambíguos (A-Z, 2-9
 * exceto I/O/0/1), gerado com CSPRNG (~61 bits de entropia). Substitui os
 * antigos 6 dígitos de Math.random, que eram enumeráveis (900 mil combinações).
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function gerarCodigoAcesso(): string {
  let out = ''
  for (let i = 0; i < 12; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return out
}

export interface Acompanhamento {
  id?: string
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataProcedimento: string // 'YYYY-MM-DD'
  codigoAcesso: string // 6 dígitos
  retoqueData?: string // 'YYYY-MM-DD'
  retoqueConfirmado?: boolean
  ultimaAtividadeCliente?: string | null
  ultimaAtividadeAdmin?: string | null
  fechado?: boolean
  criadoEm?: string
}

export interface Mensagem {
  id?: string | number
  de: 'admin' | 'cliente'
  texto: string
  criadoEm?: string
}

export interface Foto {
  id?: string | number
  diaIdx?: number
  url: string
  storagePath: string
  criadoEm?: string
}

export function rowToAcompanhamento(r: Record<string, any>): Acompanhamento {
  return {
    id: r.id,
    agendamentoId: r.agendamento_id ?? undefined,
    clienteNome: r.cliente_nome ?? '',
    clienteEmail: r.cliente_email ?? '',
    clienteTelefone: r.cliente_telefone ?? undefined,
    servicoNome: r.servico_nome ?? '',
    dataProcedimento: r.data_procedimento ?? '',
    codigoAcesso: r.codigo_acesso ?? '',
    retoqueData: r.retoque_data ?? undefined,
    retoqueConfirmado: r.retoque_confirmado ?? undefined,
    ultimaAtividadeCliente: r.ultima_atividade_cliente ?? null,
    ultimaAtividadeAdmin: r.ultima_atividade_admin ?? null,
    fechado: r.fechado ?? false,
    criadoEm: r.criado_em ?? undefined,
  }
}

export const rowToMensagem = (r: Record<string, any>): Mensagem => ({
  id: r.id,
  de: r.de,
  texto: r.texto ?? '',
  criadoEm: r.criado_em ?? undefined,
})

export const rowToFoto = (r: Record<string, any>): Foto => ({
  id: r.id,
  diaIdx: r.dia_idx ?? undefined,
  url: r.url ?? '',
  storagePath: r.storage_path ?? '',
  criadoEm: r.criado_em ?? undefined,
})

export function calcularRetoqueData(dataProcedimento: string): string {
  const d = new Date(dataProcedimento + 'T12:00:00')
  d.setDate(d.getDate() + 30)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function getTodosAcompanhamentos(): Promise<Acompanhamento[]> {
  const { data, error } = await supabaseAdmin()
    .from('acompanhamentos')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error || !data) return []
  return data.map(rowToAcompanhamento)
}

export async function getAcompanhamentoPorCodigo(codigo: string): Promise<Acompanhamento | null> {
  const { data } = await supabaseAdmin()
    .from('acompanhamentos')
    .select('*')
    .eq('codigo_acesso', codigo)
    .maybeSingle()
  return data ? rowToAcompanhamento(data) : null
}

export async function getAcompanhamentoPorAgendamento(agendamentoId: string): Promise<Acompanhamento | null> {
  const { data } = await supabaseAdmin()
    .from('acompanhamentos')
    .select('*')
    .eq('agendamento_id', agendamentoId)
    .maybeSingle()
  return data ? rowToAcompanhamento(data) : null
}

export async function getAcompanhamentoPorId(id: string): Promise<Acompanhamento | null> {
  const { data } = await supabaseAdmin()
    .from('acompanhamentos')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data ? rowToAcompanhamento(data) : null
}

export async function criarAcompanhamento(params: {
  agendamentoId?: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string
  servicoNome: string
  dataProcedimento: string
}): Promise<{ id: string; codigoAcesso: string }> {
  if (params.agendamentoId) {
    const existente = await getAcompanhamentoPorAgendamento(params.agendamentoId)
    if (existente && existente.id) {
      return { id: existente.id, codigoAcesso: existente.codigoAcesso }
    }
  }

  const codigoAcesso = gerarCodigoAcesso()
  const retoqueData = calcularRetoqueData(params.dataProcedimento)

  const { data, error } = await supabaseAdmin()
    .from('acompanhamentos')
    .insert({
      agendamento_id: params.agendamentoId || null,
      cliente_nome: params.clienteNome,
      cliente_email: params.clienteEmail,
      cliente_telefone: params.clienteTelefone || '',
      servico_nome: params.servicoNome,
      data_procedimento: params.dataProcedimento,
      codigo_acesso: codigoAcesso,
      retoque_data: retoqueData,
      retoque_confirmado: false,
      fechado: false,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'Falha ao criar acompanhamento')

  return { id: data.id, codigoAcesso }
}

export async function confirmarRetoque(id: string, confirmado: boolean): Promise<void> {
  await supabaseAdmin().from('acompanhamentos').update({ retoque_confirmado: confirmado }).eq('id', id)
}

export async function fecharAcompanhamento(id: string): Promise<void> {
  await supabaseAdmin().from('acompanhamentos').update({ fechado: true }).eq('id', id)
}

export async function adicionarMensagem(
  acompanhamentoId: string,
  de: 'admin' | 'cliente',
  texto: string
): Promise<void> {
  const t = texto.trim()
  if (!t) return
  const sb = supabaseAdmin()
  await sb.from('acompanhamento_mensagens').insert({ acompanhamento_id: acompanhamentoId, de, texto: t })
  await sb
    .from('acompanhamentos')
    .update(de === 'admin' ? { ultima_atividade_admin: new Date().toISOString() } : { ultima_atividade_cliente: new Date().toISOString() })
    .eq('id', acompanhamentoId)
}

export async function getMensagens(acompanhamentoId: string): Promise<Mensagem[]> {
  const { data } = await supabaseAdmin()
    .from('acompanhamento_mensagens')
    .select('*')
    .eq('acompanhamento_id', acompanhamentoId)
    .order('criado_em', { ascending: true })
  return (data ?? []).map(rowToMensagem)
}

export async function getFotos(acompanhamentoId: string): Promise<Foto[]> {
  const { data } = await supabaseAdmin()
    .from('acompanhamento_fotos')
    .select('*')
    .eq('acompanhamento_id', acompanhamentoId)
    .order('criado_em', { ascending: true })
  return (data ?? []).map(rowToFoto)
}

export async function addFoto(
  acompanhamentoId: string,
  foto: { url: string; storagePath: string; diaIdx?: number }
): Promise<void> {
  await supabaseAdmin().from('acompanhamento_fotos').insert({
    acompanhamento_id: acompanhamentoId,
    dia_idx: foto.diaIdx ?? null,
    url: foto.url,
    storage_path: foto.storagePath,
  })
}

/**
 * Resolve URLs de visualização das fotos:
 * - fotos novas (url vazio) vivem no bucket PRIVADO → signed URL com expiração;
 * - fotos antigas mantêm o URL público guardado (bucket 'media', legado).
 */
export async function resolverFotosUrls(fotos: Foto[]): Promise<Foto[]> {
  const sb = supabaseAdmin()
  return Promise.all(
    fotos.map(async (f) => {
      if (f.url) return f
      if (!f.storagePath) return f
      const { data } = await sb.storage
        .from(ACOMP_BUCKET)
        .createSignedUrl(f.storagePath, 60 * 60) // 1 hora
      return { ...f, url: data?.signedUrl || '' }
    })
  )
}
