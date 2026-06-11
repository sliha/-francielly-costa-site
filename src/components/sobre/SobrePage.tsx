'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Award,
  Globe,
  GraduationCap,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { trackSchedule, trackContactWhatsapp } from '@/lib/analytics'
import { supabase } from '@/lib/supabase/client'

const timeline = [
  {
    year: '2015',
    title: 'Início da Jornada',
    description:
      'Primeiras formações em técnicas de maquilhagem permanente em Portugal. Descoberta da paixão pela arte da dermopigmentação.',
  },
  {
    year: '2017',
    title: 'Formação em Milão',
    description:
      'Formação avançada em Milão, Itália, com os melhores profissionais europeus de PMU. Certificação internacional em microblading.',
  },
  {
    year: '2019',
    title: 'Master PMU',
    description:
      'Conquista da certificação Master PMU, reconhecida internacionalmente. Especialização em técnicas avançadas de sombreado e pigmentação labial.',
  },
  {
    year: '2021',
    title: 'J MED Stria Repair',
    description:
      'Certificação exclusiva em J MED Stria Repair, tornando-se uma das poucas especialistas desta técnica em Portugal.',
  },
  {
    year: '2023',
    title: 'Referência no Norte',
    description:
      'Reconhecida como referência em dermopigmentação no Norte de Portugal, com mais de 2300 clientes satisfeitas e 5 estrelas no Google.',
  },
]

const values = [
  {
    icon: Heart,
    title: 'Cuidado e Empatia',
    description:
      'Cada cliente é única. Escutamos, entendemos e personalizamos cada tratamento para as suas necessidades individuais.',
  },
  {
    icon: Star,
    title: 'Excelência Técnica',
    description:
      'Formação contínua, técnicas de vanguarda e materiais de alta qualidade garantem resultados que superam expectativas.',
  },
  {
    icon: CheckCircle,
    title: 'Segurança e Higiene',
    description:
      'Protocolos rigorosos de higiene e segurança, materiais descartáveis e pigmentos certificados para máxima proteção.',
  },
]

const certifications = [
  'Certificação Internacional em Microblading – Milão, Itália',
  'Master PMU (Permanent Make-Up) – Certificada',
  'J MED Stria Repair Specialist',
  'Formação em Micropigmentação Labial Avançada',
  'Curso de Eyeliner Permanente Especializado',
  'Certificação em Segurança e Higiene em PMU',
]

