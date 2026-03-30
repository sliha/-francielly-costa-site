'use client'

import { useState, useEffect } from 'react'
import { Instagram, X, ExternalLink } from 'lucide-react'

export default function InstagramPopup() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Mostrar popup após 45 segundos na página, apenas 1x por sessão
    if (sessionStorage.getItem('ig-popup-shown')) return

    const timer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem('ig-popup-shown', '1')
    }, 45000)

    return () => clearTimeout(timer)
  }, [])

  const fechar = () => {
    setVisible(false)
    setDismissed(true)
  }

  if (!visible || dismissed) return null

  return (
    <div className="fixed bottom-24 right-4 z-40 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-card-hover border border-cream-dark p-4 max-w-xs flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center flex-shrink-0">
          <Instagram size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-semibold text-sm font-inter">
            Novo resultado publicado!
          </p>
          <p className="text-text-secondary text-xs mt-0.5 font-inter">
            A Francielly partilhou um novo trabalho no Instagram ✨
          </p>
          <a
            href="https://www.instagram.com/franciellycostapmu"
            target="_blank"
            rel="noopener noreferrer"
            onClick={fechar}
            className="inline-flex items-center gap-1 text-rose-gold text-xs font-semibold mt-2 hover:underline"
          >
            Ver agora
            <ExternalLink size={11} />
          </a>
        </div>
        <button
          onClick={fechar}
          className="text-text-muted hover:text-text-secondary flex-shrink-0 mt-0.5"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
