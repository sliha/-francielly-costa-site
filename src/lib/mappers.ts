// Mapeamento entre linhas Postgres (snake_case) e os tipos da app (camelCase).
// Funções puras — seguras para usar tanto no servidor como no cliente.
import type { Agendamento } from './booking'

export function rowToAgendamento(r: Record<string, any>): Agendamento {
  return {
    id: r.id,
    clienteNome: r.cliente_nome ?? '',
    clienteTelefone: r.cliente_telefone ?? '',
    clienteEmail: r.cliente_email ?? '',
    servicoId: r.servico_id ?? '',
    servicoNome: r.servico_nome ?? '',
    data: r.data ?? '',
    horaInicio: r.hora_inicio ?? '',
    horaFim: r.hora_fim ?? '',
    estado: r.estado,
    caucaoPaga: r.caucao_paga ?? false,
    metodoPagamento: r.metodo_pagamento ?? undefined,
    notas: r.notas ?? undefined,
    criadoPor: r.criado_por,
    stripeSessionId: r.stripe_session_id ?? undefined,
    googleEventId: r.google_event_id ?? undefined,
    criadoEm: r.criado_em ?? undefined,
    lastGoogleSyncAt: r.last_google_sync_at ?? undefined,
  }
}

// Converte campos parciais de Agendamento (camelCase) para colunas snake_case.
export function agendamentoToRow(a: Partial<Agendamento>): Record<string, any> {
  const row: Record<string, any> = {}
  if (a.clienteNome !== undefined) row.cliente_nome = a.clienteNome
  if (a.clienteTelefone !== undefined) row.cliente_telefone = a.clienteTelefone
  if (a.clienteEmail !== undefined) row.cliente_email = a.clienteEmail
  if (a.servicoId !== undefined) row.servico_id = a.servicoId
  if (a.servicoNome !== undefined) row.servico_nome = a.servicoNome
  if (a.data !== undefined) row.data = a.data
  if (a.horaInicio !== undefined) row.hora_inicio = a.horaInicio
  if (a.horaFim !== undefined) row.hora_fim = a.horaFim
  if (a.estado !== undefined) row.estado = a.estado
  if (a.caucaoPaga !== undefined) row.caucao_paga = a.caucaoPaga
  if (a.metodoPagamento !== undefined) row.metodo_pagamento = a.metodoPagamento
  if (a.notas !== undefined) row.notas = a.notas
  if (a.criadoPor !== undefined) row.criado_por = a.criadoPor
  if (a.stripeSessionId !== undefined) row.stripe_session_id = a.stripeSessionId
  if (a.googleEventId !== undefined) row.google_event_id = a.googleEventId
  if (a.lastGoogleSyncAt !== undefined) row.last_google_sync_at = a.lastGoogleSyncAt
  return row
}
