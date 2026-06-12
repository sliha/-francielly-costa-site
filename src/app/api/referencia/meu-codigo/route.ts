import { NextRequest, NextResponse } from 'next/server'
import { getResumoReferenciasPorEmail } from '@/lib/referencias'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Anti-enumeração: 8 consultas por IP a cada 15 minutos.
  const rl = rateLimit(`referencia:${getClientIp(req)}`, 8, 15 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 254)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const resumo = await getResumoReferenciasPorEmail(email)
    if (!resumo.existe) {
      // Não confirma se o email existe — mensagem neutra que convida a agendar.
      return NextResponse.json({
        existe: false,
        message:
          'Ainda não encontrámos uma marcação com este email. O seu código pessoal é criado após a primeira marcação.',
      })
    }

    return NextResponse.json({
      existe: true,
      codigo: resumo.codigo,
      nome: resumo.nome,
      totalEnviadas: resumo.totalEnviadas,
      totalConvertidas: resumo.totalConvertidas,
      totalPendentes: resumo.totalPendentes,
    })
  } catch (err) {
    console.error('Erro ao obter código de referência:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
