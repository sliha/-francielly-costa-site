import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imagemBase64, servico } = await req.json()

    if (!imagemBase64 || !servico) {
      return NextResponse.json({ error: 'Parâmetros em falta' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Serviço não configurado' }, { status: 500 })
    }

    const prompt = `Analisa esta foto de rosto de forma gentil e profissional. Descreve como ficaria o resultado de ${servico} nesta pessoa, considerando o formato do rosto, tom de pele, traços e proporções faciais. Dá uma descrição detalhada, personalizada e encorajadora do resultado esperado. Foca nos aspectos positivos que o procedimento iria realçar. Responde em português europeu, num tom caloroso e profissional. Máximo 3 parágrafos curtos.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imagemBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 400,
          },
        }),
      }
    )

    const data = await response.json()
    const analise = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!analise) {
      return NextResponse.json({ error: 'Não foi possível gerar análise' }, { status: 500 })
    }

    return NextResponse.json({ analise })
  } catch (error) {
    console.error('Erro no simulador:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
