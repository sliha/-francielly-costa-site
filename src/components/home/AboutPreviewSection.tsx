'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, CheckCircle, Award, Globe, GraduationCap } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const credentials = [
  { icon: Award, text: 'Formação em Milão, Itália' },
  { icon: GraduationCap, text: 'Master PMU Certificada' },
  { icon: Globe, text: 'J MED Stria Repair Specialist' },
  { icon: CheckCircle, text: '+8 anos de experiência' },
]

const DEFAULTS = {
  titulo: 'Sobre Francielly',
  subtitulo: 'Paixão pela Arte de Realçar Beleza',
  texto: 'Com mais de 8 anos de experiência em dermopigmentação avançada, Francielly Costa é reconhecida como uma das profissionais mais conceituadas do Norte de Portugal, com formação de excelência realizada em Milão, Itália.\n\nA sua missão é transformar a vida das suas clientes através de técnicas de precisão artística, proporcionando beleza natural e duradoura que respeita as características únicas de cada rosto.',
  fotoUrl: '',
}

export default function AboutPreviewSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 })
  const [data, setData] = useState(DEFAULTS)

  useEffect(() => {
    if (!db) return
    getDoc(doc(db, 'settings', 'homepage-about')).then((snap) => {
      if (snap.exists()) setData({ ...DEFAULTS, ...snap.data() })
    }).catch(() => {})
  }, [])

  return (
    <section ref={ref} className="py-24 bg-white relative overflow-hidden">
      {/* Decorations */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-rose-gold/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-golden/5 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="section-tag">{data.titulo}</span>
            <h2 className="section-title mb-6">
              <span className="gradient-text">{data.subtitulo}</span>
            </h2>
            <div className="divider-rose-left" />

            {data.texto.split('\n\n').map((para, i) => (
              <p key={i} className={`text-text-secondary font-inter leading-relaxed ${i < data.texto.split('\n\n').length - 1 ? 'mb-4' : 'mb-8'} mt-6`}>
                {para}
              </p>
            ))}

            {/* Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {credentials.map((cred, i) => {
                const Icon = cred.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-cream hover:bg-cream-dark transition-colors duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-rose flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-primary font-inter">
                      {cred.text}
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <Link href="/sobre" className="btn-primary inline-flex">
              Conhecer Mais
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Photo Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Main photo */}
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] max-w-md mx-auto">
              {data.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.fotoUrl} alt={data.titulo}
                  className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-gold/20 via-rose-gold/40 to-golden/30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                      <Award className="w-12 h-12 text-white/80" />
                    </div>
                    <p className="text-white/80 font-playfair text-xl text-center px-8">
                      Francielly Costa
                    </p>
                    <p className="text-white/60 text-sm text-center px-8 font-inter">
                      Dermopigmentação Avançada
                    </p>
                  </div>
                </>
              )}

              {/* Decorative corners */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-xl" />
            </div>

            {/* Floating badge - Experience */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 top-1/4 bg-white rounded-2xl shadow-card p-4 max-w-[160px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-rose-gold/10 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-rose-gold" />
                </div>
                <span className="font-playfair font-bold text-2xl text-rose-gold">+8</span>
              </div>
              <p className="text-xs text-text-secondary font-inter leading-tight">
                Anos de Experiência
              </p>
            </motion.div>

            {/* Floating badge - Clients */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-4 bottom-1/4 bg-white rounded-2xl shadow-card p-4 max-w-[160px]"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-golden/10 flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-golden" />
                </div>
                <span className="font-playfair font-bold text-2xl text-golden">+200</span>
              </div>
              <p className="text-xs text-text-secondary font-inter leading-tight">
                Clientes Felizes
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
