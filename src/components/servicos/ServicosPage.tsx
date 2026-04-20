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
} from 'lucide-react'
import { services } from '@/data/services'
import { useServicosPrecos } from '@/lib/useServicosPrecos'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface ServicoInfo { id: string; fotoUrl?: string }

export default function ServicosPage() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const precosFirestore = useServicosPrecos()
  const [servicosInfo, setServicosInfo] = useState<Record<string, ServicoInfo>>({})

  useEffect(() => {
    if (!db) return
    getDoc(doc(db, 'settings', 'servicos')).then((snap) => {
      if (!snap.exists()) return
      const lista = snap.data().lista
      if (!Array.isArray(lista)) return
      const map: Record<string, ServicoInfo> = {}
      for (const s of lista) { if (s.id) map[s.id] = s }
      setServicosInfo(map)
    }).catch(() => {})
  }, [])

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215] relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-gold/5 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
              Especialidades
            </span>
            <h1 className="font-playfair font-bold text-4xl md:text-6xl text-white mb-6">
              Os Nossos{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}
              >
                Serviços
              </span>
            </h1>
            <p className="text-white/70 text-lg font-inter max-w-2xl mx-auto">
              Técnicas avançadas de dermopigmentação para realçar a sua beleza
              natural com resultados duradouros e personalizados.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section ref={ref} className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {services.map((service, i) => (
              <motion.div
                key={service.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 grid grid-cols-1 lg:grid-cols-2 ${
                  i % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Visual side */}
                <div
                  className={`relative min-h-[300px] flex items-center justify-center ${
                    i % 2 === 1 ? 'lg:col-start-2' : ''
                  } ${servicosInfo[service.id]?.fotoUrl ? 'p-0 overflow-hidden' : 'p-12'}`}
                  style={servicosInfo[service.id]?.fotoUrl ? {} : {
                    background: `linear-gradient(135deg, ${service.color}20, ${service.color}40)`,
                  }}
                >
                  {servicosInfo[service.id]?.fotoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={servicosInfo[service.id].fotoUrl}
                        alt={service.name}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      <div className="relative z-10 text-center p-8 bg-black/40 w-full h-full flex flex-col items-center justify-center">
                        <h2 className="font-playfair font-bold text-3xl text-white mb-2">
                          {service.name}
                        </h2>
                        <p className="font-semibold text-xl font-inter text-white/90">
                          {precosFirestore[service.id] ?? service.priceRange}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div
                        className="text-8xl mb-4 block"
                        style={{ color: service.color }}
                      >
                        {['✦', '◆', '◇', '❋'][i]}
                      </div>
                      <h2 className="font-playfair font-bold text-3xl text-text-primary mb-2">
                        {service.name}
                      </h2>
                      <p
                        className="font-semibold text-xl font-inter"
                        style={{ color: service.color }}
                      >
                        {precosFirestore[service.id] ?? service.priceRange}
                      </p>
                    </div>
                  )}

                  {/* Corner decorations (only without photo) */}
                  {!servicosInfo[service.id]?.fotoUrl && (
                    <>
                      <div
                        className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 rounded-tl-lg opacity-40"
                        style={{ borderColor: service.color }}
                      />
                      <div
                        className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 rounded-br-lg opacity-40"
                        style={{ borderColor: service.color }}
                      />
                    </>
                  )}
                </div>

                {/* Content side */}
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <h3 className="font-playfair font-bold text-2xl text-text-primary mb-3">
                    {service.name}
                  </h3>
                  <p className="text-text-secondary font-inter leading-relaxed mb-6">
                    {service.fullDescription}
                  </p>

                  {/* Quick info */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm font-inter text-text-secondary">
                      <Clock className="w-4 h-4 text-rose-gold flex-shrink-0" />
                      <span>{service.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-inter text-text-secondary">
                      <RefreshCw className="w-4 h-4 text-golden flex-shrink-0" />
                      <span>{service.sessions}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-inter text-text-secondary">
                      <Shield className="w-4 h-4 text-rose-gold flex-shrink-0" />
                      <span>Dor: {service.painLevel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-inter text-text-secondary">
                      <Sparkles className="w-4 h-4 text-golden flex-shrink-0" />
                      <span>Dura: {service.duration_result}</span>
                    </div>
                  </div>

                  {/* Benefits preview */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted font-inter mb-2">
                      Benefícios Principais
                    </p>
                    <div className="space-y-1">
                      {(service.benefits ?? []).slice(0, 3).map((benefit, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-rose-gold flex-shrink-0" />
                          <span className="text-sm text-text-secondary font-inter">
                            {benefit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/servicos/${service.slug}`}
                      className="btn-primary text-sm px-6 py-2.5"
                    >
                      Saber Mais
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/agendar"
                      className="btn-outline text-sm px-6 py-2.5"
                    >
                      Agendar
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-rose">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-playfair font-bold text-3xl md:text-4xl text-white mb-4">
            Pronta para a sua Transformação?
          </h2>
          <p className="text-white/80 font-inter mb-8 text-lg">
            Agende uma consulta gratuita e descubra o tratamento ideal para si.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-gold font-semibold rounded-full hover:bg-cream transition-all duration-300 hover:-translate-y-0.5 shadow-lg font-inter"
            >
              Agendar Agora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.link/kwctpf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/50 text-white font-semibold rounded-full hover:border-white hover:bg-white/10 transition-all duration-300 font-inter"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
