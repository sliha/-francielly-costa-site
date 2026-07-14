/**
 * Anamnese interativa do FiberBROWS.
 *
 * Fonte única de verdade para:
 *  - os passos/perguntas do formulário interativo (cliente),
 *  - o texto do consentimento informado (TCLE, versão PT),
 *  - a versão do documento (para versionamento e integridade da assinatura).
 *
 * Perguntas adaptadas da ficha oficial (forms.app) e o consentimento adaptado
 * do POP/TCLE FiberBROWS para o contexto português (NIF, RGPD, sem referências
 * à Anvisa/RDC brasileiras).
 *
 * Módulo isomórfico (sem server-only): usado no cliente (formulário) e no
 * servidor (validação, geração do documento assinado).
 */

export const CONSENTIMENTO_VERSAO = 'TCLE-FB-001 v1.0-PT (2026-07-14)'

// ── Secções (dão cor e ritmo ao formulário) ───────────────────────────────────
export interface Seccao {
  id: string
  nome: string
  emoji: string
  cor: string // hex, usado em acentos e barra de progresso
}

export const SECCOES: Seccao[] = [
  { id: 'identificacao', nome: 'Identificação', emoji: '👤', cor: '#B76E79' },
  { id: 'sobrancelha', nome: 'Sobrancelhas', emoji: '✨', cor: '#C9A96E' },
  { id: 'saude', nome: 'Saúde geral', emoji: '💗', cor: '#5EAA8B' },
  { id: 'pele', nome: 'Pele do rosto', emoji: '🌸', cor: '#B08BBB' },
  { id: 'bemestar', nome: 'Bem-estar', emoji: '🌿', cor: '#7BA7C9' },
  { id: 'consentimento', nome: 'Consentimento', emoji: '📝', cor: '#B76E79' },
]

export function seccaoPorId(id: string): Seccao {
  return SECCOES.find((s) => s.id === id) || SECCOES[0]
}

// ── Passos ────────────────────────────────────────────────────────────────────
export type TipoPasso =
  | 'texto'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'single'
  | 'multi'
  | 'consentimento'
  | 'assinatura'

export interface OpcaoPasso {
  valor: string
  label: string
}

export interface PassoAnamnese {
  id: string
  seccao: string
  tipo: TipoPasso
  pergunta: string
  ajuda?: string
  placeholder?: string
  opcoes?: OpcaoPasso[]
  obrigatorio?: boolean
}

