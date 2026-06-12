'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Clock, ArrowRight, Tag, BookOpen, Download, Sparkles, Check } from 'lucide-react'
import { EBOOK } from './ebookData'
import type { BlogPost } from '@/lib/blogTypes'

const categoryColors: Record<string, string> = {
  FiberBROWS: 'bg-golden/15 text-golden',
  Tricopigmentação: 'bg-sky-500/10 text-sky-400',
  Microblading: 'bg-rose-gold/10 text-rose-gold',
  Cuidados: 'bg-golden/10 text-golden-dark',
  Comparativo: 'bg-rose-gold/10 text-rose-gold-dark',
  Curiosidades: 'bg-golden/10 text-golden',
  Eyeliner: 'bg-rose-gold/10 text-rose-gold',
  Desmistificando: 'bg-golden/10 text-golden-dark',
}

const fallbackGradients = [
  'from-golden/30 to-rose-gold/40',
  'from-slate-600/30 to-blue-900/40',
  'from-rose-gold/20 to-rose-gold/40',
  'from-golden/20 to-golden/40',
  'from-rose-gold/30 to-golden/30',
  'from-golden/20 to-rose-gold/30',
  'from-rose-gold-dark/20 to-rose-gold/40',
  'from-golden/30 to-rose-gold-dark/30',
]

export default function BlogPage({ posts }: { posts: BlogPost[] }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
              Artigos & Dicas
            </span>
            <h1 className="font-playfair font-bold text-4xl md:text-6xl text-white mb-6">
              O Nosso{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}>
                Blog
              </span>
            </h1>
            <p className="text-white/70 text-lg font-inter max-w-2xl mx-auto">
              Artigos sobre dermopigmentação, dicas de beleza, novidades e curiosidades do mundo da maquilhagem permanente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section ref={ref} className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* eBook gratuito — destaque */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-12">
            <Link href={`/blog/${EBOOK.slug}`} className="group block relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1a1f] to-[#140d10] shadow-card-hover">
              <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-rose-gold/20 blur-3xl" />
              <div className="absolute -bottom-24 left-1/3 w-72 h-72 rounded-full bg-golden/10 blur-3xl" />
              <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center p-8 md:p-12">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-gold/15 border border-rose-gold/30 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-golden-light font-inter mb-5">
                    <Sparkles className="w-3.5 h-3.5" />
                    eBook Gratuito
                  </span>
                  <h2 className="font-playfair font-bold text-3xl md:text-4xl text-white leading-tight">
                    A Chave para o{' '}
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #D4A0A8, #C9A96E)' }}>Sucesso</span>
                  </h2>
                  <p className="mt-2 font-playfair italic text-lg text-white/70">{EBOOK.subtitle}</p>
                  <p className="mt-4 text-white/70 font-inter text-sm md:text-base leading-relaxed max-w-lg">
                    O método completo da Francielly Costa em {EBOOK.pageCount} páginas: ferramentas, anatomia, ética e o sistema de medição que cria sobrancelhas perfeitas. Lê online ou descarrega em PDF.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-gold text-white font-semibold font-inter text-sm shadow-rose group-hover:bg-rose-gold-dark group-hover:gap-3 transition-all duration-300">
                      <BookOpen className="w-4 h-4" /> Abrir eBook gratuito <ArrowRight className="w-4 h-4" />
                    </span>
                    <span className="inline-flex items-center gap-2 text-white/60 text-sm font-inter">
                      <Download className="w-4 h-4" /> {EBOOK.fileSizeLabel}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-white/50 text-xs font-inter">
                    <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-golden" /> Grátis</span>
                    <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-golden" /> Sem registo</span>
                    <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-golden" /> 12 módulos</span>
                  </div>
                </div>
                <div className="hidden md:flex justify-center" style={{ perspective: '1200px' }}>
                  <div className="relative transition-transform duration-700 ease-out group-hover:[transform:rotateY(-10deg)]" style={{ transform: 'rotateY(-18deg) rotateX(3deg)' }}>
                    <Image src={EBOOK.cover} alt={`Capa do eBook ${EBOOK.title}`} width={260} height={406} className="rounded-r-lg rounded-l-sm shadow-2xl w-[200px] lg:w-[240px] h-auto" />
                    <div className="absolute top-0 left-0 h-full w-3 bg-gradient-to-r from-black/60 to-transparent rounded-l-sm" />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-3/4 h-5 bg-black/40 blur-xl rounded-full" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Featured post */}
          {featured && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-12">
              <Link href={`/blog/${featured.slug}`} className="block bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group grid grid-cols-1 md:grid-cols-2">
                <div className={`relative min-h-[280px] flex items-center justify-center bg-gradient-to-br ${fallbackGradients[0]}`}>
                  {featured.coverUrl ? (
                    <Image src={featured.coverUrl} alt={featured.title} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  ) : (
                    <div className="text-center px-8 relative z-10">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter mb-4 ${categoryColors[featured.category] ?? 'bg-white/20 text-white'}`}>
                        <Tag className="w-3 h-3" /> {featured.category}
                      </span>
                      <p className="text-white/80 font-playfair text-2xl font-bold">Artigo em Destaque</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-rose-gold text-white text-xs font-semibold px-3 py-1 rounded-full font-inter z-10">Novo</div>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter ${categoryColors[featured.category] ?? 'bg-rose-gold/10 text-rose-gold'}`}>
                      <Tag className="w-3 h-3" /> {featured.category}
                    </span>
                    <span className="text-text-muted text-xs font-inter flex items-center gap-1"><Clock className="w-3 h-3" /> {featured.readTime} leitura</span>
                  </div>
                  <h2 className="font-playfair font-bold text-2xl text-text-primary mb-3 group-hover:text-rose-gold transition-colors duration-300">{featured.title}</h2>
                  <p className="text-text-secondary font-inter text-sm leading-relaxed mb-6">{featured.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-xs font-inter">{formatDate(featured.date)}</span>
                    <span className="inline-flex items-center gap-1.5 text-rose-gold font-semibold text-sm font-inter group-hover:gap-2.5 transition-all duration-200">Ler Artigo <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Grid of other posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post, i) => (
              <motion.article key={post.slug} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group flex flex-col">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className={`relative h-48 flex items-center justify-center bg-gradient-to-br ${fallbackGradients[(i + 1) % fallbackGradients.length]}`}>
                    {post.coverUrl ? (
                      <Image src={post.coverUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter bg-white/20 text-white backdrop-blur-sm relative z-10">
                        <Tag className="w-3 h-3" /> {post.category}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-text-muted text-xs font-inter flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} leitura</span>
                    <span className="text-text-muted text-xs">·</span>
                    <span className="text-text-muted text-xs font-inter">{formatDate(post.date)}</span>
                  </div>
                  <h3 className="font-playfair font-bold text-lg text-text-primary mb-2 group-hover:text-rose-gold transition-colors duration-300 flex-1">{post.title}</h3>
                  <p className="text-text-secondary font-inter text-sm leading-relaxed mb-4">{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1.5 text-rose-gold font-semibold text-sm font-inter group-hover:gap-2.5 transition-all duration-200 mt-auto">
                    Ler Mais <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
