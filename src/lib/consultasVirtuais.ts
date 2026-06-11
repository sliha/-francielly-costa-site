import 'server-only'
import { supabaseAdmin } from './supabase/admin'

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
  criadoEm?: string
}

function rowToConsulta(r: Record<string, any>): ConsultaVirtual {
  return {
    id: r.id,
    clienteNome: r.cliente_nome ?? '',
    clienteTelefone: r.cliente_telefone ?? '',
    clienteEmail: r.cliente_email ?? '',
    servicoInteresse: r.servico_interesse ?? '',
    data: r.data ?? '',
    hora: r.hora ?? '',
    duvida: r.duvida ?? undefined,
    meetLink: r.meet_link ?? undefined,
    googleEventId: r.google_event_id ?? undefined,
    estado: r.estado,
    criadoEm: r.criado_em ?? undefined,
  }
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
  const { data, error } = await supabaseAdmin()
    .from('consultas_virtuais')
    .insert({
      cliente_nome: params.clienteNome,
      cliente_telefone: params.clienteTelefone,
      cliente_email: params.clienteEmail,
      servico_interesse: params.servicoInteresse,
      data: params.data,
      hora: params.hora,
      duvida: params.duvida || '',
      meet_link: params.meetLink || '',
      google_event_id: params.googleEventId || '',
      estado: 'pendente',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'Falha ao criar consulta virtual')
  return data.id
}

export async function getTodasConsultasVirtuais(): Promise<ConsultaVirtual[]> {
  const { data, error } = await supabaseAdmin()
    .from('consultas_virtuais')
    .select('*')
    .order('data', { ascending: false })
  if (error || !data) return []
  return data.map(rowToConsulta)
}

export async function getConsultaVirtualPorId(id: string): Promise<ConsultaVirtual | null> {
  const { data, error } = await supabaseAdmin()
    .from('consultas_virtuais')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToConsulta(data)
}

export async function atualizarEstadoConsulta(
  id: string,
  estado: ConsultaVirtual['estado']
): Promise<void> {
  await supabaseAdmin().from('consultas_virtuais').update({ estado }).eq('id', id)
}
