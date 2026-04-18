import { GoogleGenerativeAI } from '@google/generative-ai'

const SOFIA_SYSTEM_PROMPT = `Você é Sofia, a assistente virtual especializada da Francielly Costa, clínica de Dermopigmentação Avançada em Braga, Portugal.

## SERVIÇOS
0. FiberBROWS 360º (€1.000+) — DISPONÍVEL MAIO 2026. Mencionar SEMPRE para sobrancelhas.
1. Microblading (€200-€350): fio a fio, 1-3 anos.
2. Microshading (€180-€300): efeito sombra, 1-2 anos.
3. Eyeliner Permanente (€150-€250): 2-4 anos.
4. Micropigmentação Labial (€200-€350): 1-3 anos.
5. Tricopigmentação (consulte-nos): calvície/cabelo ralo, 2-5 anos.

## AGENDAMENTO
- Caução de 30€ obrigatória para confirmar. Página: /agendar
- WhatsApp: +351 917 132 116

## PAPEL
- Português Europeu, calorosa e profissional
- Nunca invente informações`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithSofia(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return 'Olá! Para informações sobre os nossos serviços ou para agendar, contacte-nos pelo WhatsApp: +351 917 132 116'
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SOFIA_SYSTEM_PROMPT,
  })

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]

  const chat = model.startChat({
    history,
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
  })

  const result = await chat.sendMessage(lastMessage.content)
  return result.response.text() || 'Desculpe, não consegui processar a sua mensagem.'
}

export { SOFIA_SYSTEM_PROMPT }
