'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Sparkles, Eye, Scissors, ScanFace, FlaskConical, ClipboardList,
  Paintbrush, Lightbulb, Ruler, Smile, ShieldCheck, GraduationCap,
  Download, BookOpen, BookOpenCheck, HeartHandshake, ArrowLeft, ArrowRight,
  Quote, FileText, Check,
} from 'lucide-react'
import EbookReader from './EbookReader'
import {
  EBOOK, ebookPages, previewPageIndexes, ebookStats, ebookModules,
  methodRules, ebookQuotes, ebookBenefits,
} from './ebookData'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Eye, Scissors, ScanFace, FlaskConical, ClipboardList,
  Paintbrush, Lightbulb, Ruler, Smile, ShieldCheck, GraduationCap,
  Download, BookOpenCheck, HeartHandshake,
}

function Icon({ name, className }: { name: string; className?: string }) {
  const C = iconMap[name] ?? Sparkles
  return <C className={className} />
}

export default function EbookLanding() {
  const [readerOpen, setReaderOpen] = useState(false)
  const [startPage, setStartPage] = useState(0)

  const openReader = (page = 0) => {
    setStartPage(page)
    setReaderOpen(true)
  }

  const { ref: modRef, inView: modIn } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <div className="bg-cream">
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2a1a1f] to-[#140d10] pt-28 pb-20 md:pt-36 md:pb-28">
        {/* Decoração */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-golden/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Texto */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors font-inter text-sm mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Blog
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full bg-rose-gold/15 border border-rose-gold/30 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-golden-light font-inter mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                eBook Gratuito · {EBOOK.method}
              </span>

              <h1 className="font-playfair font-bold text-white leading-[1.05] text-4xl md:text-6xl">
                {EBOOK.title.split(' o ')[0]} o{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #D4A0A8, #C9A96E)' }}
                >
                  Sucesso
                </span>
              </h1>

              <p className="mt-3 font-playfair italic text-xl text-white/70">{EBOOK.subtitle}</p>

              <p className="mt-6 text-white/70 font-inter text-base md:text-lg leading-relaxed max-w-xl">
                {EBOOK.tagline} Um guia de <strong className="text-white">{EBOOK.pageCount} páginas</strong> com
                ferramentas, anatomia, ética e o sistema de medição que cria sobrancelhas perfeitas
                para cada rosto.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={EBOOK.pdf}
                  download
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-rose-gold text-white font-semibold font-inter shadow-rose-lg hover:bg-rose-gold-dark hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  Descarregar eBook
                </a>
                <button
                  onClick={() => openReader(0)}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border-2 border-white/25 text-white font-semibold font-inter hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <BookOpen className="w-5 h-5" />
                  Folhear online
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/50 text-sm font-inter">
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-golden" /> Grátis</span>
                <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-golden" /> Sem registo</span>
                <span className="inline-flex items-center gap-1.5"><FileText className="w-4 h-4 text-golden" /> {EBOOK.fileSizeLabel}</span>
              </div>
            </motion.div>

            {/* Livro 3D */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              className="flex justify-center lg:justify-end"
              style={{ perspective: '1400px' }}
            >
              <button
                onClick={() => openReader(0)}
                aria-label="Abrir o leitor do eBook"
                className="group relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="relative transition-transform duration-700 ease-luxury group-hover:[transform:rotateY(-12deg)]"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-22deg) rotateX(4deg)' }}
                >
                  <Image
                    src={EBOOK.cover}
                    alt={`Capa do eBook ${EBOOK.title}`}
                    width={340}
                    height={531}
                    priority
                    className="rounded-r-lg rounded-l-sm shadow-2xl w-[240px] md:w-[320px] h-auto"
                  />
                  {/* Lombada */}
                  <div
                    className="absolute top-0 left-0 h-full w-[18px] bg-gradient-to-r from-black/60 to-black/10 rounded-l-sm"
                    style={{ transform: 'translateZ(-1px)' }}
                  />
                  {/* Brilho */}
                  <div className="pointer-events-none absolute inset-0 rounded-r-lg bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                {/* Sombra no chão */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-black/40 blur-xl rounded-full" />
                <span className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-white/50 text-xs font-inter inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Clica para folhear
                </span>
              </button>
            </motion.div>
          </div>

          {/* Estatísticas */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
            {ebookStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-5 text-center"
              >
                <p className="font-playfair font-bold text-3xl md:text-4xl bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #D4A0A8, #C9A96E)' }}>
                  {s.value}
                </p>
                <p className="mt-1 text-white/60 text-xs md:text-sm font-inter">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── BENEFÍCIOS ──────────────────── */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {ebookBenefits.map((b) => (
            <div key={b.title} className="card-luxury p-7 text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-rose flex items-center justify-center">
                <Icon name={b.icon} className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-playfair font-bold text-lg text-text-primary mb-2">{b.title}</h3>
              <p className="text-text-secondary font-inter text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── CURRÍCULO (12 MÓDULOS) ──────────────────── */}
      <section ref={modRef} className="py-16 md:py-24 bg-cream-dark/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-tag">O que vais aprender</span>
            <h2 className="section-title">12 módulos, do primeiro traço à mestria</h2>
            <div className="divider-rose" />
            <p className="section-subtitle">
              Um percurso completo que acompanha a formação presencial da Francielly Costa — estruturado,
              prático e ao alcance de todos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ebookModules.map((m, i) => (
              <motion.div
                key={m.n}
                initial={{ opacity: 0, y: 24 }}
                animate={modIn ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 + Math.floor(i / 3) * 0.05 }}
                className="group relative bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <span className="absolute -top-3 -right-2 font-playfair font-bold text-7xl text-rose-gold/5 group-hover:text-rose-gold/10 transition-colors select-none">
                  {String(m.n).padStart(2, '0')}
                </span>
                <div className="relative">
                  <div className="mb-4 w-12 h-12 rounded-xl bg-rose-gold/10 text-rose-gold flex items-center justify-center group-hover:bg-rose-gold group-hover:text-white transition-colors">
                    <Icon name={m.icon} className="w-6 h-6" />
                  </div>
                  <h3 className="font-playfair font-bold text-lg text-text-primary mb-3">{m.title}</h3>
                  <ul className="space-y-1.5">
                    {m.topics.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-text-secondary font-inter text-sm">
                        <span className="text-rose-gold mt-0.5 flex-shrink-0">◆</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── MÉTODO (MEDIÇÃO) ──────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-tag">A assinatura do método</span>
              <h2 className="section-title">A matemática por trás da sobrancelha perfeita</h2>
              <div className="divider-rose-left" />
              <p className="section-subtitle mb-8">
                O <strong className="text-text-primary">{EBOOK.method}</strong> transforma o design
                num processo preciso e replicável. Em vez de adivinhar, mede-se — e o resultado é
                personalizado para cada formato de rosto.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {methodRules.map((r) => (
                  <div key={r.label} className="rounded-2xl border border-rose-gold/15 bg-white p-5 shadow-card">
                    <p className="text-xs font-inter uppercase tracking-wider text-text-muted">{r.label}</p>
                    <p className="font-playfair font-bold text-2xl text-rose-gold my-1">{r.value}</p>
                    <p className="text-text-secondary font-inter text-sm leading-snug">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Página real do método */}
            <div className="relative">
              <button
                onClick={() => openReader(24)}
                className="group block w-full"
                aria-label="Abrir a página do método no leitor"
              >
                <div className="absolute -inset-4 bg-gradient-rose opacity-10 blur-2xl rounded-3xl" />
                <Image
                  src={ebookPages[24]}
                  alt="Página do Método Francielly Costa — medição das sobrancelhas"
                  width={540}
                  height={844}
                  className="relative rounded-2xl shadow-card-hover ring-1 ring-rose-gold/10 mx-auto w-[280px] md:w-[360px] h-auto group-hover:-translate-y-1 transition-transform duration-300"
                />
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-dark-bg/80 backdrop-blur px-4 py-2 text-white text-xs font-inter">
                  <BookOpen className="w-3.5 h-3.5" /> Ver no eBook
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── CITAÇÃO / FILOSOFIA ──────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#2a1a1f] to-[#140d10] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-rose-gold/10 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Quote className="w-12 h-12 text-rose-gold/60 mx-auto mb-6" />
          <blockquote className="font-playfair italic font-medium text-2xl md:text-4xl text-white leading-snug">
            “{ebookQuotes[0].text}”
          </blockquote>
          <p className="mt-6 text-golden-light font-inter text-sm tracking-widest uppercase">
            {ebookQuotes[0].source}
          </p>

          <div className="mt-12 grid sm:grid-cols-2 gap-4 text-left">
            {ebookQuotes.slice(1).map((q) => (
              <div key={q.source} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <p className="font-playfair italic text-white/90 text-lg leading-snug">“{q.text}”</p>
                <p className="mt-3 text-white/40 text-xs font-inter">{q.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── PRÉ-VISUALIZAÇÃO ──────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="section-tag">Espreita por dentro</span>
            <h2 className="section-title">Folheia antes de descarregar</h2>
            <div className="divider-rose" />
            <p className="section-subtitle">
              Cada página foi desenhada com cuidado. Toca numa página para abrir o leitor interativo —
              ou descarrega o PDF completo.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {previewPageIndexes.map((p) => (
              <button
                key={p}
                onClick={() => openReader(p)}
                className="group relative rounded-xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ring-1 ring-black/5"
                aria-label={`Abrir página ${p + 1} no leitor`}
              >
                <Image
                  src={ebookPages[p]}
                  alt={`${EBOOK.title} — página ${p + 1}`}
                  width={300}
                  height={469}
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 bg-dark-bg/0 group-hover:bg-dark-bg/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-white/90 text-text-primary text-xs font-semibold font-inter px-3 py-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Página {p + 1}
                  </span>
                </div>
              </button>
            ))}

            {/* Cartão "ver tudo" */}
            <button
              onClick={() => openReader(0)}
              className="group rounded-xl bg-gradient-rose text-white flex flex-col items-center justify-center p-6 text-center shadow-rose hover:-translate-y-1 transition-all duration-300 min-h-[180px]"
            >
              <BookOpen className="w-8 h-8 mb-3" />
              <span className="font-playfair font-bold text-lg leading-tight">Ler o eBook completo</span>
              <span className="text-white/80 text-xs font-inter mt-1">{EBOOK.pageCount} páginas · leitor interativo</span>
              <ArrowRight className="w-5 h-5 mt-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────── CTA FINAL ──────────────────── */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-gold to-rose-gold-dark px-8 py-14 md:px-16 md:py-16 text-center shadow-rose-lg">
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-golden/20 blur-2xl" />
            <div className="relative">
              <h2 className="font-playfair font-bold text-3xl md:text-5xl text-white leading-tight">
                Leva o teu exemplar de <span className="text-golden-light">A Chave para o Sucesso</span>
              </h2>
              <p className="mt-4 text-white/85 font-inter text-base md:text-lg max-w-2xl mx-auto">
                O conhecimento que transforma carreiras — gratuito, para qualquer pessoa que queira começar
                ou aperfeiçoar-se na arte do design de sobrancelhas.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={EBOOK.pdf}
                  download
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-rose-gold-dark font-semibold font-inter hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
                >
                  <Download className="w-5 h-5" />
                  Descarregar PDF grátis
                </a>
                <Link
                  href="/agendar"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/60 text-white font-semibold font-inter hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Agendar uma consulta
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <p className="mt-6 text-white/60 text-xs font-inter">
                Atelier Francielly Costa · Braga, Portugal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leitor interativo */}
      <EbookReader
        pages={ebookPages}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
        initialPage={startPage}
        title={`${EBOOK.title} — ${EBOOK.subtitle}`}
        pdf={EBOOK.pdf}
      />
    </div>
  )
}
