// Tipos partilhados do blog (sem 'server-only' — usados por servidor e cliente).

export interface BlogBlock {
  type: 'text' | 'image' | 'timeline' | 'techniqueCards' | 'careChecklist' | 'chips'
  text?: string // markdown (blocos de texto)
  url?: string // imagem
  path?: string // storage path da imagem
  legenda?: string // legenda da imagem
  // Fase 2: blocos ricos (todos opcionais, retrocompatíveis com 'text'/'image').
  title?: string // título de secção (opcional, em qualquer bloco rico)
  phases?: { label: string; text: string }[] // timeline
  note?: string // nota sob a timeline
  cards?: { title: string; text: string }[] // techniqueCards
  doItems?: string[] // careChecklist: deve fazer
  dontItems?: string[] // careChecklist: deve evitar
  items?: string[] // chips
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  coverUrl: string
  coverPath: string
  blocks: BlogBlock[]
  published: boolean
}

export function rowToPost(r: Record<string, any>): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title ?? '',
    excerpt: r.excerpt ?? '',
    category: r.category ?? '',
    readTime: r.read_time ?? '',
    date: r.date ?? '',
    coverUrl: r.cover_url ?? '',
    coverPath: r.cover_path ?? '',
    blocks: Array.isArray(r.blocks) ? r.blocks : [],
    published: !!r.published,
  }
}
