'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'O que é dermopigmentação e como funciona?',
    answer:
      'A dermopigmentação (também conhecida como maquilhagem permanente ou PMU – Permanent Make-Up) é uma técnica que introduz pigmentos naturais na camada superficial da pele (derme) através de micro-agulhas especializadas. O processo é controlado com precisão artística para criar resultados naturais e duradouros. É uma forma de tatuagem cosmética que realça traços faciais como sobrancelhas, olhos e lábios.',
  },
  {
    question: 'Quanto tempo duram os resultados?',
    answer:
      'Os resultados variam consoante a técnica e o tipo de pele, mas em geral: o Microblading dura entre 1 a 3 anos, o Microshading entre 1 a 2 anos, o Eyeliner Permanente entre 2 a 4 anos, e a Micropigmentação Labial entre 1 a 3 anos. Peles oleosas e com maior exposição solar tendem a desvanecer mais rapidamente. Recomendamos retoques de manutenção para manter o resultado perfeito.',
  },
  {
    question: 'Os procedimentos doem?',
    answer:
      'Todos os procedimentos são realizados com anestesia tópica (creme anestésico) aplicado antes da sessão, tornando o desconforto mínimo. A maioria das clientes descreve a sensação como um arranhão suave. A intensidade varia de pessoa para pessoa — a zona labial tende a ser ligeiramente mais sensível. O seu conforto é sempre a nossa prioridade.',
  },
  {
    question: 'Quantas sessões são necessárias?',
    answer:
      'Todos os nossos serviços requerem geralmente 2 sessões: a sessão inicial e um retoque obrigatório realizado entre 4 a 8 semanas depois. O retoque é essencial pois permite corrigir qualquer área que possa ter desbotado durante a cicatrização e garantir que o resultado final seja perfeito. Algumas clientes podem necessitar de uma terceira sessão dependendo do tipo de pele.',
  },
  {
    question: 'Como é o período de recuperação?',
    answer:
      'Nos primeiros dias após o procedimento, a área tratada pode apresentar vermelhidão, ligeiro inchaço e a cor aparecerá mais intensa. Ao longo de 7 a 14 dias, a pele forma uma pelicula fina que cai naturalmente, revelando o resultado final (40-50% mais suave). É fundamental não molhar a área, evitar sol direto, maquilhagem e produtos exfoliantes durante pelo menos 7 dias. Instruções detalhadas são fornecidas após cada sessão.',
  },
  {
    question: 'Existem contraindicações?',
    answer:
      'Sim, existem algumas condições que contraindicam os procedimentos: gravidez e amamentação, uso de isotretinoína (Roacutan) nos últimos 6 meses, hemofilia ou distúrbios de coagulação, diabetes não controlada, epilepsia, doenças autoimunes ativas, herpes labial ativo (para lábios), quimioterapia ou radioterapia recente, e alergias conhecidas a pigmentos de tatuagem. Recomendamos uma consulta prévia para avaliar a sua situação individual.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section ref={ref} className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-rose-gold/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-golden/5 blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="section-tag">Dúvidas Frequentes</span>
          <h2 className="section-title mb-4">
            Perguntas{' '}
            <span className="gradient-text">Frequentes</span>
          </h2>
          <div className="divider-rose" />
          <p className="section-subtitle max-w-xl mx-auto mt-4">
            Tudo o que precisa de saber antes de agendar o seu tratamento.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                openIndex === i
                  ? 'border-rose-gold/30 shadow-rose'
                  : 'border-cream-dark hover:border-rose-gold/20'
              }`}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between p-5 lg:p-6 text-left bg-white hover:bg-cream transition-colors duration-200 group"
              >
                <div className="flex items-center gap-3 pr-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                      openIndex === i
                        ? 'bg-rose-gold text-white'
                        : 'bg-cream group-hover:bg-rose-gold/10 text-rose-gold'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span
                    className={`font-semibold text-base font-inter transition-colors duration-200 ${
                      openIndex === i ? 'text-rose-gold' : 'text-text-primary'
                    }`}
                  >
                    {faq.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown
                    className={`w-5 h-5 transition-colors duration-200 ${
                      openIndex === i ? 'text-rose-gold' : 'text-text-muted'
                    }`}
                  />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 lg:px-6 pb-5 lg:pb-6 pl-16">
                      <p className="text-text-secondary font-inter text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-text-secondary font-inter mb-4 text-sm">
            Ainda tem dúvidas? Fale connosco diretamente.
          </p>
          <a
            href="https://wa.link/kwctpf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            Falar com Sofia (AI)
          </a>
        </motion.div>
      </div>
    </section>
  )
}
