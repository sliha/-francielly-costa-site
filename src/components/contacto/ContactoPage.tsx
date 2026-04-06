'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  User,
  MessageSquare,
} from 'lucide-react'
import { services } from '@/data/services'

interface FormData {
  name: string
  phone: string
  email: string
  service: string
  message: string
}

const initialForm: FormData = {
  name: '',
  phone: '',
  email: '',
  service: '',
  message: '',
}

export default function ContactoPage() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Erro no servidor')
      setSubmitted(true)
      setForm(initialForm)
    } catch {
      alert('Ocorreu um erro ao enviar. Por favor tente novamente ou contacte-nos pelo WhatsApp.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              Fale Connosco
            </span>
            <h1 className="font-playfair font-bold text-4xl md:text-6xl text-white mb-6">
              Agende a sua{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}
              >
                Consulta
              </span>
            </h1>
            <p className="text-white/70 text-lg font-inter max-w-2xl mx-auto">
              Estamos aqui para responder a todas as suas dúvidas e ajudá-la a
              marcar o seu tratamento de dermopigmentação.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section ref={ref} className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-3xl shadow-card p-8 lg:p-10">
                <h2 className="font-playfair font-bold text-2xl text-text-primary mb-2">
                  Envie uma Mensagem
                </h2>
                <p className="text-text-secondary font-inter text-sm mb-8">
                  Preencha o formulário e entraremos em contacto brevemente.
                </p>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-playfair font-bold text-xl text-text-primary mb-2">
                      Mensagem Enviada!
                    </h3>
                    <p className="text-text-secondary font-inter text-sm mb-6">
                      Obrigada pelo seu contacto. Responderemos em breve.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn-primary text-sm px-6 py-2.5"
                    >
                      Enviar Nova Mensagem
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary font-inter mb-1.5">
                          Nome Completo *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="O seu nome"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-dark bg-cream focus:outline-none focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20 transition-all duration-200 text-sm font-inter text-text-primary placeholder:text-text-muted"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary font-inter mb-1.5">
                          Telefone *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            placeholder="+351 000 000 000"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-dark bg-cream focus:outline-none focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20 transition-all duration-200 text-sm font-inter text-text-primary placeholder:text-text-muted"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary font-inter mb-1.5">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="seuemail@exemplo.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-dark bg-cream focus:outline-none focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20 transition-all duration-200 text-sm font-inter text-text-primary placeholder:text-text-muted"
                        />
                      </div>
                    </div>

                    {/* Service */}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary font-inter mb-1.5">
                        Serviço de Interesse
                      </label>
                      <select
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream focus:outline-none focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20 transition-all duration-200 text-sm font-inter text-text-primary appearance-none cursor-pointer"
                      >
                        <option value="">Selecione um serviço</option>
                        {services.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                        <option value="outro">Outro / Não tenho a certeza</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary font-inter mb-1.5">
                        Mensagem
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Escreva a sua mensagem, dúvidas ou informações adicionais..."
                          rows={4}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-dark bg-cream focus:outline-none focus:border-rose-gold focus:ring-2 focus:ring-rose-gold/20 transition-all duration-200 text-sm font-inter text-text-primary placeholder:text-text-muted resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          A enviar...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Mensagem
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-text-muted font-inter">
                      Ao enviar este formulário, aceita a nossa{' '}
                      <a href="/privacidade" className="text-rose-gold hover:underline">
                        Política de Privacidade
                      </a>
                      .
                    </p>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Info cards */}
              {[
                {
                  icon: MapPin,
                  title: 'Endereço',
                  content: 'Av. Dr. António Palha 53\n4715-091 Braga, Portugal',
                  color: 'rose-gold',
                },
                {
                  icon: Phone,
                  title: 'Telefone',
                  content: '+351 000 000 000',
                  href: 'tel:+351000000000',
                  color: 'golden',
                },
                {
                  icon: Mail,
                  title: 'Email',
                  content: 'info@franciellycosta.com',
                  href: 'mailto:info@franciellycosta.com',
                  color: 'rose-gold',
                },
                {
                  icon: Clock,
                  title: 'Horário de Funcionamento',
                  content: 'Seg–Sex: 9h–18h\nSábado: 9h–13h\nDomingo: Encerrado',
                  color: 'golden',
                },
              ].map((info, i) => {
                const Icon = info.icon
                return (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 shadow-card border border-cream-dark hover:border-rose-gold/20 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          info.color === 'rose-gold'
                            ? 'bg-rose-gold/10'
                            : 'bg-golden/10'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            info.color === 'rose-gold'
                              ? 'text-rose-gold'
                              : 'text-golden'
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-sm mb-1 font-inter">
                          {info.title}
                        </h3>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="text-text-secondary text-sm font-inter hover:text-rose-gold transition-colors duration-200 whitespace-pre-line"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="text-text-secondary text-sm font-inter whitespace-pre-line">
                            {info.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* WhatsApp */}
              <a
                href="https://wa.link/kwctpf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1da851] text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg font-inter"
              >
                <MessageCircle className="w-5 h-5" />
                Falar pelo WhatsApp
              </a>

              {/* Map */}
              <div className="rounded-2xl overflow-hidden shadow-card">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3026.5773994048393!2d-8.428844984614956!3d41.5505869792533!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd24fef3f7635da1%3A0x5e3e7de4a6d4b6b6!2sAv.%20Dr.%20Ant%C3%B3nio%20Palha%2053%2C%204715-091%20Braga!5e0!3m2!1spt!2spt!4v1700000000000!5m2!1spt!2spt"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa Francielly Costa"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