export const PASSOS: PassoAnamnese[] = [
  // ── Identificação ──
  { id: 'nome', seccao: 'identificacao', tipo: 'texto', pergunta: 'Como se chama?', ajuda: 'O seu nome completo.', placeholder: 'Nome completo', obrigatorio: true },
  { id: 'email', seccao: 'identificacao', tipo: 'email', pergunta: 'Qual é o seu email?', ajuda: 'Serve para lhe enviarmos a cópia e para poder retomar mais tarde, se precisar.', placeholder: 'nome@email.com', obrigatorio: true },
  { id: 'telefone', seccao: 'identificacao', tipo: 'tel', pergunta: 'E o seu telemóvel?', placeholder: '9XX XXX XXX', obrigatorio: true },
  { id: 'cc', seccao: 'identificacao', tipo: 'texto', pergunta: 'Número de Cartão de Cidadão ou BI', ajuda: 'Necessário para o registo clínico.', placeholder: 'Ex.: 12345678', obrigatorio: true },
  { id: 'nif', seccao: 'identificacao', tipo: 'texto', pergunta: 'NIF', ajuda: 'Opcional.', placeholder: 'Número de contribuinte' },

  // ── Sobrancelhas ──
  { id: 'micropigmentacao', seccao: 'sobrancelha', tipo: 'textarea', pergunta: 'Tem micropigmentação nas sobrancelhas?', ajuda: 'Se sim, quantas sessões já fez e quando foi a última. Se não, escreva "Não".', placeholder: 'A sua resposta' },
  { id: 'remocaoLaser', seccao: 'sobrancelha', tipo: 'textarea', pergunta: 'Já fez remoção a laser ou despigmentação das sobrancelhas?', ajuda: 'Se sim, qual o método, quantas sessões e quando foi a última. Se não, escreva "Não".', placeholder: 'A sua resposta' },
  { id: 'corFios', seccao: 'sobrancelha', tipo: 'texto', pergunta: 'Qual a cor natural dos fios da sobrancelha ou do cabelo?', placeholder: 'Ex.: castanho escuro' },
  { id: 'lapisSombra', seccao: 'sobrancelha', tipo: 'textarea', pergunta: 'Costuma passar lápis ou sombra nas sobrancelhas para cobrir falhas?', ajuda: 'E com que frequência?', placeholder: 'A sua resposta' },
  {
    id: 'historicoSobrancelha', seccao: 'sobrancelha', tipo: 'multi',
    pergunta: 'No histórico das suas sobrancelhas, o que se aplica?',
    ajuda: 'Pode escolher vários. Se nenhum se aplicar, avance.',
    opcoes: [
      { valor: 'crescimento', label: 'Faz tratamento para crescimento de pelos na sobrancelha' },
      { valor: 'acidos', label: 'Usa ácidos ou produtos clareadores na sobrancelha' },
      { valor: 'tintura', label: 'Faz coloração dos pelos com frequência' },
      { valor: 'quedaAntes', label: 'Já teve queda dos fios da sobrancelha' },
      { valor: 'quedaAgora', label: 'Atualmente nota queda dos fios da sobrancelha ou do cabelo' },
      { valor: 'cicatriz', label: 'Já teve corte, queimadura ou cicatriz na região' },
    ],
  },

  // ── Saúde geral ──
  {
    id: 'diabetes', seccao: 'saude', tipo: 'single', pergunta: 'Tem diabetes?',
    opcoes: [
      { valor: 'nao', label: 'Não' },
      { valor: 'tipo1', label: 'Sim, Tipo 1' },
      { valor: 'tipo2', label: 'Sim, Tipo 2' },
    ],
  },
  { id: 'anticoagulantes', seccao: 'saude', tipo: 'textarea', pergunta: 'Toma anticoagulantes, corticoides ou imunossupressores?', ajuda: 'Se sim, especifique. Se não, escreva "Não".', placeholder: 'A sua resposta' },
  { id: 'hormonal', seccao: 'saude', tipo: 'textarea', pergunta: 'Tem algum distúrbio hormonal diagnosticado?', ajuda: 'Tiroide, SOP, menopausa, etc. Se não, escreva "Não".', placeholder: 'A sua resposta' },
  { id: 'alergiasProdutos', seccao: 'saude', tipo: 'textarea', pergunta: 'Já teve reações alérgicas a cosméticos, maquilhagem, tintas, verniz, hena, bijutaria, metais ou outros produtos estéticos?', ajuda: 'Se sim, especifique. Se não, escreva "Não".', placeholder: 'A sua resposta' },
  { id: 'outrasAlergias', seccao: 'saude', tipo: 'textarea', pergunta: 'Alguma outra reação alérgica que queira comunicar?', ajuda: 'Se não, escreva "Não".', placeholder: 'A sua resposta' },
  {
    id: 'historicoSaude', seccao: 'saude', tipo: 'multi',
    pergunta: 'No seu histórico de saúde, o que se aplica?',
    ajuda: 'Pode escolher vários. Se nenhum se aplicar, avance.',
    opcoes: [
      { valor: 'gravida', label: 'Está grávida ou a amamentar' },
      { valor: 'hipertensao', label: 'Hipertensão arterial' },
      { valor: 'antibiotico', label: 'Tomou antibiótico nos últimos 15 dias' },
      { valor: 'gripe', label: 'Gripe ou constipação recente' },
      { valor: 'reumatologicas', label: 'Doenças reumatológicas' },
      { valor: 'oncologicos', label: 'Tratamentos oncológicos (quimioterapia ou radioterapia)' },
      { valor: 'epilepsia', label: 'Epilepsia' },
      { valor: 'convulsoes', label: 'Convulsões' },
      { valor: 'vih', label: 'VIH' },
      { valor: 'hepatite', label: 'Hepatite' },
      { valor: 'cicatrizacao', label: 'Problema de cicatrização' },
      { valor: 'isotretinoina', label: 'Tratamento com isotretinoína (Roacutan) nos últimos 6 meses' },
    ],
  },

  // ── Pele do rosto ──
  {
    id: 'tipoPele', seccao: 'pele', tipo: 'single', pergunta: 'Qual é o seu tipo de pele?',
    opcoes: [
      { valor: 'oleosa', label: 'Oleosa' },
      { valor: 'mista', label: 'Mista' },
      { valor: 'normal', label: 'Normal' },
      { valor: 'seca', label: 'Seca' },
    ],
  },
  {
    id: 'acne', seccao: 'pele', tipo: 'multi', pergunta: 'Tem acne ativa?',
    ajuda: 'Escolha o que se aplica. Se nenhum, avance.',
    opcoes: [
      { valor: 'cravos', label: 'Pontos negros (cravos)' },
      { valor: 'vermelha', label: 'Borbulha vermelha' },
      { valor: 'pus', label: 'Borbulha com pus' },
      { valor: 'quistos', label: 'Quistos' },
    ],
  },
  { id: 'cremeSerum', seccao: 'pele', tipo: 'textarea', pergunta: 'Usa creme ou sérum facial diariamente?', ajuda: 'Se sim, qual? Se não, escreva "Não".', placeholder: 'A sua resposta' },
  { id: 'tratamentoAtual', seccao: 'pele', tipo: 'textarea', pergunta: 'Faz algum tratamento atual à pele?', ajuda: 'Se sim, qual? Se não, escreva "Não".', placeholder: 'A sua resposta' },
  {
    id: 'saudePele', seccao: 'pele', tipo: 'multi',
    pergunta: 'Quanto à saúde da pele do rosto, o que se aplica?',
    ajuda: 'Pode escolher vários. Se nenhum, avance.',
    opcoes: [
      { valor: 'seborreica', label: 'Dermatite seborreica' },
      { valor: 'rosacea', label: 'Rosácea' },
      { valor: 'vitiligo', label: 'Vitiligo' },
      { valor: 'atopica', label: 'Dermatite atópica (eczema)' },
      { valor: 'psoriase', label: 'Psoríase' },
      { valor: 'urticaria', label: 'Urticária' },
      { valor: 'vermelhidao', label: 'Costuma ter vermelhidão ou áreas inflamadas no rosto' },
      { valor: 'peeling', label: 'Fez peeling nos últimos 30 dias' },
      { valor: 'procedimento', label: 'Fez procedimento estético no rosto nos últimos 30 dias' },
    ],
  },

  // ── Bem-estar e hábitos ──
  { id: 'saudeMental', seccao: 'bemestar', tipo: 'textarea', pergunta: 'Nos últimos 12 meses, teve diagnóstico ou tratamento para depressão, ansiedade intensa, perturbação bipolar, perturbações do comportamento alimentar ou outra condição que possa afetar o seu bem-estar?', ajuda: 'Se não, escreva "Não". Fica entre nós, é só para a sua segurança.', placeholder: 'A sua resposta' },
  {
    id: 'habitos', seccao: 'bemestar', tipo: 'multi', pergunta: 'Quanto a hábitos, o que se aplica?',
    ajuda: 'Pode escolher vários. Se nenhum, avance.',
    opcoes: [
      { valor: 'fuma', label: 'Fuma' },
      { valor: 'alcool', label: 'Consumo frequente de álcool' },
      { valor: 'atividadeFisica', label: 'Pratica atividade física com frequência' },
    ],
  },
  { id: 'arLivre', seccao: 'bemestar', tipo: 'textarea', pergunta: 'Pratica atividade ao ar livre? Com que frequência?', placeholder: 'A sua resposta' },
  { id: 'observacoes', seccao: 'bemestar', tipo: 'textarea', pergunta: 'Quer deixar alguma observação geral?', ajuda: 'Opcional.', placeholder: 'A sua resposta (opcional)' },

  // ── Consentimento e assinatura ──
  {
    id: 'autorizacaoImagem', seccao: 'consentimento', tipo: 'single',
    pergunta: 'Autoriza o uso da sua imagem (fotografias antes, durante e depois) para registo e divulgação do trabalho?',
    ajuda: 'A sua escolha não afeta a realização do procedimento.',
    opcoes: [
      { valor: 'local', label: 'Sim, apenas o local do procedimento (sobrancelhas)' },
      { valor: 'rosto', label: 'Sim, rosto inteiro' },
      { valor: 'nao', label: 'Não autorizo' },
    ],
  },
  { id: 'consentimento', seccao: 'consentimento', tipo: 'consentimento', pergunta: 'Consentimento informado' },
  { id: 'assinatura', seccao: 'consentimento', tipo: 'assinatura', pergunta: 'A sua assinatura' },
]

