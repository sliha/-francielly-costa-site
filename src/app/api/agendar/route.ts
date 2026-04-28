import { NextRequest, NextResponse } from 'next/server'
import { criarAgendamento, upsertCliente } from '@/lib/booking'
import { sendBookingConfirmation } from '@/lib/email'
import { registrarReferencia, getOuCriarCodigoCliente } from '@/lib/referencias'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clienteNome,
      clienteTelefone,
      clienteEmail,
      servicoId,
      servicoNome,
      data,
      horaInicio,
      horaFim,
      notas,
      codigoReferencia,
    } = body

    // Validate required fields
    if (!clienteNome || !clienteEmail || !servicoId || !data || !horaInicio) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta: nome, email, serviço, data e hora são necessários' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clienteEmail)) {
      return NextResponse.json({ error: 'Endereço de email inválido' }, { status: 400 })
    }

    // Validate date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const requestedDate = new Date(data + 'T00:00:00')
    if (requestedDate <= today) {
      return NextResponse.json(
        { error: 'Não é possível agendar para datas passadas ou hoje' },
        { status: 400 }
      )
    }

    const id = await criarAgendamento({
      clienteNome,
      clienteTelefone: clienteTelefone || '',
      clienteEmail,
      servicoId,
      servicoNome: servicoNome || '',
      data,
      horaInicio,
      horaFim: horaFim || '',
      estado: 'pendente_pagamento',
      caucaoPaga: false,
      notas: notas || '',
      criadoPor: 'cliente',
    })

    // Upsert client record — fire and forget
    upsertCliente({
      nome: clienteNome,
      email: clienteEmail,
      telefone: clienteTelefone || '',
      ultimoServico: servicoNome || '',
      ultimoAgendamentoData: data,
    }).catch((err) => console.error('Erro ao guardar cliente:', err))

    // Send confirmation emails — fire and forget
    sendBookingConfirmation({
      id,
      clienteNome,
      clienteEmail,
      servicoNome: servicoNome || '',
      data,
      horaInicio,
    }).catch((err) => console.error('Erro ao enviar email de confirmação:', err))

    // Gerar código de referência para este cliente — fire and forget
    getOuCriarCodigoCliente(clienteEmail, clienteNome).catch((err) =>
      console.error('Erro ao gerar código de referência:', err)
    )

    // Registrar referência se foi usado um código
    let referenciaErro: string | undefined
    if (codigoReferencia && typeof codigoReferencia === 'string' && codigoReferencia.trim()) {
      const result = await registrarReferencia({
        codigoUsado: codigoReferencia.trim().toUpperCase(),
        novoNome: clienteNome,
        novoEmail: clienteEmail,
        agendamentoId: id,
        servicoNome: servicoNome || '',
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
