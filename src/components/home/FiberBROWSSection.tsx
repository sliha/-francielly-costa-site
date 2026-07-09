'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Shield, Zap, Clock, TrendingDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

const diferenciais = [
  {
    icon: Shield,
    title: 'Embelezamento Estético',
    desc: 'Sem fins terapêuticos. Técnica de embelezamento facial com profundidade máxima de 2mm, sem agressão profunda à pele.',
  },
  {
    icon: Zap,
    title: 'Muito Confortável',
    desc: 'Desconforto muito inferior à micropigmentação ou microagulhamento. Anestésico tópico incluído.',
  },
  {
    icon: Clock,
    title: 'Duração 6 Meses',
    desc: 'Resultado duradouro com possibilidade de renovação. Flexibilidade para adaptar ao longo do tempo.',
  },
  {
    icon: TrendingDown,
    title: 'Preço Acessível',
    desc: 'Alternativa altamente atrativa a procedimentos de €7.000-€30.000. Sobrancelhas naturais a partir de €1.000.',
  },
]

export default function FiberBROWSSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section
      ref={ref}
      id="fiberbrows-highlight"
      className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2a1a0f 0%, #1a1205 40%, #0d0a00 100%)' }}
    >
      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #C9A96E 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-15 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-golden/40 bg-golden/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-golden" />
            <span className="text-golden text-xs font-bold tracking-[0.2em] uppercase font-inter">
              Exclusivo — Novo em Portugal
            </span>
          </div>

          <h2 className="font-playfair font-bold text-4xl sm:text-5xl md:text-6xl text-white mb-5 leading-tight">
            FiberBROWS —{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #C9A96E 0%, #B76E79 60%, #C9A96E 100%)' }}
            >
              A Revolução das Sobrancelhas
            </span>
          </h2>

          <p className="text-white/60 text-lg md:text-xl font-inter max-w-2xl mx-auto">
            Resultados naturais e imediatos.{' '}
            <span className="text-golden/80">Já disponível em Braga — marcações abertas.</span>
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {diferenciais.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.12 }}
              className="group relative rounded-2xl p-6 border border-golden/15 hover:border-golden/40 transition-all duration-400"
              style={{ background: 'rgba(201,169,110,0.04)' }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                style={{ background: 'radial-gradient(circle at top left, rgba(201,169,110,0.08), transparent 70%)' }} />

              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(201,169,110,0.12)' }}>
                  <item.icon className="w-5 h-5 text-golden" />
                </div>
                <h3 className="font-playfair font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm font-inter leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/agendar?servico=fiberbrows"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold font-inter text-base text-white transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #B76E79)', boxShadow: '0 8px 30px rgba(201,169,110,0.35)' }}
          >
            Agendar Agora
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/servicos/fiberbrows"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold font-inter text-base border border-golden/30 text-golden hover:border-golden hover:bg-golden/10 transition-all duration-300 backdrop-blur-sm"
          >
            Saber Mais
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
