'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MoveHorizontal } from 'lucide-react'

const comparisons = [
  {
    title: 'Microblading',
    description: 'Sobrancelhas naturais com fios perfeitos',
    beforeColor: 'from-stone-300 to-stone-400',
    afterColor: 'from-rose-gold/40 to-rose-gold/70',
  },
  {
    title: 'Microshading',
    description: 'Volume e definição com efeito sombra',
    beforeColor: 'from-stone-200 to-stone-350',
    afterColor: 'from-golden/40 to-golden/70',
  },
  {
    title: 'Eyeliner Permanente',
    description: 'Olhar definido e marcante todos os dias',
    beforeColor: 'from-slate-200 to-slate-300',
    afterColor: 'from-rose-gold-dark/40 to-rose-gold/60',
  },
]

function ComparisonSlider({
  title,
  description,
  beforeColor,
  afterColor,
}: {
  title: string
  description: string
  beforeColor: string
  afterColor: string
}) {
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(5, Math.min(95, x)))
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(5, Math.min(95, x)))
  }

  return (
    <div className="space-y-3">
      <div
        className="relative rounded-2xl overflow-hidden aspect-[4/5] cursor-ew-resize select-none"
        onMouseMove={handleMouseMove}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
      >
        {/* Before (full width base) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${beforeColor} flex items-center justify-center`}>
          <div className="text-center">
            <p className="text-white/80 font-inter text-sm font-medium">Antes</p>
          </div>
        </div>

        {/* After (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${afterColor} flex items-center justify-center`}>
            <div className="text-center">
              <p className="text-white font-inter text-sm font-medium">Depois</p>
            </div>
          </div>
          {/* After label */}
          <div className="absolute bottom-3 right-3 bg-rose-gold text-white text-xs font-semibold px-2.5 py-1 rounded-full font-inter">
            Depois
          </div>
        </div>

        {/* Before label */}
        <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full font-inter backdrop-blur-sm">
          Antes
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${position}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <MoveHorizontal className="w-5 h-5 text-rose-gold" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-playfair font-semibold text-lg text-text-primary">
          {title}
        </h3>
        <p className="text-text-secondary text-sm font-inter mt-1">{description}</p>
      </div>
    </div>
  )
}

export default function BeforeAfterSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 bg-cream-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-gold/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-tag">Resultados Reais</span>
          <h2 className="section-title mb-4">
            Transformações{' '}
            <span className="gradient-text">Incríveis</span>
          </h2>
          <div className="divider-rose" />
          <p className="section-subtitle max-w-xl mx-auto mt-4">
            Arraste o cursor para ver a diferença antes e depois de cada
            tratamento de dermopigmentação.
          </p>
        </motion.div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {comparisons.map((comp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <ComparisonSlider {...comp} />
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-text-muted text-sm font-inter mt-8"
        >
          * Imagens representativas. Resultados reais disponíveis na galeria.
        </motion.p>
      </div>
    </section>
  )
}
