'use client'
import { motion } from 'framer-motion'

export default function AdminSplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center z-[9999]"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* FC Monogram */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <span className="text-white font-playfair text-3xl font-bold">FC</span>
        </div>

        {/* Brand name */}
        <h1 className="text-white font-playfair text-2xl font-semibold mb-2">
          Francielly Costa
        </h1>
        <p className="text-golden text-sm tracking-widest uppercase">
          Painel Admin
        </p>

        {/* Animated dots */}
        <div className="mt-8 flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-rose-gold"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
