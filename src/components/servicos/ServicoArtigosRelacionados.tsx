import Link from 'next/link'
import Image from 'next/image'
import { Clock, Tag, ArrowRight } from 'lucide-react'
import { getPublishedPosts } from '@/lib/blog'

const RELACIONADOS: Record<string, string[]> = {
  microblading: ['o-que-e-microblading', 'microblading-vs-microshading', 'micropigmentacao-sobrancelhas-guia-completo', 'cuidados-pos-microblading'],
  microshading: ['microblading-vs-microshading', 'micropigmentacao-sobrancelhas-guia-completo', 'cuidados-pos-microblading'],
  'micropigmentacao-labial': ['micropigmentacao-labial-guia-completo', 'mitos-dermopigmentacao', 'historia-dermopigmentacao'],
  eyeliner: ['eyeliner-permanente-guia-completo', 'mitos-dermopigmentacao', 'historia-dermopigmentacao'],
  fiberbrows: ['fiberbrows-nova-tecnica', 'micropigmentacao-sobrancelhas-guia-completo', 'microblading-vs-microshading'],
  tricopigmentacao: ['tricopigmentacao-guia-completo', 'historia-dermopigmentacao', 'mitos-dermopigmentacao'],
}

export default async function ServicoArtigosRelacionados({ slug }: { slug: string }) {
  const posts = await getPublishedPosts()
  if (!posts.length) return null

  const bySlug = new Map(posts.map((p) => [p.slug, p]))
  const preferidos = (RELACIONADOS[slug] ?? [])
    .map((s) => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  const escolhidos = [...preferidos]
  for (const p of posts) {
    if (escolhidos.length >= 3) break
    if (!escolhidos.some((e) => e.slug === p.slug)) escolhidos.push(p)
  }
  const artigos = escolhidos.slice(0, 3)
  if (!artigos.length) return null

  return (
    <section className="py-16 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-semibold tracking-widest uppercase text-rose-gold mb-3 font-inter">
            Para saber mais
          </span>
          <h2 className="font-playfair font-bold text-3xl md:text-4xl text-text-primary">
            Artigos que te podem interessar
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {artigos.map((post) => (
            <article key={post.slug} className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group flex flex-col">
              <Link href={`/blog/${post.slug}`} className="flex flex-col flex-1">
                <div className="relative h-44 bg-gradient-to-br from-rose-gold/30 to-rose-gold/60 flex items-center justify-center">
                  {post.coverUrl ? (
                    <Image src={post.coverUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter bg-white/20 text-white backdrop-blur-sm relative z-10">
                      <Tag className="w-3 h-3" /> {post.category}
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-text-muted text-xs font-inter flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" /> {post.readTime} leitura
                  </span>
                  <h3 className="font-playfair font-bold text-xl text-text-primary mb-2 group-hover:text-rose-gold transition-colors duration-300">
                    {post.title}
                  </h3>
                  <p className="text-text-secondary font-inter text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-rose-gold font-semibold text-sm font-inter group-hover:gap-2.5 transition-all duration-200">
                    Ler artigo <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