export default function SobrePage() {
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const { ref: timelineRef, inView: timelineInView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const { ref: valuesRef, inView: valuesInView } = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'negocio')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return
        if (data.value?.fotoPessoalUrl) {
          setFotoUrl(data.value.fotoPessoalUrl as string)
        }
      })
  }, [])

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215] relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-gold/5 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, x: -30 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
                Sobre Mim
              </span>
              <h1 className="font-playfair font-bold text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
                Francielly{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)' }}
                >
                  Costa
                </span>
              </h1>
              <p className="text-white/60 text-lg font-inter mb-6 leading-relaxed">
                Especialista em Dermopigmentação Avançada em Braga, Portugal
              </p>
              <p className="text-white/80 font-inter leading-relaxed mb-8">
                A minha história começa com uma paixão genuína pela arte de realçar
                a beleza natural de cada pessoa. Com mais de 8 anos de dedicação à
                dermopigmentação, fui à procura dos melhores mestres em Milão para
                aperfeiçoar as minhas técnicas e trazer para Braga o que há de mais
                avançado nesta arte.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/agendar" onClick={() => trackSchedule({ service: 'sobre_hero' })} className="btn-primary">
                  Agendar Consulta
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://wa.link/kwctpf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackContactWhatsapp({ source: 'sobre_hero' })}
                  className="btn-outline border-white/30 text-white hover:border-rose-gold hover:text-rose-gold"
                >
                  WhatsApp
                </a>
              </div>
            </motion.div>

            {/* Photo placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/5] max-w-md mx-auto relative">
                {fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotoUrl}
                    alt="Francielly Costa"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-gold/20 via-rose-gold/40 to-golden/30 flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-4">
                      <Award className="w-14 h-14 text-white/80" />
                    </div>
                    <p className="text-white font-playfair text-2xl mb-2">Francielly Costa</p>
                    <p className="text-white/70 text-sm font-inter text-center px-8">
                      Dermopigmentação Avançada · Braga, Portugal
                    </p>
                    <div className="flex items-center gap-1 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-golden fill-golden" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/30 rounded-tl-xl pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/30 rounded-br-xl pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="font-playfair font-bold text-3xl text-text-primary mb-6">
              A Minha <span className="gradient-text">História</span>
            </h2>
            <div className="divider-rose-left" />
            <div className="mt-6 space-y-4 text-text-secondary font-inter leading-relaxed">
              <p>
                Nascida com um olhar artístico aguçado e uma paixão pela beleza
                humana, Francielly Costa encontrou na dermopigmentação a perfeita
                fusão entre arte e ciência. Desde os primeiros passos na área, em
                2015, a sua dedicação e busca pela excelência tornaram-se a marca
                distintiva do seu trabalho.
              </p>
              <p>
                A formação em Milão, Itália, foi um ponto de viragem na sua carreira.
                Lá, aprendeu com os mestres europeus da arte PMU, absorvendo não
                apenas técnicas avançadas, mas também uma filosofia de trabalho centrada
                no cliente e nos resultados naturais. Voltou para Braga com uma visão
                renovada e a determinação de oferecer o melhor da dermopigmentação
                internacional ao mercado português.
              </p>
              <p>
                Hoje, com a certificação Master PMU e a especialização exclusiva em
                J MED Stria Repair — uma das poucas profissionais com esta formação
                em Portugal — Francielly é reconhecida como uma referência no Norte
                do país. O seu centro em Braga é um espaço de transformação, onde
                cada cliente é tratada com atenção individual e cuidado artesanal.
              </p>
              <p>
                "A beleza que procuro criar não é artificial — é a beleza que já
                existe em cada pessoa, apenas realçada e valorizada. O meu trabalho
                é fazer com que cada cliente se sinta a mais bonita versão de si
                mesma, todos os dias."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section ref={timelineRef} className="py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={timelineInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="section-tag">Percurso</span>
            <h2 className="section-title">
              A Minha <span className="gradient-text">Jornada</span>
            </h2>
            <div className="divider-rose" />
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-rose-gold/20 via-rose-gold/60 to-golden/20 md:-translate-x-0.5" />

            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={timelineInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`relative flex items-start gap-6 md:gap-0 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`pl-14 md:pl-0 flex-1 md:w-[45%] ${
                      i % 2 === 0
                        ? 'md:pr-12 md:text-right'
                        : 'md:pl-12 md:text-left'
                    }`}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                      <span
                        className="font-playfair font-bold text-2xl"
                        style={{
                          backgroundImage: 'linear-gradient(135deg, #B76E79, #C9A96E)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {item.year}
                      </span>
                      <h3 className="font-playfair font-bold text-lg text-text-primary mt-1 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-text-secondary text-sm font-inter leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-8 w-5 h-5 rounded-full bg-gradient-rose border-4 border-cream shadow-rose flex-shrink-0" />

                  {/* Empty opposite side */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section ref={valuesRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="section-tag">Princípios</span>
            <h2 className="section-title">
              Os Meus <span className="gradient-text">Valores</span>
            </h2>
            <div className="divider-rose" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, i) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="card-luxury p-8 text-center border border-cream-dark"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-rose-soft flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-8 h-8 text-rose-gold" />
                  </div>
                  <h3 className="font-playfair font-bold text-xl text-text-primary mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary font-inter text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-dark-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-golden mb-4 font-inter">
              Qualificações
            </span>
            <h2 className="font-playfair font-bold text-4xl text-white mb-4">
              Certificações & Formações
            </h2>
            <div className="w-16 h-0.5 bg-golden mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-dark-card rounded-xl border border-white/10 hover:border-rose-gold/30 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-rose-gold" />
                </div>
                <p className="text-white/80 text-sm font-inter">{cert}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/agendar"
              onClick={() => trackSchedule({ service: 'sobre_cta' })}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-rose text-white font-semibold rounded-full shadow-rose-lg hover:-translate-y-1 transition-all duration-300 font-inter"
            >
              Agendar Consulta
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
