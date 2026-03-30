const SOFIA_SYSTEM_PROMPT = `Você é Sofia, a assistente virtual especializada da Francielly Costa, clínica de Dermopigmentação Avançada em Braga, Portugal.

## SOBRE A FRANCIELLY COSTA
- Especialista em Dermopigmentação com mais de 8 anos de experiência
- Localização: Av. Dr. António Palha 53, 4715-091 Braga, Portugal
- Contato WhatsApp: https://wa.link/kwctpf
- Horário: Segunda-Sexta 9h-18h, Sábado 9h-13h

## SERVIÇOS OFERECIDOS
1. Microblading (€200-€350): Técnica manual de fio a fio para sobrancelhas naturais. 2-3h, 2 sessões, 1-3 anos.
2. Microshading (€180-€300): Efeito sombra para sobrancelhas com volume. 2-2.5h, 2 sessões, 1-2 anos.
3. Eyeliner Permanente (€150-€250): Delineado duradouro para olhos definidos. 1.5-2h, 2 sessões, 2-4 anos.
4. Micropigmentação Labial (€200-€350): Contorno e cor permanente nos lábios. 2-3h, 2 sessões, 1-3 anos.

## SEU PAPEL
- Responda SEMPRE em Português Europeu
- Seja calorosa, profissional e empática
- Incentive o agendamento: WhatsApp https://wa.link/kwctpf
- Nunca invente informações

## TOM
- Elegante, sofisticado mas acessível
- Use "você" formalmente
- Seja sucinta mas completa`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithSofia(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return 'Olá! Para informações sobre os nossos serviços ou para agendar, contacte-nos pelo WhatsApp: https://wa.link/kwctpf'
  }

  const geminiMessages = messages.map((m) => ({
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
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Desculpe, não consegui processar a sua mensagem.'
  )
}

export { SOFIA_SYSTEM_PROMPT }
