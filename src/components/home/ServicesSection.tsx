'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Clock, RefreshCw, Sparkles } from 'lucide-react'
import { services } from '@/data/services'

const iconComponents = ['✦', '◆', '◇', '❋']

export default function ServicesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} id="servicos" className="py-24 bg-cream relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-rose-gold/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-golden/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-tag">Especialidades</span>
          <h2 className="section-title mb-4">
            Os Nossos{' '}
            <span className="gradient-text">Serviços</span>
          </h2>
          <div className="divider-rose" />
          <p className="section-subtitle max-w-2xl mx-auto mt-4">
            Técnicas avançadas de dermopigmentação para realçar a sua beleza
            natural com resultados que duram anos.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 flex flex-col"
            >
              {/* Top color bar */}
              <div
                className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
                style={{ background: `linear-gradient(90deg, ${service.color}, ${i % 2 === 0 ? '#C9A96E' : '#B76E79'})` }}
              />

              {/* Card content */}
              <div className="p-6 flex flex-col flex-1">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${service.color}15` }}
                >
                  <span style={{ color: service.color }}>{iconComponents[i]}</span>
                </div>

                {/* Title */}
                <h3 className="font-playfair font-bold text-xl text-text-primary mb-3 group-hover:text-rose-gold transition-colors duration-300">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-text-secondary text-sm font-inter leading-relaxed mb-5 flex-1">
                  {service.shortDescription}
                </p>

                {/* Meta info */}
                <div className="space-y-2 mb-5 pb-5 border-b border-cream-dark">
                  <div className="flex items-center gap-2 text-xs text-text-secondary font-inter">
                    <Clock className="w-3.5 h-3.5 text-rose-gold flex-shrink-0" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary font-inter">
                    <RefreshCw className="w-3.5 h-3.5 text-golden flex-shrink-0" />
                    <span>{service.sessions}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold font-inter" style={{ color: service.color }}>
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{service.priceRange}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/servicos/${service.slug}`}
                  className="group/btn flex items-center justify-between w-full text-sm font-semibold font-inter transition-colors duration-300"
                  style={{ color: service.color }}
                >
                  <span>Saber Mais</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>

              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(circle at top right, ${service.color}08, transparent 60%)`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/servicos" className="btn-outline">
            Ver Todos os Serviços
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
