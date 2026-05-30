'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Download, Maximize2 } from 'lucide-react'

interface Props {
  pages: string[]
  open: boolean
  onClose: () => void
  initialPage?: number
  title: string
  pdf: string
}

export default function EbookReader({ pages, open, onClose, initialPage = 0, title, pdf }: Props) {
  const [index, setIndex] = useState(initialPage)
  const [direction, setIndexDirection] = useState(0)
  const total = pages.length
  const railRef = useRef<HTMLDivElement>(null)

  const go = useCallback(
    (next: number) => {
      setIndex((curr) => {
        const target = Math.max(0, Math.min(total - 1, next))
        setIndexDirection(target > curr ? 1 : -1)
        return target
      })
    },
    [total],
  )

  // Sincroniza a página inicial sempre que o leitor abre
  useEffect(() => {
    if (open) setIndex(initialPage)
  }, [open, initialPage])

  // Bloqueia o scroll do body enquanto o leitor está aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Navegação por teclado
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, go, onClose])

  // Mantém a miniatura ativa visível
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const active = rail.querySelector<HTMLElement>(`[data-thumb="${index}"]`)
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [index])

  const openFullPdf = () => window.open(pdf, '_blank', 'noopener')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#140d10]/97 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Leitor do eBook ${title}`}
        >
          {/* Barra superior */}
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-white/10">
            <div className="min-w-0">
              <p className="text-white font-playfair font-bold text-sm sm:text-base truncate">{title}</p>
              <p className="text-white/40 text-xs font-inter">
                Página {index + 1} de {total}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={pdf}
                download
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-gold text-white text-sm font-semibold font-inter hover:bg-rose-gold-dark transition-colors"
              >
                <Download className="w-4 h-4" />
                Descarregar
              </a>
              <button
                onClick={openFullPdf}
                aria-label="Abrir PDF completo"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                aria-label="Fechar leitor"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Palco da página */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden px-2 sm:px-20 py-4">
            {/* Anterior */}
            <button
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Página anterior"
              className="absolute left-2 sm:left-6 z-10 inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 text-white hover:bg-rose-gold transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative h-full w-full max-w-[460px] flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.img
                  key={index}
                  src={pages[index]}
                  alt={`${title} — página ${index + 1}`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 80 : -80, rotateY: direction > 0 ? 8 : -8 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -80 : 80, rotateY: direction > 0 ? -8 : 8 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) go(index + 1)
                    else if (info.offset.x > 80) go(index - 1)
                  }}
                  className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10 cursor-grab active:cursor-grabbing select-none"
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            {/* Seguinte */}
            <button
              onClick={() => go(index + 1)}
              disabled={index === total - 1}
              aria-label="Página seguinte"
              className="absolute right-2 sm:right-6 z-10 inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/10 text-white hover:bg-rose-gold transition-colors disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="px-4 sm:px-6">
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-gold to-golden transition-all duration-300"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Miniaturas */}
          <div ref={railRef} className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-4 scrollbar-thin">
            {pages.map((src, i) => (
              <button
                key={src}
                data-thumb={i}
                onClick={() => go(i)}
                aria-label={`Ir para a página ${i + 1}`}
                className={`relative flex-shrink-0 w-11 sm:w-14 rounded-md overflow-hidden ring-2 transition-all ${
                  i === index ? 'ring-rose-gold scale-105' : 'ring-transparent opacity-50 hover:opacity-90'
                }`}
              >
                <img src={src} alt="" loading="lazy" className="w-full h-auto block" draggable={false} />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
