'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  ArrowRight, Shield, Zap, Clock, TrendingDown, CheckCircle,
  AlertTriangle, ChevronDown, Sparkles, Star, Trophy, Plus, Minus
} from 'lucide-react'
import Link from 'next/link'
import ServicoMediaGaleria from '@/components/servicos/ServicoMediaGaleria'

// ─── Countdown ───────────────────────────────────────────────────────────────
const TARGET_DATE = new Date('2026-05-01T00:00:00')

function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = TARGET_DATE.getTime() - Date.now()
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

// ─── Waitlist Form ────────────────────────────────────────────────────────────
function WaitlistForm() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/fiberbrows-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ nome: '', email: '', telefone: '' })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-14 h-14 text-golden mx-auto mb-4" />
        <h3 className="font-playfair font-bold text-white text-2xl mb-2">Registo confirmado!</h3>
        <p className="text-white/60 font-inter">Será das primeiras a ser contactada quando a FiberBROWS estiver disponível.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { name: 'nome', label: 'Nome completo', type: 'text', placeholder: 'O seu nome' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'O seu email' },
        { name: 'telefone', label: 'Telefone / WhatsApp', type: 'tel', placeholder: '+351 9XX XXX XXX' },
      ].map((field) => (
        <div key={field.name}>
          <label className="block text-white/60 text-sm font-inter mb-1.5">{field.label}</label>
          <input
            type={field.type}
            required
            placeholder={field.placeholder}
            value={form[field.name as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-inter text-sm placeholder:text-white/25 focus:outline-none focus:border-golden/50 transition-colors"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-4 rounded-xl font-semibold font-inter text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #C9A96E, #B76E79)', boxShadow: '0 6px 24px rgba(201,169,110,0.3)' }}
      >
        {status === 'loading' ? 'A registar...' : 'Quero Ser Notificada'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm text-center font-inter">Ocorreu um erro. Por favor, tente novamente.</p>
      )}
    </form>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const faqItems = [
  {
    q: 'A FiberBROWS é permanente?',
    a: 'A duração é de aproximadamente 6 meses. Pode ser renovada quando a cliente desejar, mantendo sempre um resultado natural e adaptado à evolução do rosto.',
  },
  {
    q: 'Dói muito?',
    a: 'O desconforto é muito inferior ao da micropigmentação ou microagulhamento. A maioria das clientes descreve o procedimento como muito suportável. É aplicada anestesia tópica para maximizar o conforto.',
  },
  {
    q: 'É seguro?',
    a: 'Sim, quando executado com protocolo técnico rigoroso. O fio é sintético e biocompatível com a grande maioria dos tipos de pele. Existe uma margem natural de 3–5% de sensibilidade, como acontece com qualquer material sintético.',
  },
  {
    q: 'Posso usar henna nas sobrancelhas depois?',
    a: 'Sim. O fio tem acabamento selado e não absorve corantes. A henna ou qualquer coloração só pigmenta os fios naturais — o fio implantado mantém sempre a cor original.',
  },
  {
    q: 'Quem não pode fazer?',
    a: 'Está contraindicado para pessoas com alergia conhecida a níquel ou componentes sintéticos. Recomendamos testes de tolerância prévios para clientes com histórico alérgico, gravidez, amamentação, doenças autoimunes ativas ou uso de isotretinoína.',
  },
  {
    q: 'Qual a diferença para o transplante capilar?',
    a: 'A FiberBROWS não é cirúrgica, não envolve extração de folículos, não requer anestesia geral, é minimamente invasiva (máx. 2mm de profundidade) e custa uma fração do preço dos transplantes, que variam entre €7.000 e €30.000.',
  },
  {
    q: 'Quando estará disponível?',
    a: 'A Francielly Costa estará certificada a partir de Maio 2026, sendo uma das primeiras profissionais a oferecer este serviço em Portugal. Deixe o seu contacto na lista de espera abaixo para ser das primeiras a ser contactada.',
  },
]

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {faqItems.map((item, i) => (
        <div key={i} className="rounded-2xl border border-golden/15 overflow-hidden transition-colors"
          style={{ background: open === i ? 'rgba(201,169,110,0.06)' : 'rgba(255,255,255,0.02)' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-white font-inter text-sm font-medium leading-snug">{item.q}</span>
            <span className="flex-shrink-0 text-golden">
              {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5">
              <p className="text-white/60 font-inter text-sm leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
      <div className={className}>{children}</div>
    </motion.div>
  )
}

function openChat() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('openChat'))
}

export default function FiberBROWSDetailPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const time = useCountdown()

  return (
    <div style={{ background: '#0d0a0b' }}>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2a1a0f 0%, #1a1205 50%, #0d0800 100%)' }} />
        <div className="absolute top-1/3 left-1/3 w-[700px] h-[500px] rounded-full opacity-25 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #C9A96E 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)' }} />

        {/* Floating particles */}
        {mounted && [0.3, 1.2, 0.7, 1.8, 0.1].map((delay, i) => (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-golden/50"
            style={{ top: `${20 + i * 14}%`, left: `${8 + i * 18}%` }}
            animate={{ y: [0, -18, 0], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 4, delay, repeat: Infinity }} />
        ))}

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-24 pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm font-inter mb-8">
            <Link href="/" className="hover:text-golden transition-colors">Início</Link>
            <span>/</span>
            <Link href="/servicos" className="hover:text-golden transition-colors">Serviços</Link>
            <span>/</span>
            <span className="text-golden">FiberBROWS</span>
          </div>

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-golden/40 bg-golden/10 mb-8">
            <Trophy className="w-4 h-4 text-golden" />
            <span className="text-golden text-xs font-bold tracking-[0.2em] uppercase font-inter">
              Primeira Certificada em Portugal
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="font-playfair font-bold text-6xl sm:text-7xl md:text-8xl text-white mb-6 leading-none">
            Fiber
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #C9A96E 0%, #B76E79 50%, #C9A96E 100%)' }}>
              BROWS
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="text-white/70 text-xl md:text-2xl font-inter leading-relaxed max-w-3xl mx-auto mb-10">
            Sobrancelhas Naturais, Sem Cirurgia.{' '}
            <span className="text-golden">A Técnica que Está a Revolucionar a Estética.</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#waitlist"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold font-inter text-white transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg,#C9A96E,#B76E79)', boxShadow: '0 8px 30px rgba(201,169,110,0.35)' }}>
              Pré-Registar Interesse
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <button onClick={openChat}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full border border-golden/30 text-golden hover:border-golden hover:bg-golden/10 font-semibold font-inter transition-all backdrop-blur-sm">
              Falar com a Sofia
              <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>

          {/* Quick stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-8 mt-14">
            {[
              { label: 'Profundidade', value: 'Máx. 2mm' },
              { label: 'Resultado', value: '6 Meses' },
              { label: 'Invasividade', value: 'Mínima' },
              { label: 'Dor', value: 'Muito ligeira' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-playfair font-bold text-2xl text-golden">{s.value}</p>
                <p className="text-white/40 text-xs font-inter tracking-wide mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-6 h-6 text-golden/40" />
        </motion.div>
      </section>

      {/* ── O QUE É ─────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#111008' }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-14">
              <span className="section-tag" style={{ color: '#C9A96E', borderColor: '#C9A96E33', background: '#C9A96E11' }}>
                O Procedimento
              </span>
              <h2 className="font-playfair font-bold text-4xl text-white mt-4 mb-4">
                O Que É a <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #C9A96E, #B76E79)' }}>FiberBROWS?</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  'Técnica estética, NÃO cirúrgica e NÃO médica.',
                  'Aplicação superficial de um adorno estético na pele (profundidade máxima 2mm).',
                  'NÃO é implante nem transplante capilar — não envolve extração de folículos.',
                  'Não utiliza dispositivos com finalidade terapêutica ou médica.',
                  'Mais superficial que tatuagem, mais leve que micropigmentação, menos invasiva que piercing.',
                  'Não utiliza agulhas ou cânulas de uso médico.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
                    <p className="text-white/70 font-inter text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-golden/20 p-8"
                style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.06) 0%, rgba(183,110,121,0.04) 100%)' }}>
                <Star className="w-8 h-8 text-golden mb-4" />
                <h3 className="font-playfair font-bold text-white text-xl mb-3">Porquê a FiberBROWS?</h3>
                <p className="text-white/60 font-inter text-sm leading-relaxed">
                  Para quem deseja sobrancelhas naturais e preenchidas sem recorrer a cirurgia, a FiberBROWS representa
                  um salto evolutivo na estética. Resultado imediato, mínima invasividade e preço acessível comparado
                  com alternativas cirúrgicas de €7.000 a €30.000.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#0d0a00' }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="text-center mb-14">
              <h2 className="font-playfair font-bold text-4xl text-white mb-4">Como Funciona?</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'O Fio Sintético',
                  items: [
                    'Fio sintético biocompatível com a maioria dos tipos de pele.',
                    'NÃO é fio cirúrgico.',
                    'Acabamento selado — não absorve corantes nem pigmentos.',
                    'Se usar henna ou coloração, apenas os pelos naturais são tingidos; o fio mantém a cor original.',
                  ],
                },
                {
                  title: 'O Protocolo Técnico',
                  items: [
                    'Protocolo rigoroso que controla profundidade, ângulo de inserção e distância segura.',
                    'Respeita a distância segura entre agulha, fio implantado e folículos naturais.',
                    'Preserva 100% a integridade dos folículos capilares naturais.',
                    'Executado por profissional certificada — Francielly Costa, pioneira em Portugal.',
                  ],
                },
              ].map((block, i) => (
                <div key={i} className="rounded-2xl border border-white/8 p-7"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h3 className="font-playfair font-bold text-golden text-xl mb-5">{block.title}</h3>
                  <ul className="space-y-3">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-golden mt-2 flex-shrink-0" />
                        <span className="text-white/65 font-inter text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── DETALHES DO PROCEDIMENTO ─────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#111008' }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <h2 className="font-playfair font-bold text-4xl text-white text-center mb-12">
              Detalhes do Procedimento
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: Clock, label: 'Duração do resultado', value: '6 Meses' },
                { icon: Shield, label: 'Tipo', value: 'Não cirúrgico' },
                { icon: Zap, label: 'Dor', value: 'Muito ligeira' },
                { icon: Star, label: 'Sessões', value: 'A definir' },
                { icon: TrendingDown, label: 'Profundidade', value: 'Máx. 2mm' },
              ].map((item, i) => (
                <div key={i} className="text-center rounded-2xl border border-golden/15 p-5"
                  style={{ background: 'rgba(201,169,110,0.04)' }}>
                  <item.icon className="w-6 h-6 text-golden mx-auto mb-3" />
                  <p className="font-playfair font-bold text-white text-lg">{item.value}</p>
                  <p className="text-white/40 text-xs font-inter mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── SEGURANÇA ───────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#0d0a00' }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <h2 className="font-playfair font-bold text-4xl text-white mb-8">
                  Segurança e Contraindicações
                </h2>
                <div className="space-y-4">
                  {[
                    'Procedimento seguro quando executado com protocolo técnico adequado.',
                    '3% a 5% de margem de reação de sensibilidade (como qualquer material sintético).',
                    'Testes de tolerância prévios recomendados para clientes com histórico alérgico.',
                    'Mesmas contraindicações gerais de qualquer procedimento estético.',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
                      <p className="text-white/70 font-inter text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 p-6"
                style={{ background: 'rgba(245,158,11,0.04)' }}>
                <AlertTriangle className="w-7 h-7 text-amber-400 mb-4" />
                <h3 className="font-playfair font-bold text-white text-lg mb-4">Contraindicado para</h3>
                <ul className="space-y-2">
                  {[
                    'Alergia a níquel ou componentes sintéticos',
                    'Histórico de reações a materiais estéticos',
                    'Gravidez e amamentação',
                    'Doenças autoimunes activas',
                    'Uso de isotretinoína',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70 flex-shrink-0" />
                      <span className="text-white/60 font-inter text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── TABELA COMPARATIVA ──────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#111008' }}>
        <div className="max-w-5xl mx-auto px-4">
          <Section>
            <h2 className="font-playfair font-bold text-4xl text-white text-center mb-12">
              FiberBROWS vs <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #C9A96E, #B76E79)' }}>Alternativas</span>
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-white/8">
              <table className="w-full text-sm font-inter">
                <thead>
                  <tr style={{ background: 'rgba(201,169,110,0.08)' }}>
                    <th className="text-left text-white/50 font-semibold p-4 border-b border-white/8"> </th>
                    <th className="text-center text-golden font-bold p-4 border-b border-white/8 border-l border-white/8">FiberBROWS</th>
                    <th className="text-center text-white/60 font-semibold p-4 border-b border-white/8 border-l border-white/8">Transplante Capilar</th>
                    <th className="text-center text-white/60 font-semibold p-4 border-b border-white/8 border-l border-white/8">Micropigmentação</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Cirúrgico', 'Não ✓', 'Sim ✗', 'Não ✓'],
                    ['Invasividade', 'Mínima (2mm) ✓', 'Alta ✗', 'Moderada ~'],
                    ['Dor', 'Muito ligeira ✓', 'Elevada ✗', 'Moderada ~'],
                    ['Duração resultado', '6 meses', 'Permanente', '1-3 anos'],
                    ['Preço', 'A partir de €1.000 ✓', '€7.000–€30.000 ✗', '€200–€500'],
                    ['Recuperação', 'Mínima ✓', 'Semanas ✗', 'Dias ~'],
                  ].map(([label, fb, tc, mp], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td className="text-white/50 p-4 border-b border-white/5">{label}</td>
                      <td className="text-center text-golden/90 font-medium p-4 border-b border-white/5 border-l border-white/8">{fb}</td>
                      <td className="text-center text-white/40 p-4 border-b border-white/5 border-l border-white/8">{tc}</td>
                      <td className="text-center text-white/40 p-4 border-b border-white/5 border-l border-white/8">{mp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </section>

      {/* ── GALERIA ─────────────────────────────────────────────────────── */}
      <ServicoMediaGaleria servicoSlug="fiberbrows" accentColor="#C9A96E" />

      {/* ── INVESTIMENTO ────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#0d0a00' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Section>
            <div className="rounded-3xl border border-golden/20 p-10"
              style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.06) 0%, rgba(183,110,121,0.04) 100%)' }}>
              <span className="section-tag" style={{ color: '#C9A96E', borderColor: '#C9A96E33', background: '#C9A96E11' }}>
                Investimento
              </span>
              <p className="font-playfair font-bold text-6xl text-white mt-6 mb-2">A partir de</p>
              <p className="font-playfair font-bold text-7xl bg-clip-text text-transparent mb-4"
                style={{ backgroundImage: 'linear-gradient(135deg, #C9A96E, #B76E79)' }}>€1.000</p>
              <p className="text-white/50 font-inter text-base mb-8 max-w-md mx-auto">
                Alternativa altamente atrativa para quem procura resultados estéticos sem cirurgia.
                Valor exacto a confirmar em consulta.
              </p>
              <button onClick={openChat}
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold font-inter text-white text-lg transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #B76E79)', boxShadow: '0 8px 30px rgba(201,169,110,0.35)' }}>
                Agende a Sua Consulta
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Section>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#111008' }}>
        <div className="max-w-3xl mx-auto px-4">
          <Section>
            <h2 className="font-playfair font-bold text-4xl text-white text-center mb-12">
              Perguntas{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #C9A96E, #B76E79)' }}>
                Frequentes
              </span>
            </h2>
            <FAQAccordion />
          </Section>
        </div>
      </section>

      {/* ── COUNTDOWN + WAITLIST ─────────────────────────────────────────── */}
      <section id="waitlist" className="py-24"
        style={{ background: 'linear-gradient(135deg, #1a1205 0%, #0d0a00 100%)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Section>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-golden/30 bg-golden/8 mb-8">
              <Clock className="w-3.5 h-3.5 text-golden" />
              <span className="text-golden text-xs font-bold tracking-widest uppercase font-inter">
                Disponível a partir de Maio 2026
              </span>
            </div>

            <h2 className="font-playfair font-bold text-4xl text-white mb-4">
              Brevemente Disponível
            </h2>
            <p className="text-white/50 font-inter mb-12">
              Seja das primeiras a experimentar. Deixe o seu contacto e nós avisamos quando estiver disponível.
            </p>

            {/* Countdown */}
            <div className="flex justify-center gap-4 mb-14">
              {[
                { label: 'dias', value: time.days },
                { label: 'horas', value: time.hours },
                { label: 'min', value: time.minutes },
                { label: 'seg', value: time.seconds },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center rounded-2xl border border-golden/20 px-5 py-4 min-w-[70px]"
                  style={{ background: 'rgba(201,169,110,0.06)' }}>
                  <span className="font-playfair font-bold text-3xl text-golden tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                  <span className="text-white/40 text-xs font-inter mt-1">{unit.label}</span>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="rounded-2xl border border-white/8 p-8 text-left"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <WaitlistForm />
            </div>
          </Section>
        </div>
      </section>

      {/* ── BACK LINK ───────────────────────────────────────────────────── */}
      <div className="py-8 text-center" style={{ background: '#0d0a0b' }}>
        <Link href="/servicos" className="inline-flex items-center gap-2 text-white/40 hover:text-golden text-sm font-inter transition-colors">
          ← Ver todos os serviços
        </Link>
      </div>
    </div>
  )
}
