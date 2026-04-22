'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MapPin, Phone, Mail, Clock, MessageCircle, Navigation } from 'lucide-react'

const contactCards = [
  {
    icon: MapPin,
    title: 'Endereço',
    lines: ['Av. Dr. António Palha 53', '4715-091 Braga, Portugal'],
    color: 'rose-gold',
    action: {
      label: 'Ver no Mapa',
      href: 'https://maps.google.com/?q=Av.+Dr.+António+Palha+53,+4715-091+Braga',
    },
  },
  {
    icon: Phone,
    title: 'Telefone',
    lines: ['+351 913 112 232', '+351 917 132 116 (WhatsApp)'],
    color: 'golden',
    action: { label: 'Ligar Agora', href: 'tel:+351913112232' },
  },
  {
    icon: Mail,
    title: 'Email',
    lines: ['info@franciellycosta.com'],
    color: 'rose-gold',
    action: { label: 'Enviar Email', href: 'mailto:info@franciellycosta.com' },
  },
  {
    icon: Clock,
    title: 'Horário',
    lines: ['Segunda–Sexta: 9h–18h', 'Sábado: 9h–13h', 'Domingo: Encerrado'],
    color: 'golden',
  },
]

export default function LocationSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 bg-cream relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-gold/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-tag">Localização</span>
          <h2 className="section-title mb-4">
            Encontre-nos em{' '}
            <span className="gradient-text">Braga</span>
          </h2>
          <div className="divider-rose" />
          <p className="section-subtitle max-w-xl mx-auto mt-4">
            Venha conhecer o nosso espaço e descobrir como podemos transformar
            a sua beleza.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 rounded-2xl overflow-hidden shadow-card"
          >
            <div className="relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3026.5773994048393!2d-8.428844984614956!3d41.5505869792533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd24fef3f7635da1%3A0x5e3e7de4a6d4b6b6!2sAv.%20Dr.%20Ant%C3%B3nio%20Palha%2053%2C%204715-091%20Braga!5e0!3m2!1spt!2spt!4v1700000000000!5m2!1spt!2spt"
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Francielly Costa - Braga"
                className="block"
              />
              {/* Overlay with pin */}
              <div className="absolute top-4 left-4">
                <div className="bg-white rounded-xl shadow-card px-3 py-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-gold flex items-center justify-center">
                    <Navigation className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold font-inter text-text-primary">
                    Francielly Costa · Braga
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            {contactCards.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="bg-white rounded-xl p-5 shadow-card border border-cream-dark hover:border-rose-gold/20 transition-all duration-200 hover:shadow-card-hover group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                        card.color === 'rose-gold'
                          ? 'bg-rose-gold/10 group-hover:bg-rose-gold/20'
                          : 'bg-golden/10 group-hover:bg-golden/20'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          card.color === 'rose-gold' ? 'text-rose-gold' : 'text-golden'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary text-sm mb-1 font-inter">
                        {card.title}
                      </h3>
                      {card.lines.map((line, j) => (
                        <p
                          key={j}
                          className="text-text-secondary text-sm font-inter leading-relaxed"
                        >
                          {line}
                        </p>
                      ))}
                      {card.action && (
                        <a
                          href={card.action.href}
                          target={card.action.href.startsWith('http') ? '_blank' : undefined}
                          rel={card.action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 transition-colors duration-200 font-inter ${
                            card.color === 'rose-gold'
                              ? 'text-rose-gold hover:text-rose-gold-dark'
                              : 'text-golden hover:text-golden-dark'
                          }`}
                        >
                          {card.action.label}
                          <span className="text-lg leading-none">→</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* WhatsApp CTA */}
            <motion.a
              href="https://wa.link/kwctpf"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg font-inter"
            >
              <MessageCircle className="w-5 h-5" />
              Falar pelo WhatsApp
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
