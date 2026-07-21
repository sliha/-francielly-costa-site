import { NextRequest, NextResponse } from 'next/server'
import { criarAgendamento, upsertCliente, getSlotsDisponiveis } from '@/lib/booking'
import { sendBookingConfirmation } from '@/lib/email'
import { registrarReferencia, getOuCriarCodigoCliente } from '@/lib/referencias'
import { getServiceById } from '@/data/services'
import { servicoAbreNoDia, horaDentroDaJanela, temHorarioRestrito } from '@/lib/horariosServico'
import { CAUCAO_ATIVA } from '@/lib/caucao'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HORA_REGEX = /^\d{2}:\d{2}$/

function minutosParaHHMM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  // Anti-abuso: máx. 5 marcações por IP a cada 15 minutos.
  const rl = rateLimit(`agendar:${getClientIp(req)}`, 5, 15 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const body = await req.json()

    // Normalizar e limitar tamanhos — nunca confiar no payload do cliente.
    const clienteNome = String(body?.clienteNome ?? '').trim().slice(0, 120)
    const clienteTelefone = String(body?.clienteTelefone ?? '').trim().slice(0, 30)
    const clienteEmail = String(body?.clienteEmail ?? '').trim().toLowerCase().slice(0, 254)
    const servicoId = String(body?.servicoId ?? '').trim().slice(0, 60)
    const data = String(body?.data ?? '').trim()
    const horaInicio = String(body?.horaInicio ?? '').trim()
    const notas = String(body?.notas ?? '').trim().slice(0, 1000)
    const codigoReferencia = String(body?.codigoReferencia ?? '').trim().toUpperCase().slice(0, 20)

    if (!clienteNome || !clienteEmail || !clienteTelefone || !servicoId || !data || !horaInicio) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: nome, email, telefone, serviço, data e hora são necessários' },
        { status: 400 }
      )
    }

    if (!EMAIL_REGEX.test(clienteEmail)) {
      return NextResponse.json({ error: 'Endereço de email inválido' }, { status: 400 })
    }
    if (!DATA_REGEX.test(data) || !HORA_REGEX.test(horaInicio)) {
      return NextResponse.json({ error: 'Data ou hora em formato inválido' }, { status: 400 })
    }

    // O serviço (nome, duração) é resolvido no servidor — o cliente só envia o id.
    const servico = getServiceById(servicoId)
    if (!servico) {
      return NextResponse.json({ error: 'Serviço desconhecido' }, { status: 400 })
    }

    // Data: futura e em dia útil (seg–sex).
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const requestedDate = new Date(data + 'T00:00:00')
    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }
    if (requestedDate <= today) {
      return NextResponse.json(
        { error: 'Não é possível agendar para datas passadas ou hoje' },
        { status: 400 }
      )
    }
    const diaSemana = requestedDate.getDay()
    if (!servicoAbreNoDia(servico.id, diaSemana)) {
      return NextResponse.json(
        {
          error: temHorarioRestrito(servico.id)
            ? 'Este serviço não tem marcações neste dia da semana. Por favor, escolha outro dia.'
            : 'Os agendamentos online são de segunda a sexta-feira',
        },
        { status: 400 }
      )
    }

    // Serviços com horário restrito: a hora tem de cair dentro da janela do dia.
    if (!horaDentroDaJanela(servico.id, diaSemana, horaInicio, servico.duracaoMinutos)) {
      return NextResponse.json(
        { error: 'Esse horário não está disponível para este serviço. Por favor, escolha outro.' },
        { status: 400 }
      )
    }

    // Revalidar disponibilidade no servidor — evita double-booking por race
    // condition e impede POSTs diretos com horas fora da agenda.
    const slots = await getSlotsDisponiveis(data, servico.duracaoMinutos, servico.id)
    const slot = slots.find((s) => s.hora === horaInicio)
    if (!slot || !slot.disponivel) {
      return NextResponse.json(
        { error: 'Esse horário já não está disponível. Por favor, escolha outro.' },
        { status: 409 }
      )
    }

    const [h, m] = horaInicio.split(':').map(Number)
    const horaFim = minutosParaHHMM(h * 60 + m + servico.duracaoMinutos)

    const id = await criarAgendamento({
      clienteNome,
      clienteTelefone,
      clienteEmail,
      servicoId: servico.id,
      servicoNome: servico.name,
      data,
      horaInicio,
      horaFim,
      // Com caução, fica a aguardar pagamento; sem caução, fica pendente de
      // confirmação pela Francielly (não há passo de pagamento).
      estado: CAUCAO_ATIVA ? 'pendente_pagamento' : 'pendente',
      caucaoPaga: false,
      notas,
      criadoPor: 'cliente',
    })

    // Upsert client record — fire and forget
    upsertCliente({
      nome: clienteNome,
      email: clienteEmail,
      telefone: clienteTelefone,
      ultimoServico: servico.name,
      ultimoAgendamentoData: data,
    }).catch((err) => console.error('Erro ao guardar cliente:', err))

    // Send confirmation emails — fire and forget
    sendBookingConfirmation({
      id,
      clienteNome,
      clienteEmail,
      servicoNome: servico.name,
      servicoId: servico.id,
      data,
      horaInicio,
    }).catch((err) => console.error('Erro ao enviar email de confirmação:', err))

    // Gerar código de referência para este cliente — fire and forget
    getOuCriarCodigoCliente(clienteEmail, clienteNome).catch((err) =>
      console.error('Erro ao gerar código de referência:', err)
    )

    // Registrar referência se foi usado um código
    let referenciaErro: string | undefined
    if (codigoReferencia) {
      const result = await registrarReferencia({
        codigoUsado: codigoReferencia,
        novoNome: clienteNome,
        novoEmail: clienteEmail,
        agendamentoId: id,
        servicoNome: servico.name,
      })
      if (!result.ok) referenciaErro = result.error
    }

    return NextResponse.json({ success: true, agendamentoId: id, referenciaErro })
  } catch (err) {
    console.error('Erro ao criar agendamento:', err)
    return NextResponse.json(
      { error: 'Erro ao criar agendamento. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
