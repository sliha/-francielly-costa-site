import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';
import { CAUCAO_ATIVA } from '@/lib/caucao';

// Limites anti-abuso: o histórico vem do cliente, por isso é truncado no servidor.
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2000;

const SYSTEM_PROMPT = `Tu és a Sofia, assistente virtual da Francielly Costa — Dermopigmentação Avançada, Braga, Portugal.
PERSONALIDADE: Simpática, profissional, acolhedora. Falas em Português Europeu.
OBJETIVO: Ajudar as clientes a conhecer os serviços e agendar procedimentos.

SERVIÇOS:
- Microblading: Técnica com Tebori, fios realistas. 45min-1h. 2 sessões. Dor muito ligeiro.
- Microshading: Tebori, efeito sombreado pixel. 45min-1h. 2 sessões. Pode combinar com Microblading.
- Micropigmentação Eyeliner: Dermógrafo, linha dos cílios. 45min-1h. 2 sessões. Dor moderado.
- Micropigmentação Labial: Dermógrafo, pigmento nos lábios. 1h30-2h30. 2 sessões. Dor moderado.
- FiberBROWS 360º: Técnica de embelezamento facial com fios estéticos biocompatíveis. Temporário (6 meses). NUNCA dizer implante, cirúrgico, invasivo, permanente, sintético.
- Tricopigmentação: Micropigmentação capilar. 3-4 sessões. Duração 2-5 anos.

LOCALIZAÇÃO: Av. Dr. António Palha 53, 4715-091 Braga. Seg-Sex 10h-18h.
CONTACTO: +351 917 132 116 | geral@franciellycosta.pt
${CAUCAO_ATIVA
  ? 'CAUÇÃO: O agendamento requer pagamento de caução de 30€.'
  : 'CAUÇÃO: De momento NÃO é cobrada qualquer caução. NUNCA peças pagamento antecipado nem menciones caução — o agendamento é feito sem qualquer pagamento.'}
MULTI-IDIOMA: Responde SEMPRE no idioma em que a cliente escreve.
Quando a cliente quiser agendar, recolhe: nome, telefone, email, serviço pretendido, data e hora preferida.
NUNCA inventar informações.`;

export async function POST(req: NextRequest) {
  // Máx. 20 mensagens por IP a cada 5 minutos — trava abuso de custos de IA.
  const rl = rateLimit(`chat:${getClientIp(req)}`, 20, 5 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { message: 'Está a enviar mensagens muito depressa. Aguarde um momento e tente novamente. 💬' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        message: 'Desculpe, estou com dificuldades técnicas. Contacte-nos pelo WhatsApp: +351 917 132 116'
      });
    }

    const anthropic = new Anthropic({ apiKey });
    const body = await req.json();
    const { messages } = body;

    // Filtrar mensagens válidas (remover saudação inicial e vazias),
    // truncar conteúdo e manter apenas as últimas MAX_MESSAGES.
    const chatMessages = (Array.isArray(messages) ? messages : [])
      .filter((msg: any) => typeof msg?.content === 'string' && msg.content.trim() !== '' && !msg.isGreeting)
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: String(msg.content).slice(0, MAX_MESSAGE_CHARS),
      }))
      .slice(-MAX_MESSAGES);

    // Garantir que começa com 'user'
    while (chatMessages.length > 0 && chatMessages[0].role === 'assistant') {
      chatMessages.shift();
    }

    if (chatMessages.length === 0) {
      return NextResponse.json({
        message: 'Olá! Sou a Sofia, assistente virtual da Francielly Costa. Como posso ajudá-la hoje?'
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: chatMessages,
    });

    const textBlock = response.content.find((block: any) => block.type === 'text');
    const reply = textBlock ? (textBlock as any).text : 'Desculpe, não consegui processar. Tente novamente.';

    return NextResponse.json({ message: reply });
  } catch (error: any) {
    console.error('Anthropic error:', error.message);
    return NextResponse.json({
      message: 'Desculpe, estou com dificuldades técnicas. Contacte-nos pelo WhatsApp: +351 917 132 116'
    });
  }
}
