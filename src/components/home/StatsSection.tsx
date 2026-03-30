'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Users, Clock, Layers, Trophy } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: 200,
    prefix: '+',
    suffix: '',
    label: 'Clientes Satisfeitas',
    description: 'e contando',
    color: 'rose-gold',
  },
  {
    icon: Clock,
    value: 8,
    prefix: '+',
    suffix: '',
    label: 'Anos de Experiência',
    description: 'de dedicação à arte',
    color: 'golden',
  },
  {
    icon: Layers,
    value: 4,
    prefix: '',
    suffix: '',
    label: 'Serviços Especializados',
    description: 'técnicas avançadas',
    color: 'rose-gold',
  },
  {
    icon: Trophy,
    value: 1,
    prefix: '',
    suffix: 'ª',
    label: 'Única em Portugal',
    description: 'com técnica exclusiva',
    color: 'golden',
  },
]

function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 })
  const startedRef = useRef(false)

  useEffect(() => {
    if (inView && !startedRef.current) {
      startedRef.current = true
      const startTime = performance.now()
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        setCount(Math.floor(eased * end))
        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          setCount(end)
        }
      }
      requestAnimationFrame(step)
    }
  }, [inView, end, duration])

  return <span ref={ref}>{count}</span>
}

export default function StatsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })

  return (
    <section ref={ref} className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-golden/30 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-gradient-rose-soft blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="section-tag">Resultados que Falam</span>
          <h2 className="section-title">
            Números que{' '}
            <span className="gradient-text">Inspiram Confiança</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-cream-dark overflow-hidden"
              >
                {/* Hover background */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    stat.color === 'rose-gold'
                      ? 'bg-gradient-to-br from-rose-gold/5 to-transparent'
                      : 'bg-gradient-to-br from-golden/5 to-transparent'
                  }`}
                />

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    stat.color === 'rose-gold'
                      ? 'bg-rose-gold/10'
                      : 'bg-golden/10'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      stat.color === 'rose-gold' ? 'text-rose-gold' : 'text-golden'
                    }`}
                  />
                </div>

                {/* Number */}
                <div className="mb-2">
                  <span
                    className={`font-playfair font-bold text-4xl lg:text-5xl ${
                      stat.color === 'rose-gold' ? 'text-rose-gold' : 'text-golden'
                    }`}
                  >
                    {stat.prefix}
                    <CountUp end={stat.value} />
                    {stat.suffix}
                  </span>
                </div>

                {/* Label */}
                <p className="font-semibold text-text-primary text-base font-inter mb-1">
                  {stat.label}
                </p>
                <p className="text-text-muted text-sm font-inter">
                  {stat.description}
                </p>

                {/* Bottom accent */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                    stat.color === 'rose-gold' ? 'bg-rose-gold' : 'bg-golden'
                  }`}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
