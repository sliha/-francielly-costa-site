'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Star, Award, Sparkles } from 'lucide-react'

const floatingElements = [
  { top: '15%', left: '8%', delay: 0 },
  { top: '70%', left: '5%', delay: 1 },
  { top: '25%', right: '10%', delay: 0.5 },
  { top: '65%', right: '7%', delay: 1.5 },
]

function scrollToFiberBROWS() {
  document.getElementById('fiberbrows-highlight')?.scrollIntoView({ behavior: 'smooth' })
}

function openChat() {
  window.dispatchEvent(new Event('openChat'))
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2a1a1f] via-[#1a1215] to-[#0d0a0b]" />

      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-rose-gold/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-golden/8 blur-[60px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-gold/5 blur-[100px]" />

      {/* Floating particles */}
      {mounted &&
        floatingElements.map((el, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-golden/60"
            style={{ top: el.top, left: el.left, right: (el as any).right }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 4,
              delay: el.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Vertical lines decoration */}
      <div className="absolute left-6 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-rose-gold/30 to-transparent hidden lg:block" />
      <div className="absolute right-6 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-golden/30 to-transparent hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center pt-20">

        {/* FiberBROWS animated banner */}
        <motion.button
          onClick={scrollToFiberBROWS}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 rounded-full border border-golden/50 bg-golden/15 mb-4 cursor-pointer hover:border-golden hover:bg-golden/25 transition-all duration-300 group"
        >
          <motion.span
            className="text-sm"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            ✨
          </motion.span>
          <span className="text-golden text-[10px] sm:text-xs font-bold tracking-[0.12em] sm:tracking-[0.18em] uppercase font-inter">
            Novo em Portugal — FiberBROWS
          </span>
          <ArrowRight className="w-3 h-3 text-golden group-hover:translate-x-0.5 transition-transform" />
        </motion.button>

        {/* Badge */}
        <Link href="/certificacoes">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-golden/30 bg-golden/10 mb-6 hover:border-golden/60 hover:bg-golden/20 transition-all duration-300 cursor-pointer"
          >
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-golden" />
            <span className="text-golden text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase font-inter">
              Especialista Certificada em Portugal
            </span>
          </motion.div>
        </Link>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-playfair font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight mb-4"
        >
          Dermopigmentação{' '}
          <span className="block mt-1">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #B76E79 0%, #C9A96E 60%, #B76E79 100%)',
                backgroundSize: '200%',
              }}
            >
              Avançada
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-2 font-inter leading-relaxed"
        >
          Arte e precisão ao serviço da sua beleza natural.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.52 }}
          className="text-golden/80 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10 font-inter font-medium"
        >
          Primeira profissional certificada em FiberBROWS em Portugal
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16"
        >
          <button
            onClick={scrollToFiberBROWS}
            className="group inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-rose text-white font-semibold rounded-full shadow-rose-lg hover:shadow-rose hover:-translate-y-1 transition-all duration-300 font-inter text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            Descubra a FiberBROWS
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          </button>
          <button
            onClick={openChat}
            className="group inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 border-2 border-white/30 text-white font-semibold rounded-full hover:border-golden hover:text-golden transition-all duration-300 font-inter text-sm sm:text-base backdrop-blur-sm w-full sm:w-auto justify-center"
          >
            Agendar com a Sofia
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-16"
        >
          {[
            { value: '+2300', label: 'Clientes Satisfeitas' },
            { value: '+8', label: 'Anos de Experiência' },
            { value: '5', label: 'Serviços Especializados' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-playfair font-bold text-3xl text-white mb-1">
                {stat.value}
              </p>
              <p className="text-white/50 text-sm font-inter tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Review Stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.05 }}
          className="flex items-center justify-center gap-2 mb-16"
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-golden fill-golden" />
            ))}
          </div>
          <span className="text-white/60 text-sm font-inter">
            5.0 — Avaliações verificadas do Google
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs font-inter tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  )
}
