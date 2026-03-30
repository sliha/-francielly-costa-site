'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Instagram, ExternalLink, Heart, X } from 'lucide-react'

const instagramPosts = [
  {
    id: '1',
    imageGradient: 'from-rose-gold/40 to-golden/30',
    symbol: '✦',
    likes: 312,
    caption: 'Microblading natural e elegante ✨ Resultado que dura anos!',
    tag: 'Microblading',
  },
  {
    id: '2',
    imageGradient: 'from-golden/40 to-rose-gold/20',
    symbol: '◆',
    likes: 287,
    caption: 'Lábios perfeitos com micropigmentação 💋 Cor natural e duradoura',
    tag: 'Micropigmentação Labial',
  },
  {
    id: '3',
    imageGradient: 'from-rose-gold-dark/30 to-rose-gold/40',
    symbol: '◇',
    likes: 401,
    caption: 'Microshading para um look perfeito todos os dias ✨',
    tag: 'Microshading',
  },
  {
    id: '4',
    imageGradient: 'from-golden-dark/30 to-golden/40',
    symbol: '❋',
    likes: 256,
    caption: 'Eyeliner permanente — acorda sempre impecável 😍',
    tag: 'Eyeliner Permanente',
  },
  {
    id: '5',
    imageGradient: 'from-rose-gold/30 to-rose-gold-dark/40',
    symbol: '✦',
    likes: 334,
    caption: 'Transformação total 💫 Antes e depois que vai surpreender',
    tag: 'Microblading',
  },
  {
    id: '6',
    imageGradient: 'from-golden/30 to-golden-dark/40',
    symbol: '◆',
    likes: 198,
    caption: 'A perfeição está nos detalhes 🌸 Agenda já a tua consulta!',
    tag: 'Micropigmentação Labial',
  },
]

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{count.toLocaleString('pt-PT')}</span>
}

export default function InstagramSection() {
  const [hoveredPost, setHoveredPost] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section ref={sectionRef} className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center">
              <Instagram size={20} className="text-white" />
            </div>
            <span className="font-inter text-sm font-semibold tracking-widest uppercase text-rose-gold">
              Instagram
            </span>
          </div>
          <h2 className="font-playfair font-bold text-3xl md:text-4xl text-text-primary mb-4">
            Siga o Trabalho da{' '}
            <span className="gradient-text">Francielly</span>
          </h2>

          {/* Contador de seguidores animado */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-gold/10 to-golden/10 border border-rose-gold/20 rounded-full px-5 py-2.5 mb-4">
            <Heart size={14} className="text-rose-gold fill-rose-gold" />
            <p className="text-text-secondary font-inter text-sm">
              <span className="text-rose-gold font-bold text-lg">
                <AnimatedCounter target={2847} />
              </span>{' '}
              pessoas seguem o trabalho da Francielly no Instagram
            </p>
          </div>

          <p className="text-text-secondary font-inter max-w-xl mx-auto">
            Veja os resultados reais das nossas clientes e inspire-se para a sua transformação.
          </p>
        </motion.div>

        {/* Grid de posts */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          {instagramPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
              onMouseEnter={() => setHoveredPost(post.id)}
              onMouseLeave={() => setHoveredPost(null)}
            >
              {/* Fundo gradiente (placeholder até Instagram API) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${post.imageGradient}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/30 text-6xl">{post.symbol}</span>
              </div>

              {/* Tag do serviço */}
              <div className="absolute top-3 left-3">
                <span className="text-xs bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                  {post.tag}
                </span>
              </div>

              {/* Overlay no hover */}
              <div className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${
                hoveredPost === post.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="flex items-center gap-1.5 text-white">
                  <Heart size={18} className="fill-white" />
                  <span className="font-semibold">{post.likes}</span>
                </div>
                <p className="text-white/80 text-xs text-center px-4 leading-relaxed">
                  {post.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <a
            href="https://www.instagram.com/franciellycostapmu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-gold to-golden text-white font-semibold font-inter px-8 py-3.5 rounded-full hover:shadow-rose-lg transition-all duration-300 hover:scale-105"
          >
            <Instagram size={18} />
            Ver no Instagram
            <ExternalLink size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
