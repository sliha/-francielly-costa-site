'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    const dismissed = sessionStorage.getItem('fc-admin-install-dismissed')
    if (dismissed) return

    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('fc-admin-install-dismissed', '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-gradient-to-r from-[#2A2A2A] to-[#1A1A1A] border-b border-rose-gold/20 px-4 py-3"
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* FC icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm font-playfair">FC</span>
            </div>

            {/* Message */}
            <p className="text-white/80 text-xs flex-1 leading-relaxed">
              Instale a app{' '}
              <strong className="text-white">FC Admin</strong> no seu telemóvel
              para receber notificações de novas marcações e gerir a agenda
              rapidamente.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1 bg-rose-gold text-white text-xs px-3 py-1.5 rounded-full font-medium hover:bg-opacity-90 transition-colors"
              >
                <Download size={12} />
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/40 hover:text-white/70 transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
