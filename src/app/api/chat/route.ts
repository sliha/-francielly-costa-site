import { NextRequest, NextResponse } from 'next/server'

const SOFIA_SYSTEM_PROMPT = `Você é Sofia, a assistente virtual especializada da Francielly Costa, clínica de Dermopigmentação Avançada em Braga, Portugal.

## SOBRE A FRANCIELLY COSTA
- Especialista em Dermopigmentação com mais de 8 anos de experiência
- Localização: Av. Dr. António Palha 53, 4715-091 Braga, Portugal
- Contato WhatsApp: https://wa.link/kwctpf
- Horário: Segunda-Sexta 9h-18h, Sábado 9h-13h

## SERVIÇOS OFERECIDOS
1. **Microblading** (€200-€350): Técnica manual de fio a fio para sobrancelhas naturais. Duração: 2-3h, 2 sessões, resultados 1-3 anos.
2. **Microshading** (€180-€300): Efeito sombra para sobrancelhas com volume. Duração: 2-2.5h, 2 sessões, resultados 1-2 anos.
3. **Eyeliner Permanente** (€150-€250): Delineado duradouro para olhos definidos. Duração: 1.5-2h, 2 sessões, resultados 2-4 anos.
4. **Micropigmentação Labial** (€200-€350): Contorno e cor permanente nos lábios. Duração: 2-3h, 2 sessões, resultados 1-3 anos.

## INFORMAÇÕES IMPORTANTES
- Todos os procedimentos incluem anestesia tópica
- Retoque obrigatório entre 4-8 semanas após a sessão inicial
- Contraindicações: gravidez, amamentação, isotretinoína, hemofilia, diabetes descontrolada, epilepsia, quimioterapia
- Recuperação: 7-14 dias com cuidados específicos

## SEU PAPEL
- Responda SEMPRE em Português Europeu (de Portugal)
- Seja calorosa, profissional e empática
- Forneça informações precisas sobre os serviços
- Incentive o agendamento quando apropriado
- Para marcar consulta: dirija para o WhatsApp (https://wa.link/kwctpf) ou página de contacto
- Nunca invente preços ou informações não mencionadas
- Se não souber algo, oriente para entrar em contacto diretamente

## TOM DE VOZ
- Elegant, sofisticado mas acessível
- Use "você" formalmente
- Seja sucinta mas completa
- Transmita confiança e profissionalismo
- Finalize com perguntas abertas para manter o diálogo

## IDIOMA
Deteta automaticamente o idioma da mensagem da cliente e responde SEMPRE nesse mesmo idioma. Mantém o mesmo nível de profissionalismo independentemente do idioma.`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensagens inválidas' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      // Fallback response when no API key
      return NextResponse.json({
        response:
          'Olá! Estou aqui para ajudá-la com informações sobre os nossos tratamentos. Para mais detalhes ou para agendar uma consulta, por favor contacte-nos pelo WhatsApp: https://wa.link/kwctpf ou ligue-nos. Teremos todo o gosto em atendê-la! ✨',
      })
    }

    // Build Gemini API request
    const geminiMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SOFIA_SYSTEM_PROMPT }],
          },
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Desculpe, não consegui processar a sua mensagem. Por favor, tente novamente ou contacte-nos pelo WhatsApp.'

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        response:
          'Desculpe, ocorreu um erro técnico. Por favor, contacte-nos diretamente pelo WhatsApp: https://wa.link/kwctpf',
      },
      { status: 200 }
    )
  }
}
