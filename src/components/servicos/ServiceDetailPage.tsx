'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ArrowRight,
  Clock,
  RefreshCw,
  Shield,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import type { Service } from '@/data/services'
import SimuladorIA from '@/components/servicos/SimuladorIA'
import ServicoMediaGaleria from '@/components/servicos/ServicoMediaGaleria'
import { useServicosPrecos } from '@/lib/useServicosPrecos'

export default function ServiceDetailPage({ service }: { service: Service }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const precosFirestore = useServicosPrecos()

  return (
    <div className="pt-20">
      {/* Hero */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${service.color}20, ${service.color}05, #FDF8F5)` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-rose-gold transition-colors duration-200 mb-8 font-inter text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Serviços
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span
                className="inline-block text-sm font-semibold tracking-widest uppercase mb-4 font-inter"
                style={{ color: service.color }}
              >
                Dermopigmentação
              </span>
              <h1 className="font-playfair font-bold text-4xl md:text-5xl lg:text-6xl text-text-primary mb-6">
                {service.name}
              </h1>
              <p className="text-text-secondary font-inter text-lg leading-relaxed mb-8">
                {service.fullDescription}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Duração', value: service.duration, icon: Clock },
                  { label: 'Sessões', value: service.sessions, icon: RefreshCw },
                  { label: 'Resultado', value: service.duration_result, icon: Sparkles },
                  { label: 'Dor', value: service.painLevel, icon: Shield },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-xl p-4 shadow-card border border-cream-dark"
                    >
                      <Icon className="w-4 h-4 text-rose-gold mb-1" />
                      <p className="text-xs text-text-muted font-inter">{stat.label}</p>
                      <p className="text-sm font-semibold text-text-primary font-inter">
                        {stat.value}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <Link href="/agendar" className="btn-primary">
                  Agendar Este Serviço
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 font-semibold font-inter text-sm"
                  style={{ borderColor: service.color, color: service.color }}
                >
                  <Sparkles className="w-4 h-4" />
                  {precosFirestore[service.id] ?? service.priceRange}
                </span>
              </div>

              {/* Simulador IA */}
              <SimuladorIA servicoNome={service.name} />
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div
                className="rounded-3xl aspect-square max-w-md mx-auto relative overflow-hidden flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${service.color}30, ${service.color}60)` }}
              >
                <div className="text-center">
                  <div className="text-[120px] leading-none mb-4" style={{ color: `${service.color}80` }}>
                    {['✦', '◆', '◇', '❋'][['microblading', 'microshading', 'eyeliner', 'micropigmentacao-labial'].indexOf(service.slug)]}
                  </div>
                  <p className="font-playfair font-bold text-2xl text-white/80">{service.name}</p>
                </div>
                <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section ref={ref} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-cream rounded-2xl p-6"
            >
              <h3 className="font-playfair font-bold text-xl text-text-primary mb-4">
                Benefícios
              </h3>
              <ul className="space-y-3">
                {(service.benefits ?? []).map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-rose-gold mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary font-inter">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Ideal For */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-cream rounded-2xl p-6"
            >
              <h3 className="font-playfair font-bold text-xl text-text-primary mb-4">
                Indicado Para
              </h3>
              <ul className="space-y-3">
                {(service.idealFor ?? []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-golden mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary font-inter">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Procedure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-cream rounded-2xl p-6"
            >
              <h3 className="font-playfair font-bold text-xl text-text-primary mb-4">
                Como Funciona
              </h3>
              <ol className="space-y-3">
                {(service.procedure ?? []).map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: service.color }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-secondary font-inter">{step}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          {/* Recovery info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-rose-gold/5 border border-rose-gold/20 rounded-2xl p-6 flex items-start gap-4"
          >
            <AlertCircle className="w-6 h-6 text-rose-gold flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-text-primary font-inter mb-1">
                Período de Recuperação
              </h4>
              <p className="text-text-secondary text-sm font-inter">
                {service.recovery} — Deve evitar molhar a área, expor ao sol direto e aplicar
                maquilhagem durante os primeiros 7 dias. Instruções detalhadas são
                fornecidas após cada sessão.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Media Gallery */}
      <ServicoMediaGaleria servicoSlug={service.slug} accentColor={service.color} />

      {/* CTA */}
      <section className="py-16 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-playfair font-bold text-3xl text-text-primary mb-4">
            Pronta para Experimentar{' '}
            <span className="gradient-text">{service.name}?</span>
          </h2>
          <p className="text-text-secondary font-inter mb-8">
            Agende agora e dê o primeiro passo para a sua transformação.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contacto" className="btn-primary">
              Agendar Este Serviço
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.link/kwctpf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Perguntar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