// ── Conteúdo do consentimento (TCLE) adaptado para Portugal ───────────────────
export const CONSENTIMENTO = {
  titulo: 'Termo de Consentimento Informado',
  subtitulo: 'FiberBROWS',
  procedimento:
    'O FiberBROWS consiste na inserção de fios sintéticos biocompatíveis (PBT, polibutileno tereftalato) na região das sobrancelhas, com profundidade máxima de 3 mm, sem finalidade terapêutica e com efeito temporário (duração média de 4 a 6 meses). É um produto de adorno corporal temporário e removível. Não é um ato médico nem cirúrgico. O fio é estéril, de uso único e descartável.',
  riscos: [
    'Vermelhidão ligeira, comichão ou inchaço nas primeiras 48 horas',
    'Pequeno sangramento durante a aplicação',
    'Reações alérgicas (embora raras)',
    'Infeções, caso não sejam seguidas as orientações de higienização',
    'Perda precoce dos fios por má cicatrização ou cuidados inadequados',
  ],
  contraindicacoes: [
    'Grávidas',
    'Portadoras de doenças autoimunes ativas ou pessoas imunossuprimidas',
    'Histórico de alergias graves ou de cicatrização anómala',
    'Presença de feridas ou infeções na região',
  ],
  cuidados: [
    'Evitar maquilhagem na zona durante 3 dias',
    'Não molhar a região com água corrente durante 48 horas',
    'Evitar piscina, sauna e exposição solar durante 15 dias',
    'Higienizar com soro fisiológico e algodão limpo',
    'Aplicar pomada cicatrizante durante 7 dias',
    'Procurar apoio se surgir dor intensa, secreção, febre ou vermelhidão progressiva',
  ],
  declaracoes: [
    'Fui informada de forma clara sobre o procedimento, os seus riscos, cuidados e alternativas',
    'Li e compreendi este termo e recebi orientações verbais e por escrito',
    'Estou ciente de que os resultados variam consoante a resposta do meu organismo e de que podem ser necessários retoques',
    'As informações que prestei nesta anamnese são verdadeiras e completas',
    'Tive oportunidade de esclarecer as minhas questões',
    'Concordo com a realização do procedimento',
  ],
  rgpd:
    'Responsável pelo tratamento: Francielly Costa, Dermopigmentação Avançada, Av. Dr. António Palha 53, 4715-091 Braga. As informações de saúde aqui recolhidas são categorias especiais de dados (art. 9.º do RGPD), tratadas de forma confidencial e exclusivamente para avaliar contraindicações e garantir a segurança do procedimento. São conservadas durante 5 anos após o procedimento e nunca partilhadas para outros fins. Pode aceder, retificar ou pedir a eliminação dos seus dados através de geral@franciellycosta.pt.',
}

// Passos que contam para a barra de progresso (todos).
export const TOTAL_PASSOS = PASSOS.length

// Índice do primeiro passo de cada secção (para marcos visuais).
export function indiceInicioSeccao(seccaoId: string): number {
  return PASSOS.findIndex((p) => p.seccao === seccaoId)
}
