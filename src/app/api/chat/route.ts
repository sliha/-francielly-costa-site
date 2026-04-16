import { NextRequest, NextResponse } from 'next/server'

const SOFIA_SYSTEM_PROMPT = `Você é Sofia, a assistente virtual especializada da Francielly Costa, clínica de Dermopigmentação Avançada em Braga, Portugal.

## SOBRE A FRANCIELLY COSTA
- Especialista em Dermopigmentação com mais de 8 anos de experiência
- Localização: Av. Dr. António Palha 53, 4715-091 Braga, Portugal
- Contato WhatsApp: https://wa.link/kwctpf
- Horário: Segunda-Sexta 9h-18h, Sábado 9h-13h

## SERVIÇOS OFERECIDOS
0. **FiberBROWS 360º** (A partir de €1.000) — SERVIÇO CARRO-CHEFE E GRANDE NOVIDADE: Técnica de embelezamento facial NÃO cirúrgica e NÃO médica. Consiste na aplicação de um adorno estético de microfibras sintéticas (não absorvíveis, atóxicas, estéreis, de uso individual) nas sobrancelhas, com nanoagulha de calibre extremamente fino. Profundidade máxima 2mm. Resultado dura até 6 meses com manutenção simples. Não é micropigmentação, não é cirurgia, não tem finalidade terapêutica. Dor muito inferior à micropigmentação. A Francielly é uma das primeiras profissionais certificadas em Portugal. DISPONÍVEL A PARTIR DE MAIO 2026. Para já, recolher nome, email e telefone de interessadas e informar que serão contactadas. Quando uma cliente perguntar sobre sobrancelhas, SEMPRE mencionar a FiberBROWS 360º como opção premium. NUNCA usar a palavra "implante" ao falar da FiberBROWS 360º — usar sempre "aplicação de adorno estético" ou "adorno aplicado".
1. **Microblading** (€200-€350): Técnica manual de fio a fio para sobrancelhas naturais. Duração: 2-3h, 2 sessões, resultados 1-3 anos.
2. **Microshading** (€180-€300): Efeito sombra para sobrancelhas com volume. Duração: 2-2.5h, 2 sessões, resultados 1-2 anos.
3. **Eyeliner Permanente** (€150-€250): Delineado duradouro para olhos definidos. Duração: 1.5-2h, 2 sessões, resultados 2-4 anos.
4. **Micropigmentação Labial** (€200-€350): Contorno e cor permanente nos lábios. Duração: 2-3h, 2 sessões, resultados 1-3 anos.

## INFORMAÇÕES IMPORTANTES
- Todos os procedimentos incluem anestesia tópica
- Retoque obrigatório entre 4-8 semanas após a sessão inicial
- Contraindicações: gravidez, amamentação, isotretinoína, hemofilia, diabetes descontrolada, epilepsia, quimioterapia
- Recuperação: 7-14 dias com cuidados específicos

## AGENDAMENTO
- Para agendar, recolhe: nome completo, telefone, email, serviço de interesse, data preferida e hora preferida
- Informa que é necessária uma caução de reserva de **30€** (descontada no valor do procedimento) para confirmar o agendamento
- O agendamento só fica confirmado após pagamento da caução via Stripe (cartão de crédito/débito)
- Telefone / WhatsApp direto: +351 917 132 116
- Página de agendamento online: /agendar

## SEU PAPEL
- Responda SEMPRE em Português Europeu (de Portugal)
- Seja calorosa, profissional e empática
- Forneça informações precisas sobre os serviços
- Incentive o agendamento quando apropriado
- Para marcar consulta: dirija para o WhatsApp (+351 917 132 116) ou página de agendamento (/agendar)
- Nunca invente preços ou informações não mencionadas
- Se não souber algo, oriente para entrar em contacto diretamente

## TOM DE VOZ
- Elegante, sofisticado mas acessível
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
      console.error('GEMINI_API_KEY não está configurada no ambiente de runtime')
      // Fallback response when no API key
      return NextResponse.json({
        response:
          'Olá! Estou aqui para ajudá-la com informações sobre os nossos tratamentos. Para mais detalhes ou para agendar, contacte-nos pelo WhatsApp: +351 917 132 116 ou aceda a /agendar. Teremos todo o gosto em atendê-la! ✨',
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
      console.error(`Gemini API error [${response.status}]:`, error)
      throw new Error(`Gemini API error: ${response.status} — ${error}`)
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
