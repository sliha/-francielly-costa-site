export interface Service {
  id: string
  slug: string
  name: string
  shortDescription: string
  description: string
  fullDescription?: string
  icon?: string
  duration: string
  duracaoMinutos: number
  sessions: number
  painLevel: string
  priceRange?: string
  recovery?: string
  duration_result?: string
  purposes: string[]
  benefits?: string[]
  idealFor?: string[]
  procedure?: string[]
  color?: string
  gradient?: string
  category: 'sobrancelhas' | 'olhos' | 'labios'
}

export const SERVICES: Service[] = [
  {
    id: 'fiberbrows',
    slug: 'fiberbrows',
    name: 'FiberBROWS',
    shortDescription: 'Técnica não cirúrgica com fios sintéticos biocompatíveis. Sobrancelhas naturais, resultado 6 meses.',
    description:
      'Técnica estética não cirúrgica de aplicação superficial de fios sintéticos biocompatíveis nas sobrancelhas. Profundidade máxima de 2mm, dor inferior à micropigmentação, resultado duradouro de 6 meses.',
    fullDescription:
      'A FiberBROWS é uma técnica inovadora que aplica fios sintéticos biocompatíveis na pele com profundidade máxima de 2mm — mais superficial que a tatuagem, mais leve que a micropigmentação, menos invasiva que o piercing. Não é cirúrgica, não envolve extração de folículos e preserva 100% a integridade dos pelos naturais.',
    icon: '◈',
    duration: 'A definir',
    duracaoMinutos: 60,
    sessions: 1,
    painLevel: 'Muito ligeiro',
    priceRange: 'A partir de €1.000',
    recovery: 'Mínimo',
    duration_result: '6 meses',
    purposes: [
      'Sobrancelhas naturais sem cirurgia',
      'Alternativa a transplante capilar',
      'Preenchimento de falhas',
      'Resultado temporário renovável',
    ],
    benefits: [
      'Não cirúrgico nem médico',
      'Dor muito ligeira',
      'Resultado 6 meses',
      'Alternativa a €7.000-€30.000',
    ],
    idealFor: [
      'Sobrancelhas com falhas',
      'Quem recusa cirurgia',
      'Resultado natural imediato',
      'Pele normal a seca',
    ],
    procedure: [
      'Consulta e análise das sobrancelhas',
      'Teste de tolerância ao fio sintético',
      'Mapeamento e design',
      'Aplicação com protocolo técnico rigoroso',
      'Controlo de profundidade (máx. 2mm)',
      'Instruções pós-procedimento',
    ],
    color: '#C9A96E',
    gradient: 'from-golden to-golden-dark',
    category: 'sobrancelhas',
  },
  {
    id: 'microblading',
    slug: 'microblading',
    name: 'Microblading',
    shortDescription: 'Fios ultrarealistas com Tebori para sobrancelhas perfeitas',
    description:
      'Técnica de pigmentação de origem japonesa, realizada com instrumento Tebori. Cria fios individualizados imitando pelos naturais, resultando em sobrancelhas detalhadas, tridimensionais e extremamente realistas.',
    fullDescription:
      'O Microblading é uma técnica de dermopigmentação manual que utiliza uma caneta especial com micro-agulhas para depositar pigmento na camada superficial da pele, criando fios individuais que imitam perfeitamente os pelos naturais das sobrancelhas. O resultado é extremamente natural e personalizado para cada rosto.',
    icon: '✦',
    duration: '45min – 1h',
    duracaoMinutos: 60,
    sessions: 2,
    painLevel: 'Muito ligeiro',
    priceRange: '€200 – €350',
    recovery: '7–14 dias',
    duration_result: '1–3 anos',
    purposes: [
      'Preenchimento de falhas',
      'Redefinição de formato',
      'Correção de assimetrias',
      'Aparência natural e realista',
    ],
    benefits: [
      'Aspeto 100% natural',
      'Personalizado ao rosto',
      'Sem manutenção diária',
      'Resistente à água',
    ],
    idealFor: [
      'Sobrancelhas com falhas',
      'Queda de pelos por doenças',
      'Quem quer praticidade',
      'Quem busca simetria',
    ],
    procedure: [
      'Consulta e mapeamento facial',
      'Definição do traçado ideal',
      'Aplicação de anestesia tópica',
      'Técnica manual de fio a fio',
      'Pigmentação final',
      'Cuidados pós-procedimento',
    ],
    color: '#B76E79',
    gradient: 'from-rose-gold to-rose-gold-dark',
    category: 'sobrancelhas',
  },
  {
    id: 'microshading',
    slug: 'microshading',
    name: 'Microshading',
    shortDescription: 'Sombreamento suave em pixel para sobrancelhas densas e naturais',
    description:
      'Técnica com Tebori que cria efeito de sombreamento suave em forma de pixel. Ideal para sobrancelha densa, definida e natural. Pode ser combinada com Microblading (técnica híbrida).',
    fullDescription:
      'O Microshading é uma técnica que utiliza uma máquina de dermopigmentação para criar um efeito de sombreado nas sobrancelhas, dando volume, densidade e um acabamento de maquilhagem natural. Ideal para quem deseja sobrancelhas mais cheias e definidas sem parecer artificial.',
    icon: '◆',
    duration: '45min – 1h',
    duracaoMinutos: 60,
    sessions: 2,
    painLevel: 'Muito ligeiro',
    priceRange: '€180 – €300',
    recovery: '7–10 dias',
    duration_result: '1–2 anos',
    purposes: [
      'Preenchimento e uniformização',
      'Efeito sombreamento suave',
      'Correção de imperfeições',
      'Aspeto natural',
    ],
    benefits: [
      'Sobrancelhas com volume',
      'Técnica menos invasiva',
      'Cicatrização mais rápida',
      'Ótimo para pele oleosa',
    ],
    idealFor: [
      'Pele oleosa ou mista',
      'Sobrancelhas finas',
      'Quem prefere efeito sombra',
      'Resultado mais duradouro',
    ],
    procedure: [
      'Análise do tipo de pele',
      'Mapeamento personalizado',
      'Anestesia tópica',
      'Técnica de shading pontilhado',
      'Ajuste de intensidade',
      'Orientações pós-procedimento',
    ],
    color: '#C9A96E',
    gradient: 'from-golden to-golden-dark',
    category: 'sobrancelhas',
  },
  {
    id: 'eyeliner',
    slug: 'eyeliner',
    name: 'Micropigmentação Eyeliner',
    shortDescription: 'Delineado permanente ao longo da linha dos cílios',
    description:
      'Aplicação de pigmentos na derme papilar ao longo da linha dos cílios com dermógrafo. Técnicas de Delineado ou Contorno para ajustar formato, corrigir simetrias e criar profundidade.',
    fullDescription:
      'O Eyeliner Permanente é uma técnica de dermopigmentação que aplica pigmento na linha dos cílios para criar um delineado duradouro. Pode ser discreto (apenas entre os cílios) ou mais marcado, conforme o desejo da cliente. Transforma o olhar de forma sutil e elegante.',
    icon: '◇',
    duration: '45min – 1h',
    duracaoMinutos: 60,
    sessions: 2,
    painLevel: 'Moderado',
    priceRange: '€150 – €250',
    recovery: '5–10 dias',
    duration_result: '2–4 anos',
    purposes: [
      'Realçar cor dos olhos',
      'Correção de assimetrias',
      'Economizar tempo na maquiagem',
      'Praticidade',
    ],
    benefits: [
      'Olhar definido 24h',
      'Resistente à água e suor',
      'Aspeto natural ou marcado',
      'Economiza tempo de maquilhagem',
    ],
    idealFor: [
      'Olhos pequenos',
      'Quem usa delineado diariamente',
      'Atletas e pessoas ativas',
      'Alergia a cosméticos',
    ],
    procedure: [
      'Design do traçado ideal',
      'Escolha da técnica e espessura',
      'Aplicação de anestesia ocular',
      'Pigmentação precisa',
      'Verificação da simetria',
      'Cuidados pós-tratamento',
    ],
    color: '#B76E79',
    gradient: 'from-rose-gold-dark to-rose-gold',
    category: 'olhos',
  },
  {
    id: 'labial',
    slug: 'micropigmentacao-labial',
    name: 'Micropigmentação Labial',
    shortDescription: 'Contorno e cor perfeitos para lábios rejuvenescidos',
    description:
      'Aplicação de pigmento nos lábios com dermógrafo. Melhora contornos e coloração. Cores de rosa a vermelho. Corrige assimetrias e estimula produção de novo colagénio.',
    fullDescription:
      'A Micropigmentação Labial é uma técnica que adiciona cor e define o contorno dos lábios de forma permanente. Pode corrigir assimetrias, aumentar visualmente o volume dos lábios e uniformizar a coloração, eliminando a necessidade de usar batom diariamente.',
    icon: '❋',
    duration: '1h30 – 2h30',
    duracaoMinutos: 150,
    sessions: 2,
    painLevel: 'Moderado',
    priceRange: '€200 – €350',
    recovery: '7–14 dias',
    duration_result: '1–3 anos',
    purposes: [
      'Melhoria do contorno labial',
      'Correção de assimetrias',
      'Correção de coloração',
      'Rejuvenescimento dos lábios',
    ],
    benefits: [
      'Lábios coloridos 24h',
      'Sem retoques de batom',
      'Aspeto jovem e fresco',
      'Personalização total da cor',
    ],
    idealFor: [
      'Lábios com pouca pigmentação',
      'Contornos irregulares',
      'Quem quer cor duradoura',
      'Lábios finos que desejam volume visual',
    ],
    procedure: [
      'Análise do tom de pele',
      'Escolha personalizada da cor',
      'Desenho do contorno ideal',
      'Anestesia tópica labial',
      'Pigmentação por camadas',
      'Finalização e cuidados',
    ],
    color: '#C9A96E',
    gradient: 'from-rose-gold to-golden',
    category: 'labios',
  },
]

// Keep backward-compatible export
export const services = SERVICES

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug)
}

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}
