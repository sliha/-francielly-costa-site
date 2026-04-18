import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `Tu és a Sofia, assistente virtual da Francielly Costa — Dermopigmentação Avançada, Braga, Portugal.
PERSONALIDADE: Simpática, profissional, acolhedora. Falas em Português Europeu.
OBJETIVO: Ajudar as clientes a conhecer os serviços e agendar procedimentos.
SERVIÇOS: Microblading, Microshading, Micropigmentação Eyeliner, Micropigmentação Labial, FiberBROWS 360º, Tricopigmentação.
LOCALIZAÇÃO: Av. Dr. António Palha 53, 4715-091 Braga. Seg-Sex 10h-18h.
CONTACTO: +351 917 132 116 | geral@franciellycosta.com
CAUÇÃO: O agendamento requer pagamento de caução de 30€.
MULTI-IDIOMA: Responde SEMPRE no idioma em que a cliente escreve.
Quando a cliente quiser agendar, recolhe: nome, telefone, email, serviço pretendido, data e hora preferida.
REGRAS FIBERBROWS: NUNCA usar implante, cirúrgico, invasivo, permanente, sintético. USAR: aplicação, fio estético biocompatível, embelezamento facial, temporário.
NUNCA inventar informações.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        message: 'Desculpe, estou com dificuldades técnicas. Contacte-nos pelo WhatsApp: +351 917 132 116'
      }, { status: 200 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const body = await req.json();
    const { messages } = body;

    // Filtrar mensagens vazias, excluir a última (input atual), converter roles
    const history = (messages || [])
      .slice(0, -1)
      .filter((msg: any) => msg.content && msg.content.trim() !== '')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Garantir que o histórico começa com 'user'
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const lastMessage = messages?.[messages.length - 1]?.content || '';

    if (!lastMessage.trim()) {
      return NextResponse.json({ message: 'Olá! Sou a Sofia, assistente virtual da Francielly Costa. Como posso ajudá-la hoje?' });
    }

    const chat = model.startChat({
      history: history,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    });

    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    return NextResponse.json({ message: response });
  } catch (error: any) {
    console.error('Gemini error:', error.message);
    return NextResponse.json({
      message: 'Desculpe, estou com dificuldades técnicas neste momento. Por favor contacte-nos pelo WhatsApp: +351 917 132 116'
    }, { status: 200 });
  }
}
