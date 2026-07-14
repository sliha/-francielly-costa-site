import 'server-only'
import { supabaseAdmin } from './supabase/admin'
import { rowToAgendamento } from './mappers'
import { janelasDoDia } from './horariosServico'

export type MetodoPagamento = 'stripe' | 'whatsapp' | 'transferencia' | 'dinheiro' | 'mbway' | 'outro'

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
  metodoPagamento?: MetodoPagamento
  notas?: string
  criadoEm?: string // ISO timestamp
  criadoPor: 'ia' | 'admin' | 'cliente'
  stripeSessionId?: string
  googleEventId?: string
  // Última vez que o site escreveu no Google Calendar referente a este doc (ISO).
  // Usado para detetar ecos do nosso próprio write quando o webhook Google nos notifica.
  lastGoogleSyncAt?: string
}

export interface SlotDisponivel {
  hora: string
  disponivel: boolean
}

// Todos os agendamentos de uma data (exceto cancelados)
export async function getAgendamentosPorData(data: string): Promise<Agendamento[]> {
  const { data: rows, error } = await supabaseAdmin()
    .from('agendamentos')
    .select('*')
    .eq('data', data)
    .neq('estado', 'cancelado')
    .order('estado')
    .order('hora_inicio')
  if (error || !rows) return []
  return rows.map(rowToAgendamento)
}

// Converte "HH:MM" em minutos desde 00:00
function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Slots disponíveis para uma data e duração de serviço.
// Se `servicoId` for de um serviço com horário restrito (ver horariosServico.ts),
// só são gerados slots dentro das janelas desse serviço nesse dia da semana.
export async function getSlotsDisponiveis(
  data: string,
  duracaoMinutos: number,
  servicoId?: string
): Promise<SlotDisponivel[]> {
  const agendamentos = await getAgendamentosPorData(data)

  const intervalosOcupados: Array<{ inicio: number; fim: number }> = []
  for (const a of agendamentos) {
    if (!a.horaInicio) continue
    const inicio = hhmmParaMinutos(a.horaInicio)
    const fim = a.horaFim ? hhmmParaMinutos(a.horaFim) : inicio + 90
    const fimSeguro = fim > inicio ? fim : inicio + 90
    intervalosOcupados.push({ inicio, fim: fimSeguro })
  }

  // Dias bloqueados (manuais + google-externo). Pode haver vários docs por data.
  const horasBloqueadasAcumuladas: string[] = []
  const { data: bloqueios } = await supabaseAdmin()
    .from('dias_bloqueados')
    .select('bloqueio_total, horas_bloqueadas')
    .eq('data', data)
  for (const dia of bloqueios ?? []) {
    if (dia.bloqueio_total) return []
    if (Array.isArray(dia.horas_bloqueadas)) horasBloqueadasAcumuladas.push(...dia.horas_bloqueadas)
  }

  for (const hora of horasBloqueadasAcumuladas) {
    if (!/^\d{2}:\d{2}$/.test(hora)) continue
    const inicio = hhmmParaMinutos(hora)
    intervalosOcupados.push({ inicio, fim: inicio + 30 })
  }

  // Janelas de horário a percorrer: gerais (10:00–18:00) ou específicas do serviço.
  const diaSemana = new Date(data + 'T00:00:00').getDay()
  const janelasServico = servicoId ? janelasDoDia(servicoId, diaSemana) : null
  const janelas: Array<{ inicio: number; fim: number }> =
    janelasServico === null
      ? [{ inicio: 10 * 60, fim: 18 * 60 }]
      : janelasServico.map((j) => ({ inicio: hhmmParaMinutos(j.inicio), fim: hhmmParaMinutos(j.fim) }))

  // Slots em intervalos de 30 min, dentro das janelas. A marcação tem de caber
  // inteira na janela (startMin + duração <= fim da janela).
  const slots: SlotDisponivel[] = []
  for (const janela of janelas) {
    for (let startMin = janela.inicio; startMin + duracaoMinutos <= janela.fim; startMin += 30) {
      const endMin = startMin + duracaoMinutos
      const hora = `${Math.floor(startMin / 60).toString().padStart(2, '0')}:${(startMin % 60).toString().padStart(2, '0')}`
      let disponivel = true
      for (const ocup of intervalosOcupados) {
        if (ocup.inicio < endMin && startMin < ocup.fim) {
          disponivel = false
          break
        }
      }
      slots.push({ hora, disponivel })
    }
  }
  return slots
}

