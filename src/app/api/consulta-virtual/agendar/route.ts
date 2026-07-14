import { NextRequest, NextResponse } from 'next/server'
import { criarConsultaVirtual } from '@/lib/consultasVirtuais'
import { createConsultaVirtualEvent } from '@/lib/googleCalendar'
import { escapeHtml } from '@/lib/sanitize'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'

export const runtime = 'nodejs'

interface Payload {
  nome: string
  telefone: string
  email: string
  servico: string
  data: string
  hora: string
  duvida?: string
}

async function enviarEmails(params: {
  cliente: { nome: string; email: string }
  servico: string
  data: string
  hora: string
  meetLink: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const adminEmail = process.env.ADMIN_EMAIL || 'geral@franciellycosta.pt'

  const dataFmt = new Date(params.data + 'T12:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const htmlCliente = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDF8F5; padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #B76E79; font-size: 28px; margin: 0;">Francielly Costa</h1>
        <p style="color: #C9A96E; margin: 4px 0 0; font-size: 14px;">Consulta Virtual</p>
      </div>
      <h2 style="color: #333; font-size: 20px;">Olá ${escapeHtml(params.cliente.nome)}!</h2>
      <p style="color: #555; line-height: 1.6;">
        A sua consulta virtual foi agendada com sucesso. Em baixo o link para a videochamada.
      </p>
      <div style="background: white; border-left: 4px solid #B76E79; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${escapeHtml(params.servico)}</p>
        <p style="margin: 0 0 8px;"><strong>Data:</strong> ${dataFmt}</p>
        <p style="margin: 0;"><strong>Hora:</strong> ${escapeHtml(params.hora)} (15 min)</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${params.meetLink}" style="display: inline-block; background: #B76E79; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Entrar na Videochamada
        </a>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        Tem dúvidas? Contacte-nos: geral@franciellycosta.pt · +351 913 112 232
      </p>
    </div>
  `

  const htmlAdmin = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A1A; color: white; padding: 40px; border-radius: 12px;">
      <h2 style="color: #B76E79;">Nova Consulta Virtual</h2>
      <div style="background: #2A2A2A; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong style="color: #C9A96E;">Cliente:</strong> ${escapeHtml(params.cliente.nome)}</p>
        <p><strong style="color: #C9A96E;">Email:</strong> ${escapeHtml(params.cliente.email)}</p>
        <p><strong style="color: #C9A96E;">Serviço:</strong> ${escapeHtml(params.servico)}</p>
        <p><strong style="color: #C9A96E;">Data:</strong> ${dataFmt}</p>
        <p><strong style="color: #C9A96E;">Hora:</strong> ${escapeHtml(params.hora)}</p>
      </div>
      <p><a href="${params.meetLink}" style="color: #C9A96E;">Link Google Meet</a></p>
    </div>
  `

  const send = (to: string, subject: string, html: string) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Francielly Costa <noreply@franciellycosta.pt>',
      to,
      subject,
      html,
    }),
  })

  await Promise.allSettled([
    send(params.cliente.email, `Consulta virtual — ${params.servico}`, htmlCliente),
    send(adminEmail, `Nova consulta virtual — ${params.cliente.nome}`, htmlAdmin),
  ])
}

export async function POST(req: NextRequest) {
  // Anti-spam: cria eventos reais no Google Calendar — máx. 3 por IP / 15 min.
  const rl = rateLimit(`consulta-virtual:${getClientIp(req)}`, 3, 15 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const raw = (await req.json()) as Payload
    const body: Payload = {
      nome: String(raw?.nome ?? '').trim().slice(0, 120),
      telefone: String(raw?.telefone ?? '').trim().slice(0, 30),
      email: String(raw?.email ?? '').trim().toLowerCase().slice(0, 254),
      servico: String(raw?.servico ?? '').trim().slice(0, 80),
      data: String(raw?.data ?? '').trim(),
      hora: String(raw?.hora ?? '').trim(),
      duvida: raw?.duvida ? String(raw.duvida).trim().slice(0, 1000) : undefined,
    }

    if (!body.nome || !body.telefone || !body.email || !body.servico || !body.data || !body.hora) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.data) || !/^\d{2}:\d{2}$/.test(body.hora)) {
      return NextResponse.json({ error: 'Data ou hora inválida' }, { status: 400 })
    }
    const dataConsulta = new Date(body.data + 'T00:00:00')
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    if (Number.isNaN(dataConsulta.getTime()) || dataConsulta < hoje) {
      return NextResponse.json({ error: 'A data tem de ser hoje ou futura' }, { status: 400 })
    }

    // Tenta criar evento Google Calendar com Meet
    const cal = await createConsultaVirtualEvent({
      clienteNome: body.nome,
      clienteEmail: body.email,
      servicoInteresse: body.servico,
      data: body.data,
      hora: body.hora,
      duvida: body.duvida,
    })

    let meetLink: string
    let googleEventId: string | undefined
    let warning: string | undefined

    if (cal.ok) {
      meetLink = cal.meetLink
      googleEventId = cal.eventId
    } else {
      meetLink = cal.fallbackMeetLink
      warning = `Calendar não criou Meet automático (${cal.error}). Use link manual.`
      console.warn('Consulta virtual fallback:', cal.error)
    }

    const id = await criarConsultaVirtual({
      clienteNome: body.nome,
      clienteTelefone: body.telefone,
      clienteEmail: body.email,
      servicoInteresse: body.servico,
      data: body.data,
      hora: body.hora,
      duvida: body.duvida,
      meetLink,
      googleEventId,
    })

    try {
      await enviarEmails({
        cliente: { nome: body.nome, email: body.email },
        servico: body.servico,
        data: body.data,
        hora: body.hora,
        meetLink,
      })
    } catch (emailErr) {
      console.error('Erro envio email consulta virtual:', emailErr)
    }

    return NextResponse.json({ ok: true, id, meetLink, warning })
  } catch (err) {
    console.error('Erro criar consulta virtual:', err)
    return NextResponse.json({ error: 'Erro ao agendar a consulta. Tente novamente.' }, { status: 500 })
  }
}
