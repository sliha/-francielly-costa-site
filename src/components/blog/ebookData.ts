// Conteúdo e metadados do eBook "A Chave para o Sucesso" — Método Francielly Costa
// Páginas renderizadas a partir do PDF original para a experiência de leitura online.

export const EBOOK = {
  slug: 'ebook-designer-de-sobrancelhas',
  title: 'A Chave para o Sucesso',
  subtitle: 'Curso de Designer de Sobrancelhas',
  method: 'Método Francielly Costa',
  tagline:
    'O manual completo que a Francielly Costa usa para formar profissionais — agora gratuito, para ti.',
  description:
    'Um eBook de 28 páginas com o método completo de design de sobrancelhas da Francielly Costa: ferramentas, anatomia, ética profissional, formatos de rosto e o sistema de medição que garante sobrancelhas perfeitas. Lê online ou descarrega em PDF, grátis e sem registo.',
  date: '2026-05-30',
  pageCount: 28,
  fileSizeLabel: '8 MB · PDF',
  cover: '/ebook/cover.webp',
  ogImage: '/ebook/ebook-og.jpg',
  pdf: '/ebook/ebook-a-chave-para-o-sucesso-francielly-costa.pdf',
  pdfName: 'A-Chave-para-o-Sucesso-Francielly-Costa.pdf',
} as const

// Caminhos de todas as páginas (page-01.webp … page-28.webp)
export const ebookPages: string[] = Array.from(
  { length: EBOOK.pageCount },
  (_, i) => `/ebook/pages/page-${String(i + 1).padStart(2, '0')}.webp`,
)

// Páginas em destaque para a pré-visualização (índices 0-based)
export const previewPageIndexes = [0, 1, 6, 15, 19, 23, 25]

export interface EbookStat {
  value: string
  label: string
}

export const ebookStats: EbookStat[] = [
  { value: '28', label: 'Páginas de conteúdo' },
  { value: '12', label: 'Módulos completos' },
  { value: '+10', label: 'Anos de experiência' },
  { value: '+2300', label: 'Clientes transformados' },
]

export interface EbookModule {
  n: number
  icon: string
  title: string
  topics: string[]
}

// Os 12 módulos, fiéis ao índice do eBook
export const ebookModules: EbookModule[] = [
  {
    n: 1,
    icon: 'Sparkles',
    title: 'Introdução',
    topics: ['Boas-vindas', 'Missão e filosofia', 'Os princípios da beleza'],
  },
  {
    n: 2,
    icon: 'Eye',
    title: 'A Importância das Sobrancelhas',
    topics: ['A moldura do olhar', 'Função na expressão facial'],
  },
  {
    n: 3,
    icon: 'Scissors',
    title: 'Ferramentas de Design',
    topics: ['Tesourinha, pentes e pinças', 'Lápis e extratores', 'Dappen e henna'],
  },
  {
    n: 4,
    icon: 'ScanFace',
    title: 'Anatomia e Fisiologia',
    topics: ['A face e o crânio', 'Pontos-chave do rosto'],
  },
  {
    n: 5,
    icon: 'FlaskConical',
    title: 'Processo Químico da Laminação',
    topics: ['Introdução ao Brow Lamination', 'Benefícios da técnica'],
  },
  {
    n: 6,
    icon: 'ClipboardList',
    title: 'Preparação e Aplicação',
    topics: ['Conceitos básicos', 'Passo a passo — Aula 01', 'Passo a passo — Aula 02'],
  },
  {
    n: 7,
    icon: 'Paintbrush',
    title: 'Modelagem e Finalização',
    topics: ['Técnicas de modelagem', 'Cuidados pós-laminação'],
  },
  {
    n: 8,
    icon: 'Lightbulb',
    title: 'Dicas Avançadas',
    topics: ['Abordagem de problemas comuns', 'Soluções para cada tipo de sobrancelha'],
  },
  {
    n: 9,
    icon: 'Ruler',
    title: 'Design de Sobrancelhas',
    topics: ['Aula bónus', 'Utilização da linha', 'Medição das sobrancelhas'],
  },
  {
    n: 10,
    icon: 'Smile',
    title: 'Tipos de Olhos e Rostos',
    topics: ['Tipos de olhos', 'Formato ideal para cada rosto'],
  },
  {
    n: 11,
    icon: 'ShieldCheck',
    title: 'Ética Profissional',
    topics: ['A importância da ética', 'Práticas de higiene e segurança'],
  },
  {
    n: 12,
    icon: 'GraduationCap',
    title: 'Considerações Finais',
    topics: ['Reflexão sobre a jornada', 'Continuidade no aprendizado'],
  },
]

export interface MethodRule {
  label: string
  value: string
  desc: string
}

// O sistema de medição do "Método Francielly Costa"
export const methodRules: MethodRule[] = [
  {
    label: 'Comprimento ideal',
    value: '4 – 6,5 cm',
    desc: 'A sobrancelha nunca deve ser menor que 4 cm nem maior que 6,5 cm.',
  },
  {
    label: 'Espessura',
    value: '0,75 – 0,85 mm',
    desc: 'A largura mantém-se dentro deste intervalo para um traço harmonioso.',
  },
  {
    label: 'Distância entre elas',
    value: '2 – 3 cm',
    desc: 'Medida a partir da glabela, o ponto central entre as sobrancelhas.',
  },
  {
    label: 'Ponto arqueado',
    value: '( medida ÷ 2 ) + 1',
    desc: 'Ex.: 5 cm → 5 ÷ 2 = 2,5 + 1 = 3,5 cm marca o ponto alto e personalizado.',
  },
]

export interface EbookQuote {
  text: string
  source: string
}

export const ebookQuotes: EbookQuote[] = [
  {
    text:
      'Ser a chave não se limita a fornecer serviços de beleza — é também criar a tua própria beleza.',
    source: 'A Chave para o Sucesso',
  },
  {
    text:
      'Se os olhos são as janelas da alma, as sobrancelhas são a sua moldura.',
    source: 'Capítulo 2 — A Importância das Sobrancelhas',
  },
  {
    text:
      'A minha missão é difundir o conhecimento, na arte de embelezar, num magnífico espetáculo ao alcance de todos.',
    source: 'Francielly Costa',
  },
]

export interface EbookBenefit {
  icon: string
  title: string
  desc: string
}

export const ebookBenefits: EbookBenefit[] = [
  {
    icon: 'Download',
    title: 'Grátis e sem registo',
    desc: 'Descarrega o PDF completo ou lê online. Sem formulários, sem custos.',
  },
  {
    icon: 'BookOpenCheck',
    title: 'Método testado',
    desc: 'O mesmo sistema de medição que a Francielly ensina nas suas formações.',
  },
  {
    icon: 'HeartHandshake',
    title: 'Da iniciante à profissional',
    desc: 'Conteúdo acessível para quem começa e valioso para quem já trabalha na área.',
  },
]