// Cria um novo agendamento, devolve o id
export async function criarAgendamento(
  data: Omit<Agendamento, 'id' | 'criadoEm'>
): Promise<string> {
  const row: Record<string, any> = {
    cliente_nome: data.clienteNome,
    cliente_telefone: data.clienteTelefone,
    cliente_email: data.clienteEmail,
    servico_id: data.servicoId,
    servico_nome: data.servicoNome,
    data: data.data,
    hora_inicio: data.horaInicio,
    hora_fim: data.horaFim,
    estado: data.estado,
    caucao_paga: data.caucaoPaga,
    metodo_pagamento: data.metodoPagamento ?? null,
    notas: data.notas ?? null,
    criado_por: data.criadoPor,
    stripe_session_id: data.stripeSessionId ?? null,
    google_event_id: data.googleEventId ?? null,
    last_google_sync_at: data.lastGoogleSyncAt ?? null,
  }
  const { data: inserted, error } = await supabaseAdmin()
    .from('agendamentos')
    .insert(row)
    .select('id')
    .single()
  if (error || !inserted) throw new Error(error?.message || 'Falha ao criar agendamento')
  return inserted.id as string
}

// Um agendamento por id
export async function getAgendamentoPorId(id: string): Promise<Agendamento | null> {
  const { data, error } = await supabaseAdmin()
    .from('agendamentos')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToAgendamento(data)
}

// Atualiza estado (+ campos extra)
export async function atualizarEstadoAgendamento(
  id: string,
  estado: Agendamento['estado'],
  extra?: Partial<Agendamento>
): Promise<void> {
  const row: Record<string, any> = { estado }
  if (extra) {
    const { agendamentoToRow } = await import('./mappers')
    Object.assign(row, agendamentoToRow(extra))
  }
  const { error } = await supabaseAdmin().from('agendamentos').update(row).eq('id', id)
  if (error) throw new Error(error.message)
}

// Todos os agendamentos (admin)
export async function getTodosAgendamentos(): Promise<Agendamento[]> {
  const { data, error } = await supabaseAdmin()
    .from('agendamentos')
    .select('*')
    .order('data', { ascending: false })
    .order('hora_inicio')
  if (error || !data) return []
  return data.map(rowToAgendamento)
}

// Upsert do cliente (chave = email), incrementa total de agendamentos
export async function upsertCliente(params: {
  nome: string
  email: string
  telefone: string
  ultimoServico: string
  ultimoAgendamentoData: string
}): Promise<void> {
  const sb = supabaseAdmin()
  const email = params.email.toLowerCase()
  const { data: existing } = await sb
    .from('clientes')
    .select('total_agendamentos')
    .eq('email', email)
    .maybeSingle()
  const total = (existing?.total_agendamentos ?? 0) + 1
  await sb.from('clientes').upsert(
    {
      email,
      nome: params.nome,
      telefone: params.telefone,
      ultimo_servico: params.ultimoServico,
      ultimo_agendamento: params.ultimoAgendamentoData,
      total_agendamentos: total,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )
}

// Agendamentos por estado
export async function getAgendamentosPorEstado(
  estado: Agendamento['estado']
): Promise<Agendamento[]> {
  const { data, error } = await supabaseAdmin()
    .from('agendamentos')
    .select('*')
    .eq('estado', estado)
    .order('data')
    .order('hora_inicio')
  if (error || !data) return []
  return data.map(rowToAgendamento)
}
