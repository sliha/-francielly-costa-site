'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Alda Dias',
    text: 'Francielly uma fama mágica... Fica maravilhoso! Super recomendo, excelente profissional e atenciosa. As sobrancelhas ficaram perfeitas, exatamente como eu queria. Obrigada!',
    rating: 5,
    service: 'Microblading',
    initial: 'A',
  },
  {
    name: 'Cristiana Almeida',
    text: 'Tenho sido cliente há vários anos e nunca fiquei desapontada. A qualidade do trabalho é sempre impecável. A Francielly é uma artista verdadeira, atenciosa e profissional.',
    rating: 5,
    service: 'Microshading',
    initial: 'C',
  },
  {
    name: 'Maria Helena Castro Vidal Pinheiro',
    text: 'A Francielly é muito competente no seu trabalho, muito atenciosa e preocupada com o bem-estar das clientes. Recomendo vivamente a qualquer pessoa que procure qualidade.',
    rating: 5,
    service: 'Micropigmentação Labial',
    initial: 'M',
  },
  {
    name: 'Ana Couto',
    text: 'Já faço a sobrancelha com a Francielly há anos e nunca fico desiludida. Excelente profissional, muito cuidadosa e o resultado é sempre natural e perfeito.',
    rating: 5,
    service: 'Microblading',
    initial: 'A',
  },
  {
    name: 'Rita Faria',
    text: 'É um fenómeno! As sobrancelhas ficaram incríveis, super naturais. A Francielly é uma verdadeira artista. Não podia estar mais feliz com o resultado. 100% recomendado!',
    rating: 5,
    service: 'Microshading',
    initial: 'R',
  },
  {
    name: 'Regina',
    text: 'O melhor centro do Norte! A Francielly é simplesmente incrível. Profissionalismo, higiene impecável e resultados que superam todas as expectativas. Não trocaria por nada!',
    rating: 5,
    service: 'Eyeliner Permanente',
    initial: 'R',
  },
  {
    name: 'Thalita Cruz',
    text: 'Excelente profissional! Extremamente cuidadosa e atenciosa durante todo o processo. O resultado ficou maravilhoso, muito natural. Recomendo a toda a gente!',
    rating: 5,
    service: 'Microblading',
    initial: 'T',
  },
  {
    name: 'Lua Martins',
    text: 'O serviço é ótimo, a Francielly é muito profissional e atenciosa. As instalações são limpas e confortáveis. Fiz o microblading e adorei o resultado. Voltarei certamente!',
    rating: 5,
    service: 'Microblading',
    initial: 'L',
  },
]

const avatarColors = [
  'from-rose-gold to-rose-gold-dark',
  'from-golden to-golden-dark',
  'from-rose-gold-dark to-rose-gold',
  'from-golden-dark to-golden',
]

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  useEffect(() => {
    if (!autoplay) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [autoplay, next])

  // Show 3 visible: prev, current, next
  const getVisible = () => {
    const indices = []
    for (let i = -1; i <= 1; i++) {
      indices.push((current + i + testimonials.length) % testimonials.length)
    }
    return indices
  }

  const visibleIndices = getVisible()

  return (
    <section ref={ref} className="py-24 bg-dark-bg relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-rose-gold/5 blur-3xl" />

      {/* Large quote mark */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-5">
        <Quote className="w-64 h-64 text-white" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
            Depoimentos
          </span>
          <h2 className="font-playfair font-bold text-4xl md:text-5xl text-white mb-4">
            O Que Dizem as{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}
            >
              Nossas Clientes
            </span>
          </h2>
          <div className="w-16 h-0.5 bg-golden mx-auto my-4" />
          <p className="text-white/60 text-lg font-inter max-w-xl mx-auto">
            Histórias reais de transformação e confiança
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
          onMouseEnter={() => setAutoplay(false)}
          onMouseLeave={() => setAutoplay(true)}
        >
          {/* Desktop: 3 cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {visibleIndices.map((idx, position) => {
              const testimonial = testimonials[idx]
              const isCenter = position === 1
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.6, scale: 0.95 }}
                  animate={{
                    opacity: isCenter ? 1 : 0.6,
                    scale: isCenter ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`bg-dark-card rounded-2xl p-6 lg:p-8 border transition-all duration-300 ${
                    isCenter
                      ? 'border-rose-gold/40 shadow-rose'
                      : 'border-white/10'
                  }`}
                >
                  <TestimonialCard testimonial={testimonial} index={idx} />
                </motion.div>
              )
            })}
          </div>

          {/* Mobile: single card */}
          <div className="md:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.35 }}
                className="bg-dark-card rounded-2xl p-6 border border-rose-gold/30"
              >
                <TestimonialCard testimonial={testimonials[current]} index={current} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-rose-gold hover:text-rose-gold hover:bg-rose-gold/10 transition-all duration-200"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? 'bg-rose-gold w-6 h-2'
                      : 'bg-white/20 w-2 h-2 hover:bg-white/40'
                  }`}
                  aria-label={`Ir para depoimento ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-rose-gold hover:text-rose-gold hover:bg-rose-gold/10 transition-all duration-200"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0]
  index: number
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Stars */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-golden fill-golden" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-white/80 text-sm font-inter leading-relaxed flex-1 mb-6 italic">
        "{testimonial.text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${
            avatarColors[index % avatarColors.length]
          }`}
        >
          {testimonial.initial}
        </div>
        <div>
          <p className="text-white font-semibold text-sm font-inter">
            {testimonial.name}
          </p>
          <p className="text-golden text-xs font-inter">{testimonial.service}</p>
        </div>
      </div>
    </div>
  )
}
