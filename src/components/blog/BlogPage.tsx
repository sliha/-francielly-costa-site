'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Clock, ArrowRight, Tag } from 'lucide-react'

const blogPosts = [
  {
    slug: 'o-que-e-microblading',
    title: 'O que é o Microblading e como funciona?',
    excerpt:
      'O Microblading é uma técnica de dermopigmentação que cria sobrancelhas naturais e perfeitas. Descubra tudo sobre este procedimento.',
    category: 'Microblading',
    readTime: '5 min',
    date: '2024-01-15',
    gradient: 'from-rose-gold/20 to-rose-gold/40',
  },
  {
    slug: 'cuidados-pos-microblading',
    title: 'Cuidados Essenciais Após o Microblading',
    excerpt:
      'Os cuidados pós-procedimento são fundamentais para o resultado perfeito. Aprenda tudo o que deve e não deve fazer.',
    category: 'Cuidados',
    readTime: '4 min',
    date: '2024-01-22',
    gradient: 'from-golden/20 to-golden/40',
  },
  {
    slug: 'microblading-vs-microshading',
    title: 'Microblading ou Microshading? Qual é o Ideal Para Si?',
    excerpt:
      'Duas técnicas populares mas diferentes. Descubra qual é a mais indicada para o seu tipo de pele e estilo de sobrancelha.',
    category: 'Comparativo',
    readTime: '6 min',
    date: '2024-02-01',
    gradient: 'from-rose-gold/30 to-golden/30',
  },
  {
    slug: 'historia-dermopigmentacao',
    title: 'A História da Dermopigmentação: Do Passado ao Presente',
    excerpt:
      'Uma viagem fascinante pela história da maquilhagem permanente, desde as civilizações antigas até às técnicas modernas.',
    category: 'Curiosidades',
    readTime: '7 min',
    date: '2024-02-10',
    gradient: 'from-golden/20 to-rose-gold/30',
  },
  {
    slug: 'eyeliner-permanente-guia-completo',
    title: 'Guia Completo do Eyeliner Permanente',
    excerpt:
      'Tudo o que precisa de saber sobre o delineado permanente: técnicas, durabilidade, cuidados e para quem é indicado.',
    category: 'Eyeliner',
    readTime: '5 min',
    date: '2024-02-18',
    gradient: 'from-rose-gold-dark/20 to-rose-gold/40',
  },
  {
    slug: 'mitos-dermopigmentacao',
    title: '7 Mitos sobre Dermopigmentação que Precisa de Esclarecer',
    excerpt:
      'Há muitas informações erradas sobre a maquilhagem permanente. Vamos desmistificar os principais mitos.',
    category: 'Desmistificando',
    readTime: '6 min',
    date: '2024-02-25',
    gradient: 'from-golden/30 to-rose-gold-dark/30',
  },
]

const categoryColors: Record<string, string> = {
  Microblading: 'bg-rose-gold/10 text-rose-gold',
  Cuidados: 'bg-golden/10 text-golden-dark',
  Comparativo: 'bg-rose-gold/10 text-rose-gold-dark',
  Curiosidades: 'bg-golden/10 text-golden',
  Eyeliner: 'bg-rose-gold/10 text-rose-gold',
  'Desmistificando': 'bg-golden/10 text-golden-dark',
}

export default function BlogPage() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
              Artigos & Dicas
            </span>
            <h1 className="font-playfair font-bold text-4xl md:text-6xl text-white mb-6">
              O Nosso{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}
              >
                Blog
              </span>
            </h1>
            <p className="text-white/70 text-lg font-inter max-w-2xl mx-auto">
              Artigos sobre dermopigmentação, dicas de beleza, novidades e
              curiosidades do mundo da maquilhagem permanente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section ref={ref} className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured post */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="mb-12"
          >
            <div className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group grid grid-cols-1 md:grid-cols-2">
              {/* Image */}
              <div className={`bg-gradient-to-br ${blogPosts[0].gradient} min-h-[280px] flex items-center justify-center relative`}>
                <div className="text-center px-8">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter mb-4 ${categoryColors[blogPosts[0].category]}`}>
                    <Tag className="w-3 h-3" />
                    {blogPosts[0].category}
                  </span>
                  <p className="text-white/80 font-playfair text-2xl font-bold">Artigo em Destaque</p>
                </div>
                <div className="absolute top-4 right-4 bg-rose-gold text-white text-xs font-semibold px-3 py-1 rounded-full font-inter">
                  Novo
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter ${categoryColors[blogPosts[0].category]}`}>
                    <Tag className="w-3 h-3" />
                    {blogPosts[0].category}
                  </span>
                  <span className="text-text-muted text-xs font-inter flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {blogPosts[0].readTime} leitura
                  </span>
                </div>
                <h2 className="font-playfair font-bold text-2xl text-text-primary mb-3 group-hover:text-rose-gold transition-colors duration-300">
                  {blogPosts[0].title}
                </h2>
                <p className="text-text-secondary font-inter text-sm leading-relaxed mb-6">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-xs font-inter">
                    {formatDate(blogPosts[0].date)}
                  </span>
                  <Link
                    href={`/blog/${blogPosts[0].slug}`}
                    className="inline-flex items-center gap-1.5 text-rose-gold font-semibold text-sm font-inter group-hover:gap-2.5 transition-all duration-200"
                  >
                    Ler Artigo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Grid of other posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.slice(1).map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group flex flex-col"
              >
                {/* Image */}
                <div className={`bg-gradient-to-br ${post.gradient} h-48 flex items-center justify-center`}>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter bg-white/20 text-white backdrop-blur-sm`}>
                    <Tag className="w-3 h-3" />
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-text-muted text-xs font-inter flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime} leitura
                    </span>
                    <span className="text-text-muted text-xs">·</span>
                    <span className="text-text-muted text-xs font-inter">
                      {formatDate(post.date)}
                    </span>
                  </div>

                  <h3 className="font-playfair font-bold text-lg text-text-primary mb-2 group-hover:text-rose-gold transition-colors duration-300 flex-1">
                    {post.title}
                  </h3>

                  <p className="text-text-secondary font-inter text-sm leading-relaxed mb-4">
                    {post.excerpt}
                  </p>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-rose-gold font-semibold text-sm font-inter group-hover:gap-2.5 transition-all duration-200 mt-auto"
                  >
                    Ler Mais
                    <ArrowRight className="w-4 h-4" />
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
