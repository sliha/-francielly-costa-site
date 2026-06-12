'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Instagram, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const INSTAGRAM_URL = 'https://www.instagram.com/franciellycostamaster'

const servicosConfig = [
  {
    servico: 'microblading',
    label: 'Microblading',
    caption: 'Microblading natural e elegante ✨ Resultado que dura anos!',
  },
  {
    servico: 'labial',
    label: 'Micropigmentação Labial',
    caption: 'Lábios perfeitos com micropigmentação 💋 Cor natural e duradoura',
  },
  {
    servico: 'microshading',
    label: 'Microshading',
    caption: 'Microshading para um look perfeito todos os dias ✨',
  },
]

interface GaleriaItem {
  url: string
  servico: string
  criadoEm?: string | null
}

export default function InstagramSection() {
  const [photosByService, setPhotosByService] = useState<Record<string, GaleriaItem>>({})
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-100px' })

  useEffect(() => {
    supabase
      .from('galeria')
      .select('url, servico, criado_em')
      .eq('ativa', true)
      .in('servico', servicosConfig.map((s) => s.servico))
      .order('criado_em', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (error) {
          console.error('[InstagramSection] erro:', error)
        } else {
          const all: GaleriaItem[] = (data ?? []).map((d) => ({
            url: d.url,
            servico: d.servico,
            criadoEm: d.criado_em ?? null,
          }))
          const byService: Record<string, GaleriaItem> = {}
          for (const svc of servicosConfig) {
            const photos = all
              .filter((item) => item.servico === svc.servico && item.url)
              .sort((a, b) => (b.criadoEm ?? '').localeCompare(a.criadoEm ?? ''))
            if (photos.length > 0) byService[svc.servico] = photos[0]
          }
          setPhotosByService(byService)
        }
        setLoading(false)
      })
  }, [])

  const visibleCards = servicosConfig.filter((s) => photosByService[s.servico])

  // Não mostrar a secção se não houver fotos reais
  if (!loading && visibleCards.length === 0) return null

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

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-gold/10 to-golden/10 border border-rose-gold/20 rounded-full px-5 py-2.5 mb-4 hover:border-rose-gold/40 transition-colors"
          >
            <Instagram size={14} className="text-rose-gold" />
            <p className="text-text-secondary font-inter text-sm">
              <span className="text-rose-gold font-semibold">@franciellycostamaster</span>
            </p>
          </a>

          <p className="text-text-secondary font-inter max-w-xl mx-auto">
            Veja os resultados reais das nossas clientes e inspire-se para a sua transformação.
          </p>
        </motion.div>

        {/* Grid de posts */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className={`grid gap-3 md:gap-4 mb-8 ${
              visibleCards.length === 1
                ? 'grid-cols-1 max-w-sm mx-auto'
                : visibleCards.length === 2
                ? 'grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-2 md:grid-cols-3'
            }`}
          >
            {visibleCards.map((svc, i) => {
              const item = photosByService[svc.servico]
              return (
                <motion.a
                  key={svc.servico}
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={item.url}
                    alt={`${svc.label} — trabalho real de Francielly Costa em Braga`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Tag do serviço */}
                  <div className="absolute top-3 left-3">
                    <span className="text-xs bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-full">
                      {svc.label}
                    </span>
                  </div>

                  {/* Overlay no hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex flex-col items-center justify-center gap-2 transition-all duration-300">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-4">
                      <Instagram size={24} className="text-white mx-auto mb-2" />
                      <p className="text-white/90 text-xs leading-relaxed">{svc.caption}</p>
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {!loading && visibleCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-gold to-golden text-white font-semibold font-inter px-8 py-3.5 rounded-full hover:shadow-rose-lg transition-all duration-300 hover:scale-105"
            >
              <Instagram size={18} />
              Ver no Instagram
              <ExternalLink size={14} />
            </a>
          </motion.div>
        )}
      </div>
    </section>
  )
}
