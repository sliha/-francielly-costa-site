'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

interface Certificacao {
  id: string
  titulo: string
  descricao?: string
  fotoUrl?: string
  ordem?: number
}

export default function CertificacoesPage() {
  const [items, setItems] = useState<Certificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) { setLoading(false); return }
    getDocs(query(collection(db, 'certificacoes'), orderBy('ordem', 'asc')))
      .then((snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificacao)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-golden/15 mb-6">
              <Award className="w-7 h-7 text-golden" />
            </div>
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
              Formação & Credenciais
            </span>
            <h1 className="font-playfair font-bold text-4xl md:text-6xl text-white mb-6">
              Certificações{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}>
                & Formação
              </span>
            </h1>
            <p className="text-white/70 text-lg font-inter max-w-2xl mx-auto">
              Francielly Costa é especialista certificada em Portugal, com formação avançada em dermopigmentação
              reconhecida internacionalmente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-text-muted font-inter py-20">Certificações em breve.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  {item.fotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.fotoUrl} alt={item.titulo} className="w-full aspect-video object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-golden/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Award className="w-4.5 h-4.5 text-golden" size={18} />
                      </div>
                      <div>
                        <h3 className="font-playfair font-bold text-text-primary text-lg leading-snug">{item.titulo}</h3>
                        {item.descricao && (
                          <p className="text-text-secondary text-sm font-inter mt-1.5 leading-relaxed">{item.descricao}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
