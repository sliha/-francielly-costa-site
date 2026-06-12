import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit'
import { SERVICES } from '@/data/services'

// ~6 MB de base64 ≈ imagem de 4,5 MB — suficiente para uma selfie comprimida.
const MAX_IMAGE_BASE64_CHARS = 6 * 1024 * 1024

export async function POST(req: NextRequest) {
  // Máx. 5 análises por IP a cada 10 minutos — cada chamada custa tokens de visão.
  const rl = rateLimit(`simulador:${getClientIp(req)}`, 5, 10 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const { imagemBase64, servico } = await req.json()

    if (!imagemBase64 || !servico || typeof imagemBase64 !== 'string') {
      return NextResponse.json({ error: 'Parâmetros em falta' }, { status: 400 })
    }

    if (imagemBase64.length > MAX_IMAGE_BASE64_CHARS) {
      return NextResponse.json(
        { error: 'Imagem demasiado grande. Use uma foto até 4 MB.' },
        { status: 413 }
      )
    }

    // O nome do serviço entra no prompt — usar apenas nomes conhecidos.
    const servicoNome =
      SERVICES.find((s) => s.name === servico || s.id === servico)?.name || 'dermopigmentação'

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Serviço não configurado' }, { status: 500 })
    }

    const prompt = `Analisa esta foto de rosto de forma gentil e profissional. Descreve como ficaria o resultado de ${servicoNome} nesta pessoa, considerando o formato do rosto, tom de pele, traços e proporções faciais. Dá uma descrição detalhada, personalizada e encorajadora do resultado esperado. Foca nos aspectos positivos que o procedimento iria realçar. Responde em português europeu, num tom caloroso e profissional. Máximo 3 parágrafos curtos.`

    const anthropic = new Anthropic({ apiKey })

    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imagemBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const textBlock = resp.content.find((b) => b.type === 'text')
    const analise = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    if (!analise) {
      return NextResponse.json({ error: 'Não foi possível gerar análise' }, { status: 500 })
    }

    return NextResponse.json({ analise })
  } catch (error) {
    console.error('Erro no simulador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
