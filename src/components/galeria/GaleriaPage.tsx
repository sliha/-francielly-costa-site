'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { X, ZoomIn, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const categories = [
  { id: 'fiberbrows', label: 'FiberBROWS' },
  { id: 'tricopigmentacao', label: 'Tricopigmentação' },
  { id: 'microblading', label: 'Microblading' },
  { id: 'microshading', label: 'Microshading' },
  { id: 'eyeliner', label: 'Eyeliner' },
  { id: 'labial', label: 'Labial' },
]

const servicoLabels: Record<string, string> = {
  fiberbrows: 'FiberBROWS',
  tricopigmentacao: 'Tricopigmentação',
  microblading: 'Microblading',
  microshading: 'Microshading',
  eyeliner: 'Eyeliner',
  labial: 'Labial',
}

interface MediaItem {
  id: string
  url: string
  servico: string
  tipo: 'antes' | 'depois'
  mediaType?: 'foto' | 'video'
  label: string
  criadoEm?: string | null
}

// Placeholder items shown when no real media is uploaded yet
const placeholders: MediaItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: `placeholder_${i}`,
  url: '',
  servico: ['microblading', 'microshading', 'eyeliner', 'labial', 'microblading', 'microshading', 'eyeliner', 'labial'][i],
  tipo: i % 2 === 0 ? 'antes' : 'depois',
  label: ['Microblading Natural', 'Microshading Suave', 'Eyeliner Clássico', 'Labial Nude', 'Microblading Definido', 'Microshading Volume', 'Eyeliner Marcado', 'Labial Rosa'][i],
}))

export default function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState('fiberbrows')
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    supabase
      .from('galeria')
      // Apenas as colunas usadas — payload menor à medida que a galeria cresce.
      .select('id, url, servico, tipo, media_type, label, criado_em')
      .eq('ativa', true)
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[Galeria] erro ao carregar:', error)
        } else {
          const docs: MediaItem[] = (data ?? []).map((d) => ({
            id: d.id,
            url: d.url,
            servico: d.servico,
            tipo: d.tipo,
            mediaType: d.media_type ?? undefined,
            label: d.label,
            criadoEm: d.criado_em ?? null,
          }))
          setItems(docs)
        }
        setLoading(false)
      })
  }, [])

  const displayItems = items.length > 0 ? items : placeholders
  const isPlaceholder = items.length === 0

  const filtered = displayItems.filter((item) => item.servico === activeCategory)

  const photos = filtered.filter((i) => i.mediaType !== 'video')
  const videos = filtered.filter((i) => i.mediaType === 'video')

  const prevPhoto = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)
  }
  const nextPhoto = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % photos.length)
  }

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
              Portfólio
            </span>
            <h1 className="font-playfair font-bold text-4xl md:text-6xl text-white mb-6">
              A Nossa{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}>
                Galeria
              </span>
            </h1>
            <p className="text-white/70 text-lg font-inter max-w-2xl mx-auto">
              Cada trabalho é único. Conheça algumas das transformações realizadas
              pelo estúdio de Francielly Costa em Braga.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery */}
      <section ref={ref} className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-semibold font-inter transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-rose-gold text-white shadow-rose'
                    : 'bg-white text-text-secondary hover:bg-rose-gold/10 hover:text-rose-gold border border-cream-dark'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Videos */}
              {videos.length > 0 && (
                <div className="mb-10">
                  <h3 className="font-inter font-semibold text-sm text-text-muted uppercase tracking-wider mb-4">
                    Vídeos Demonstração
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {videos.map((v) => (
                      <div key={v.id} className="rounded-2xl overflow-hidden bg-black aspect-video shadow-card">
                        <video src={v.url} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {photos.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer shadow-card"
                      onClick={() => !isPlaceholder && setLightboxIndex(i)}
                    >
                      {item.url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.label}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute bottom-2 left-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-inter ${
                              item.tipo === 'antes' ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                            }`}>
                              {item.tipo === 'antes' ? 'Antes' : 'Depois'}
                            </span>
                          </div>
                        </>
                      ) : (
                        // Placeholder gradient
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-gold/20 to-golden/30 flex items-end p-3">
                          <p className="text-white/60 text-xs font-inter">{item.label}</p>
                        </div>
                      )}

                      {/* Service label */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 text-white font-inter">
                          {servicoLabels[item.servico] ?? item.servico}
                        </span>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        {item.url && (
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-rose-gold" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {isPlaceholder && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-center text-text-muted text-sm font-inter mt-8"
                >
                  * Fotos reais serão adicionadas à medida que os trabalhos são realizados.
                </motion.p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex]?.url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            {photos.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prevPhoto() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextPhoto() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].label}
                className="w-full object-contain rounded-2xl max-h-[80vh]"
              />
              <p className="text-center text-white/50 text-sm font-inter mt-3">
                {lightboxIndex + 1} / {photos.length} ·{' '}
                <span className="text-white/70">{servicoLabels[photos[lightboxIndex].servico] ?? photos[lightboxIndex].servico}</span>
                {' · '}
                <span className={photos[lightboxIndex].tipo === 'antes' ? 'text-amber-400' : 'text-emerald-400'}>
                  {photos[lightboxIndex].tipo === 'antes' ? 'Antes' : 'Depois'}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
