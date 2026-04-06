'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

interface MediaItem {
  id: string
  url: string
  tipo: 'antes' | 'depois'
  mediaType: 'foto' | 'video'
  label: string
}

interface Props {
  servicoSlug: string
  accentColor?: string
}

export default function ServicoMediaGaleria({ servicoSlug, accentColor = '#B76E79' }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [filter, setFilter] = useState<'todos' | 'antes' | 'depois'>('todos')

  useEffect(() => {
    if (!db) { setLoading(false); return }
    const q = query(
      collection(db, 'galeria'),
      where('servico', '==', servicoSlug),
      where('ativa', '==', true),
      orderBy('criadoEm', 'desc')
    )
    getDocs(q)
      .then((snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [servicoSlug])

  const filtered = filter === 'todos' ? items : items.filter((i) => i.tipo === filter)
  const fotos = filtered.filter((i) => i.mediaType !== 'video')
  const videos = filtered.filter((i) => i.mediaType === 'video')

  // navigation inside lightbox (only photos)
  const prevPhoto = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + fotos.length) % fotos.length)
  }
  const nextPhoto = () => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % fotos.length)
  }

  if (loading) return null
  if (items.length === 0) return null

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Images className="w-5 h-5" style={{ color: accentColor }} />
            <h2 className="font-playfair font-bold text-2xl text-text-primary">
              Galeria de Resultados
            </h2>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 bg-cream rounded-xl p-1">
            {(['todos', 'antes', 'depois'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium font-inter transition-all capitalize ${
                  filter === f ? 'bg-white shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'antes' ? 'Antes' : 'Depois'}
              </button>
            ))}
          </div>
        </div>

        {/* Videos */}
        {videos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-inter font-semibold text-sm text-text-muted uppercase tracking-wider mb-4">
              Vídeos Demonstração
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => (
                <div key={v.id} className="rounded-2xl overflow-hidden bg-black aspect-video shadow-card">
                  <video
                    src={v.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos grid */}
        {fotos.length > 0 && (
          <div>
            {videos.length > 0 && (
              <h3 className="font-inter font-semibold text-sm text-text-muted uppercase tracking-wider mb-4">
                Fotos de Resultados
              </h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {fotos.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-card"
                  onClick={() => setLightboxIndex(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`${item.label} - ${item.tipo}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-inter ${
                      item.tipo === 'antes'
                        ? 'bg-amber-400/20 text-amber-300'
                        : 'bg-emerald-400/20 text-emerald-300'
                    }`}>
                      {item.tipo === 'antes' ? 'Antes' : 'Depois'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && fotos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {fotos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                >
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
              className="max-w-3xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotos[lightboxIndex].url}
                alt={fotos[lightboxIndex].label}
                className="w-full h-full object-contain rounded-2xl max-h-[80vh]"
              />
              <p className="text-center text-white/50 text-sm font-inter mt-3">
                {lightboxIndex + 1} / {fotos.length} ·{' '}
                <span className={fotos[lightboxIndex].tipo === 'antes' ? 'text-amber-400' : 'text-emerald-400'}>
                  {fotos[lightboxIndex].tipo === 'antes' ? 'Antes' : 'Depois'}
                </span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
