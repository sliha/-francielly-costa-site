'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/galeria', label: 'Galeria' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-rose flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className={`font-playfair font-bold text-lg transition-colors duration-300 ${
                    isScrolled ? 'text-text-primary' : 'text-white'
                  }`}
                >
                  Francielly Costa
                </span>
                <span
                  className={`text-xs tracking-widest uppercase font-inter transition-colors duration-300 ${
                    isScrolled ? 'text-rose-gold' : 'text-golden-light'
                  }`}
                >
                  Dermopigmentação
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium font-inter transition-colors duration-300 rounded-full hover:text-rose-gold group ${
                      isScrolled ? 'text-text-primary' : 'text-white/90'
                    }`}
                  >
                    {link.label}
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-rose-gold rounded-full transition-all duration-300 group-hover:w-4/5" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center">
              <Link
                href="/agendar"
                className="btn-primary text-sm px-6 py-2.5"
              >
                Agendar
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className={`lg:hidden p-2 rounded-full transition-colors duration-300 ${
                isScrolled
                  ? 'text-text-primary hover:bg-cream'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between p-6 border-b border-cream-dark">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-rose flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-playfair font-bold text-lg text-text-primary">
                    Francielly Costa
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-full hover:bg-cream transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Mobile Links */}
              <nav className="flex-1 overflow-y-auto py-6 px-6">
                <ul className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center px-4 py-3 rounded-xl text-text-primary font-medium hover:bg-cream hover:text-rose-gold transition-all duration-200 font-inter"
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Mobile CTA */}
              <div className="p-6 border-t border-cream-dark">
                <Link
                  href="/agendar"
                  onClick={() => setIsMobileOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Agendar Consulta
                </Link>
                <p className="text-center text-sm text-text-muted mt-3 font-inter">
                  Braga, Portugal
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
