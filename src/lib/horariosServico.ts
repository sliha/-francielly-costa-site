/**
 * Horários de marcação específicos por serviço.
 *
 * Alguns serviços não seguem o horário geral do estúdio (segunda a sexta,
 * 10h–18h). Quando um serviço aparece aqui, ESTAS janelas substituem o horário
 * geral, por dia da semana (0=Domingo ... 6=Sábado). Uma janela vazia nesse dia
 * significa que o serviço não abre nesse dia.
 *
 * Módulo isomórfico (sem `server-only`): é usado no cliente (BookingFlow, para
 * o calendário) e no servidor (rotas /api/slots e /api/agendar, para validar).
 *
 * Regra de encaixe: uma hora de início é válida quando a marcação inteira cabe
 * dentro da janela, ou seja, `inicio + duração <= fim da janela` (a mesma lógica
 * do horário geral, que exige acabar até às 18h).
 */

export interface Janela {
  inicio: string // 'HH:MM'
  fim: string // 'HH:MM'
}

// FiberBROWS: agenda restrita.
//   Seg (1), Ter (2), Qua (3): 10:00–12:30
//   Qui (4): 14:00–17:30
//   Sex (5), Sáb (6): 10:00–12:30
//   Dom (0): encerrado
const FIBERBROWS_JANELAS: Record<number, Janela[]> = {
  0: [],
  1: [{ inicio: '10:00', fim: '12:30' }],
  2: [{ inicio: '10:00', fim: '12:30' }],
  3: [{ inicio: '10:00', fim: '12:30' }],
  4: [{ inicio: '14:00', fim: '17:30' }],
  5: [{ inicio: '10:00', fim: '12:30' }],
  6: [{ inicio: '10:00', fim: '12:30' }],
}

const JANELAS_POR_SERVICO: Record<string, Record<number, Janela[]>> = {
  fiberbrows: FIBERBROWS_JANELAS,
}

function hhmmParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** O serviço tem um horário específico (diferente do geral)? */
export function temHorarioRestrito(servicoId: string): boolean {
  return servicoId in JANELAS_POR_SERVICO
}

/**
 * Janelas de horário de um serviço num dia da semana.
 * Devolve `null` quando o serviço segue o horário geral (sem restrição própria).
 * Devolve `[]` quando o serviço tem horário próprio mas não abre nesse dia.
 */
export function janelasDoDia(servicoId: string, diaSemana: number): Janela[] | null {
  const cfg = JANELAS_POR_SERVICO[servicoId]
  if (!cfg) return null
  return cfg[diaSemana] ?? []
}

/** O serviço aceita marcações neste dia da semana? */
export function servicoAbreNoDia(servicoId: string, diaSemana: number): boolean {
  const janelas = janelasDoDia(servicoId, diaSemana)
  if (janelas === null) {
    // Horário geral: segunda a sexta.
    return diaSemana >= 1 && diaSemana <= 5
  }
  return janelas.length > 0
}

/** A hora de início (com a duração) encaixa numa das janelas do serviço nesse dia? */
export function horaDentroDaJanela(
  servicoId: string,
  diaSemana: number,
  horaInicio: string,
  duracaoMin: number,
): boolean {
  const janelas = janelasDoDia(servicoId, diaSemana)
  if (janelas === null) return true // sem restrição específica: o horário geral trata disto
  const inicio = hhmmParaMinutos(horaInicio)
  const fim = inicio + duracaoMin
  return janelas.some((j) => inicio >= hhmmParaMinutos(j.inicio) && fim <= hhmmParaMinutos(j.fim))
}

/** Descrição curta do horário do serviço, para mostrar ao cliente. */
export function descricaoHorario(servicoId: string): string {
  if (servicoId === 'fiberbrows') {
    return 'Seg a Qua, Sex e Sáb: 10h–12h30 · Qui: 14h–17h30'
  }
  return 'Segunda a Sexta, 10h às 18h'
}
