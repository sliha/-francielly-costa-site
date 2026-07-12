// Interruptor único da caução.
//
// Durante o teste do site "sem caução", isto está em `false`: o fluxo público de
// marcação não pede pagamento, e todas as menções a caução ficam escondidas.
//
// A infraestrutura de pagamento (Stripe, /api/pagamento/checkout, webhook,
// definições de negócio, etc.) fica INTACTA. Para voltar a cobrar caução, basta
// mudar isto para `true` — nada mais precisa de ser reescrito.
export const CAUCAO_ATIVA = false
