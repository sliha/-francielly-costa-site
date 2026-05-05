'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) setVisible(true)
    } catch {
      // localStorage not available (SSR or private mode)
    }
  }, [])

  const responder = (choice: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(STORAGE_KEY, choice)
      window.dispatchEvent(new CustomEvent('cookie_consent_changed', { detail: choice }))
    } catch {}
    setVisible(false)
    if (choice === 'accepted') {
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
                Utilizamos cookies para melhorar a sua experiência de navegação.{' '}
                <Link
                  href="/cookies"
                  className="text-rose-gold hover:underline"
                >
                  Saber mais
                </Link>
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => responder('rejected')}
                  className="px-4 py-2 rounded-xl border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 text-sm font-inter transition-all duration-200"
                >
                  Recusar
                </button>
                <button
                  onClick={() => responder('accepted')}
                  className="px-5 py-2 rounded-xl bg-rose-gold text-white font-semibold text-sm font-inter hover:bg-opacity-90 transition-all duration-200"
                >
                  Aceitar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
