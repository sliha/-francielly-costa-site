'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { readConsent, saveConsent, type CookieConsent } from '@/lib/consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [personalizar, setPersonalizar] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(true)

  useEffect(() => {
    if (!readConsent()) setVisible(true)
  }, [])

  const responder = (consent: CookieConsent) => {
    saveConsent(consent)
    setVisible(false)
    if (consent.analytics || consent.marketing) {
      setTimeout(() => window.location.reload(), 150)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[60] bg-dark-bg border-t border-white/10 shadow-2xl"
          role="dialog"
          aria-label="Aviso de cookies"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <p className="text-white/70 text-sm font-inter flex-1 leading-relaxed">
                Utilizamos cookies essenciais e, com o seu consentimento, cookies de estatísticas
                e de marketing.{' '}
                <Link href="/cookies" className="text-rose-gold hover:underline">
                  Saber mais
                </Link>
              </p>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setPersonalizar((v) => !v)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white/90 text-sm font-inter transition-all duration-200 underline-offset-4 hover:underline"
                  aria-expanded={personalizar}
                >
                  Personalizar
                </button>
                <button
                  onClick={() => responder({ analytics: false, marketing: false })}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 text-sm font-inter transition-all duration-200"
                >
                  Recusar
                </button>
                <button
                  onClick={() => responder({ analytics: true, marketing: true })}
                  className="px-5 py-2 rounded-xl bg-rose-gold text-white font-semibold text-sm font-inter hover:bg-opacity-90 transition-all duration-200"
                >
                  Aceitar tudo
                </button>
              </div>
            </div>

            {personalizar && (
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 sm:items-center">
                <label className="flex items-center gap-3 text-sm text-white/70 font-inter cursor-pointer">
                  <input type="checkbox" checked disabled className="accent-rose-gold w-4 h-4" />
                  Essenciais <span className="text-white/40">(sempre ativos)</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-white/70 font-inter cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="accent-rose-gold w-4 h-4"
                  />
                  Estatísticas <span className="text-white/40">(Google Analytics)</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-white/70 font-inter cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="accent-rose-gold w-4 h-4"
                  />
                  Marketing <span className="text-white/40">(Meta, Google Ads)</span>
                </label>
                <button
                  onClick={() => responder({ analytics, marketing })}
                  className="sm:ml-auto px-5 py-2 rounded-xl border border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-white font-semibold text-sm font-inter transition-all duration-200"
                >
                  Guardar escolha
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
