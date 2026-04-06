'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ArrowRight, CheckCircle, Clock, Shield, Zap, ChevronDown,
  Sparkles, Target, Layers, Scissors
} from 'lucide-react'
import Link from 'next/link'
import ServicoMediaGaleria from '@/components/servicos/ServicoMediaGaleria'

function openChat() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('openChat'))
}

function Section({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.08 })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65 }}>
      {children}
    </motion.div>
  )
}

// Dark slate/steel colour palette for a masculine premium feel
const BG = { hero: '#070D14', section1: '#0C1219', section2: '#080D13', section3: '#0C1219' }
const ACCENT = '#7CA8C8'
const ACCENT2 = '#4A7FA0'

export default function TricoPigmentacaoDetailPage() {
  return (
    <div style={{ background: BG.hero }}>

      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0a1520 0%, #070d14 60%, #040810 100%)' }} />
        <div className="absolute top-1/3 right-1/3 w-[600px] h-[400px] rounded-full opacity-15 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-5 text-center pt-24 pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs font-inter mb-8">
            <Link href="/" className="hover:text-white/60 transition-colors">Início</Link>
            <span>/</span>
            <Link href="/servicos" className="hover:text-white/60 transition-colors">Serviços</Link>
            <span>/</span>
            <span style={{ color: ACCENT }}>Tricopigmentação</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8"
            style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}12` }}>
            <Target className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase font-inter" style={{ color: ACCENT }}>
              Micropigmentação Capilar
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-playfair font-bold text-5xl sm:text-6xl md:text-7xl text-white mb-6 leading-none">
            Tricopi<span className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT} 0%, #B76E79 60%, ${ACCENT} 100%)` }}>
              gmentação
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            className="text-white/65 text-lg md:text-xl font-inter leading-relaxed max-w-3xl mx-auto mb-10">
            A Solução Definitiva Para a Calvície.{' '}
            <span style={{ color: ACCENT }}>Resultado Imediato, Sem Cirurgia.</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={openChat}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold font-inter text-white transition-all hover:-translate-y-1"
              style={{ background: `linear-gradient(135deg, ${ACCENT2}, #B76E79)`, boxShadow: `0 8px 30px ${ACCENT}35` }}>
              Agendar Consulta
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link href="/servicos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border font-semibold font-inter transition-all backdrop-blur-sm"
              style={{ borderColor: `${ACCENT}30`, color: ACCENT }}>
              Ver outros serviços
            </Link>
          </motion.div>

          {/* Quick stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-8 mt-14">
            {[
              { label: 'Sessões', value: '3–4' },
              { label: 'Duração/sessão', value: '2–4h' },
              { label: 'Recuperação', value: 'Nenhuma' },
              { label: 'Resultado', value: '2–5 anos' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-playfair font-bold text-2xl" style={{ color: ACCENT }}>{s.value}</p>
                <p className="text-white/35 text-xs font-inter tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-6 h-6" style={{ color: `${ACCENT}50` }} />
        </motion.div>
      </section>

      {/* ── O QUE É ── */}
      <section className="py-24" style={{ background: BG.section1 }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-14">
              <h2 className="font-playfair font-bold text-4xl text-white mb-4">
                O Que É a <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, #B76E79)` }}>
                  Tricopigmentação?
                </span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  'Procedimento estético paramédico sofisticado para o couro cabeludo.',
                  'Implante de micro-pontos de pigmento na camada superficial da derme (1–2mm).',
                  'Cria ilusão ótica perfeita de folículos capilares em fase de crescimento.',
                  'NÃO é tatuagem na cabeça — técnica e pigmentos completamente diferentes.',
                  'Sem cirurgia, sem implantes, sem tempo de recuperação.',
                  'Resultado visível imediatamente após a primeira sessão.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    <p className="text-white/70 font-inter text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border p-7"
                style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}06` }}>
                <Sparkles className="w-8 h-8 mb-4" style={{ color: ACCENT }} />
                <h3 className="font-playfair font-bold text-white text-xl mb-3">Resultado Imediato</h3>
                <p className="text-white/55 font-inter text-sm leading-relaxed">
                  No final da primeira sessão, sai da clínica a parecer que tem mais cabelo do que quando entrou.
                  Sem tempo de recuperação, sem semanas de espera. Volta à vida normal no mesmo dia.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── COMO FUNCIONA (3 passos) ── */}
      <section className="py-24" style={{ background: BG.section2 }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <h2 className="font-playfair font-bold text-4xl text-white text-center mb-14">
              Como Funciona?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  icon: Target,
                  title: 'Design da Linha Frontal',
                  items: [
                    'Personalizado para cada rosto (idade, formato, estrutura óssea)',
                    'Transição suave, natural e ligeiramente irregular',
                    'Nada de linhas retas artificiais',
                  ],
                },
                {
                  step: '02',
                  icon: Layers,
                  title: 'Escolha do Pigmento',
                  items: [
                    'Pigmentos sintéticos de base orgânica (NÃO tinta de corpo)',
                    'Sem mutação de cor — nunca fica azul ou esverdeado',
                    'Tom diluído e afinado para a cor da raiz natural',
                  ],
                },
                {
                  step: '03',
                  icon: Scissors,
                  title: 'Implantação',
                  items: [
                    'Agulhas microscópicas desenvolvidas especificamente para este fim',
                    'Ponto por ponto — trabalho de extrema precisão',
                    '3 a 4 sessões com intervalos de 10–15 dias',
                    'Cria ilusão de densidade e profundidade (efeito 3D)',
                  ],
                },
              ].map((step, i) => (
                <div key={i} className="rounded-2xl border p-6 flex flex-col"
                  style={{ borderColor: `${ACCENT}15`, background: 'rgba(255,255,255,0.015)' }}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="font-playfair font-bold text-3xl" style={{ color: `${ACCENT}40` }}>{step.step}</span>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${ACCENT}14` }}>
                      <step.icon className="w-5 h-5" style={{ color: ACCENT }} />
                    </div>
                  </div>
                  <h3 className="font-playfair font-bold text-white text-lg mb-4">{step.title}</h3>
                  <ul className="space-y-2.5 flex-1">
                    {step.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: ACCENT }} />
                        <span className="text-white/55 font-inter text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── DETALHES ── */}
      <section className="py-20" style={{ background: BG.section1 }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <h2 className="font-playfair font-bold text-4xl text-white text-center mb-12">
              Detalhes do Procedimento
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { icon: Target, label: 'Sessões', value: '3 a 4' },
                { icon: Clock, label: 'Por sessão', value: '2–4 horas' },
                { icon: Zap, label: 'Dor', value: 'Ligeira' },
                { icon: Layers, label: 'Profundidade', value: '1–2mm' },
                { icon: Shield, label: 'Recuperação', value: 'Nenhuma' },
                { icon: Clock, label: 'Resultado', value: '2–5 anos' },
                { icon: Sparkles, label: 'Touch-up', value: '2–5 anos' },
                { icon: CheckCircle, label: 'Intervalos', value: '10–15 dias' },
              ].map((item, i) => (
                <div key={i} className="text-center rounded-2xl border p-4"
                  style={{ borderColor: `${ACCENT}15`, background: `${ACCENT}04` }}>
                  <item.icon className="w-5 h-5 mx-auto mb-2" style={{ color: ACCENT }} />
                  <p className="font-playfair font-bold text-white text-base">{item.value}</p>
                  <p className="text-white/35 text-xs font-inter mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── PARA QUEM É ── */}
      <section className="py-24" style={{ background: BG.section2 }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <h2 className="font-playfair font-bold text-4xl text-white text-center mb-14">
              Para Quem É?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Efeito Rapado',
                  subtitle: 'Shaved Look',
                  desc: 'Calvície avançada (Graus V a VII de Norwood). Sem área doadora para transplante. Cria ilusão perfeita de cabeça rapada a zero.',
                  glow: '#4A7FA0',
                },
                {
                  title: 'Efeito Densidade',
                  subtitle: 'Volume & Preenchimento',
                  desc: 'Cabelo ralo e fino (homens e mulheres). Escurece o couro cabeludo visível. Ilusão de cabelo com o dobro do volume.',
                  glow: ACCENT,
                },
                {
                  title: 'Camuflagem de Cicatrizes',
                  subtitle: 'Cicatrizes & Alopecia',
                  desc: 'Cicatrizes de transplantes capilares antigos (técnica FUT). Cicatrizes de acidentes. Mistura cicatriz com o resto do cabelo.',
                  glow: '#B76E79',
                },
              ].map((card, i) => (
                <div key={i} className="rounded-2xl border p-7 relative overflow-hidden group"
                  style={{ borderColor: `${card.glow}20`, background: 'rgba(255,255,255,0.015)' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at top left, ${card.glow}10, transparent 60%)` }} />
                  <div className="relative z-10">
                    <p className="text-xs font-bold tracking-widest uppercase font-inter mb-2" style={{ color: card.glow }}>{card.subtitle}</p>
                    <h3 className="font-playfair font-bold text-white text-xl mb-3">{card.title}</h3>
                    <p className="text-white/55 font-inter text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── SEGURANÇA ── */}
      <section className="py-20" style={{ background: BG.section1 }}>
        <div className="max-w-4xl mx-auto px-4">
          <Section>
            <div className="rounded-2xl border p-8 md:p-10" style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}05` }}>
              <Shield className="w-8 h-8 mb-5" style={{ color: ACCENT }} />
              <h2 className="font-playfair font-bold text-3xl text-white mb-6">Segurança e Conforto</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Dor amplamente suportável, inferior a qualquer tatuagem.',
                  'Anestésico tópico em creme aplicado antes do procedimento.',
                  'Pigmentos sem mutação de cor — resultado estável ao longo dos anos.',
                  'Possibilidade de reajustar design à medida que o rosto envelhece.',
                  'Técnica reversível com o tempo (não é permanente como tatuagem).',
                  'Sem interação com exames MRI/RMN.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    <span className="text-white/65 font-inter text-sm leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── GALERIA ── */}
      <ServicoMediaGaleria servicoSlug="tricopigmentacao" accentColor="#7CA8C8" />

      {/* ── INVESTIMENTO ── */}
      <section className="py-20" style={{ background: BG.section2 }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Section>
            <div className="rounded-3xl border p-10"
              style={{ borderColor: `${ACCENT}20`, background: `linear-gradient(135deg, ${ACCENT}08, rgba(183,110,121,0.04))` }}>
              <span className="text-xs font-bold tracking-widest uppercase font-inter px-4 py-1.5 rounded-full border"
                style={{ color: ACCENT, borderColor: `${ACCENT}35`, background: `${ACCENT}12` }}>
                Investimento
              </span>
              <p className="font-playfair font-bold text-4xl text-white mt-6 mb-4">
                Consulte-nos para Orçamento Personalizado
              </p>
              <p className="text-white/45 font-inter text-base mb-8 max-w-md mx-auto">
                O preço é calculado de acordo com a área a tratar, número de sessões e complexidade do caso.
                Consulta inicial gratuita.
              </p>
              <button onClick={openChat}
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold font-inter text-white text-lg transition-all hover:-translate-y-1"
                style={{ background: `linear-gradient(135deg, ${ACCENT2}, #B76E79)`, boxShadow: `0 8px 30px ${ACCENT}35` }}>
                Agende a Sua Consulta
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Section>
        </div>
      </section>

      {/* ── BACK ── */}
      <div className="py-8 text-center" style={{ background: BG.hero }}>
        <Link href="/servicos" className="inline-flex items-center gap-2 text-white/35 hover:text-white/60 text-sm font-inter transition-colors">
          ← Ver todos os serviços
        </Link>
      </div>
    </div>
  )
}
