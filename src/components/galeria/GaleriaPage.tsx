'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { X, ZoomIn } from 'lucide-react'

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'microblading', label: 'Microblading' },
  { id: 'microshading', label: 'Microshading' },
  { id: 'eyeliner', label: 'Eyeliner' },
  { id: 'labial', label: 'Labial' },
]

const galleryItems = [
  { id: 1, category: 'microblading', fromColor: 'from-rose-gold/20', toColor: 'to-rose-gold/50', label: 'Microblading Natural' },
  { id: 2, category: 'microshading', fromColor: 'from-golden/20', toColor: 'to-golden/50', label: 'Microshading Suave' },
  { id: 3, category: 'eyeliner', fromColor: 'from-rose-gold-dark/20', toColor: 'to-rose-gold-dark/50', label: 'Eyeliner Clássico' },
  { id: 4, category: 'labial', fromColor: 'from-rose-gold/30', toColor: 'to-golden/40', label: 'Labial Nude' },
  { id: 5, category: 'microblading', fromColor: 'from-golden/20', toColor: 'to-rose-gold/40', label: 'Microblading Definido' },
  { id: 6, category: 'microshading', fromColor: 'from-rose-gold/25', toColor: 'to-golden/45', label: 'Microshading Volume' },
  { id: 7, category: 'eyeliner', fromColor: 'from-golden/25', toColor: 'to-rose-gold/45', label: 'Eyeliner Marcado' },
  { id: 8, category: 'labial', fromColor: 'from-rose-gold/20', toColor: 'to-rose-gold-dark/50', label: 'Labial Rosa' },
  { id: 9, category: 'microblading', fromColor: 'from-rose-gold-dark/20', toColor: 'to-golden/40', label: 'Microblading Arco' },
  { id: 10, category: 'microshading', fromColor: 'from-golden/30', toColor: 'to-rose-gold/50', label: 'Microshading Natural' },
  { id: 11, category: 'eyeliner', fromColor: 'from-rose-gold/20', toColor: 'to-golden/40', label: 'Eyeliner Fino' },
  { id: 12, category: 'labial', fromColor: 'from-golden/20', toColor: 'to-rose-gold/50', label: 'Labial Coral' },
]

export default function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [lightboxItem, setLightboxItem] = useState<(typeof galleryItems)[0] | null>(null)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const filtered =
    activeCategory === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory)

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
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}
              >
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

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer"
                  onClick={() => setLightboxItem(item)}
                >
                  {/* Placeholder image */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.fromColor} ${item.toColor} transition-transform duration-500 group-hover:scale-105`}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-rose-gold" />
                      </div>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-semibold font-inter">
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center text-text-muted text-sm font-inter mt-8"
          >
            * Estas são imagens representativas. Fotos reais de clientes serão
            adicionadas com o devido consentimento.
          </motion.p>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxItem(null)}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-200"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="max-w-lg w-full aspect-square rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`w-full h-full bg-gradient-to-br ${lightboxItem.fromColor} ${lightboxItem.toColor} flex items-end`}
              >
                <div className="p-6 bg-gradient-to-t from-black/50 to-transparent w-full">
                  <p className="text-white font-playfair font-bold text-xl">
                    {lightboxItem.label}
                  </p>
                  <p className="text-white/70 text-sm font-inter capitalize">
                    {lightboxItem.category}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
