'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, ArrowLeft, Tag, Calendar } from 'lucide-react'
import type { BlogPost } from '@/lib/blogTypes'

interface Props {
  article: BlogPost
}

const categoryColors: Record<string, string> = {
  FiberBROWS: 'bg-golden/15 text-golden',
  Tricopigmentação: 'bg-sky-500/10 text-sky-400',
  Microblading: 'bg-rose-gold/10 text-rose-gold',
  Cuidados: 'bg-golden/10 text-golden-dark',
  Comparativo: 'bg-rose-gold/10 text-rose-gold-dark',
  Curiosidades: 'bg-golden/10 text-golden',
  Eyeliner: 'bg-rose-gold/10 text-rose-gold',
  Desmistificando: 'bg-golden/10 text-golden-dark',
}

function parseBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0
  let tableBuffer: string[] = []
  let inTable = false

  const flushTable = () => {
    if (tableBuffer.length < 2) { tableBuffer = []; inTable = false; return }
    const rows = tableBuffer.filter((l) => !l.match(/^\|[-| :]+\|$/))
    const headers = rows[0].split('|').filter((c) => c.trim() !== '').map((c) => c.trim())
    const bodyRows = rows.slice(1)
    elements.push(
      <div key={key++} className="overflow-x-auto my-6">
        <table className="w-full border-collapse text-sm font-inter">
          <thead><tr>{headers.map((h, i) => (
            <th key={i} className="bg-rose-gold/10 text-rose-gold font-semibold px-4 py-2 text-left border border-rose-gold/20">{h}</th>
          ))}</tr></thead>
          <tbody>{bodyRows.map((row, ri) => {
            const cells = row.split('|').filter((c) => c.trim() !== '').map((c) => c.trim())
            return (<tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-cream/50'}>
              {cells.map((cell, ci) => (<td key={ci} className="px-4 py-2 border border-rose-gold/10 text-text-secondary">{cell}</td>))}
            </tr>)
          })}</tbody>
        </table>
      </div>
    )
    tableBuffer = []; inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('|')) { inTable = true; tableBuffer.push(line); continue }
    if (inTable) flushTable()

    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="font-playfair font-bold text-2xl text-text-primary mt-10 mb-4">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="font-playfair font-bold text-xl text-rose-gold mt-8 mb-3">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) { items.push(lines[i].slice(2)); i++ }
      i--
      elements.push(<ul key={key++} className="list-none space-y-2 my-4 pl-2">{items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-text-secondary font-inter text-base leading-relaxed">
          <span className="text-rose-gold mt-1 flex-shrink-0">◆</span>
          <span dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
        </li>
      ))}</ul>)
    } else if (line.match(/^\d+\.\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      i--
      elements.push(<ol key={key++} className="list-none space-y-3 my-4 pl-2">{items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-text-secondary font-inter text-base leading-relaxed">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-gold text-white text-xs font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
        </li>
      ))}</ol>)
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="my-8 border-rose-gold/20" />)
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
    } else {
      elements.push(<p key={key++} className="text-text-secondary font-inter text-base leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: parseBold(line) }} />)
    }
  }
  if (inTable) flushTable()
  return elements
}

// ---- Fase 2: blocos ricos (creme + rose-gold), 100% opcionais e retrocompatíveis ----

// Título de secção opcional dentro de um bloco rico (mesmo estilo do "## " do texto).
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-playfair font-bold text-2xl text-text-primary mt-10 mb-4">{children}</h2>
  )
}

// Linha do tempo: horizontal no desktop (nós numerados sobre uma linha rose->golden),
// empilhada na vertical no mobile. 'note' opcional em texto pequeno por baixo.
function Timeline({ phases, note }: { phases: { label: string; text: string }[]; note?: string }) {
  return (
    <div className="my-8">
      {/* Desktop: horizontal */}
      <div className="hidden md:block relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-gold to-golden" />
        <div className="relative flex justify-between gap-4">
          {phases.map((p, i) => (
            <div key={i} className="flex-1 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-gold to-golden text-white font-bold flex items-center justify-center shadow-card z-10">
                {i + 1}
              </div>
              <p className="mt-3 font-semibold text-text-primary text-sm font-inter">{p.label}</p>
              <p className="mt-1 text-text-secondary text-sm font-inter leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Mobile: vertical */}
      <div className="md:hidden relative">
        <div className="absolute top-5 bottom-5 left-5 -translate-x-1/2 w-0.5 bg-gradient-to-b from-rose-gold to-golden" />
        <ol className="space-y-6 relative">
          {phases.map((p, i) => (
            <li key={i} className="flex gap-4">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-rose-gold to-golden text-white font-bold flex items-center justify-center shadow-card z-10">
                {i + 1}
              </div>
              <div className="pt-1">
                <p className="font-semibold text-text-primary text-sm font-inter">{p.label}</p>
                <p className="mt-0.5 text-text-secondary text-sm font-inter leading-relaxed">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {note && <p className="mt-6 text-text-muted text-sm font-inter italic">{note}</p>}
    </div>
  )
}

// Nº de colunas no desktop conforme a contagem de cartões (classes estáticas, purge-safe).
function techGridCols(n: number): string {
  if (n <= 1) return ''
  if (n === 2) return 'sm:grid-cols-2'
  if (n === 3) return 'sm:grid-cols-2 lg:grid-cols-3'
  return 'sm:grid-cols-2 lg:grid-cols-4'
}

// Grelha de cartões: título rose com traço rose->golden por cima + texto.
function TechniqueCards({ cards }: { cards: { title: string; text: string }[] }) {
  return (
    <div className={`my-8 grid grid-cols-1 gap-4 ${techGridCols(cards.length)}`}>
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white border border-cream-dark shadow-card p-6 overflow-hidden"
        >
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-rose-gold to-golden mb-4" />
          <h3 className="font-playfair font-bold text-lg text-rose-gold mb-2">{c.title}</h3>
          <p className="text-text-secondary text-sm font-inter leading-relaxed">{c.text}</p>
        </div>
      ))}
    </div>
  )
}

// Checklist de cuidados: "Deve fazer" (✓ verde) e "Deve evitar" (✕ rose), lado a lado.
function CareChecklist({ doItems, dontItems }: { doItems?: string[]; dontItems?: string[] }) {
  return (
    <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {doItems && doItems.length > 0 && (
        <div className="rounded-2xl bg-white border border-cream-dark shadow-card p-6">
          <h3 className="font-playfair font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
            <span className="text-green-600">✓</span> Deve fazer
          </h3>
          <ul className="space-y-2">
            {doItems.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-text-secondary text-sm font-inter leading-relaxed">
                <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {dontItems && dontItems.length > 0 && (
        <div className="rounded-2xl bg-white border border-cream-dark shadow-card p-6">
          <h3 className="font-playfair font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
            <span className="text-rose-gold">✕</span> Deve evitar
          </h3>
          <ul className="space-y-2">
            {dontItems.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-text-secondary text-sm font-inter leading-relaxed">
                <span className="text-rose-gold mt-0.5 flex-shrink-0">✕</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Linha de "pills" rose-gold suave.
function Chips({ items }: { items: string[] }) {
  return (
    <div className="my-6 flex flex-wrap gap-2">
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose-gold/10 text-rose-gold-dark text-sm font-inter font-medium border border-rose-gold/20"
        >
          {it}
        </span>
      ))}
    </div>
  )
}

export default function BlogPostPage({ article }: Props) {
  const formatDate = (dateStr: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div className="pt-20 min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215] overflow-hidden">
        {article.coverUrl && (
          <>
            <Image
              src={article.coverUrl}
              alt={article.title}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a1a1f]/80 to-[#1a1215]/90" />
          </>
        )}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-inter text-sm mb-8">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Blog
            </Link>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter ${categoryColors[article.category] ?? 'bg-white/10 text-white'}`}>
                <Tag className="w-3 h-3" /> {article.category}
              </span>
              <span className="text-white/50 text-xs font-inter flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime} leitura</span>
              <span className="text-white/50 text-xs font-inter flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(article.date)}</span>
            </div>
            <h1 className="font-playfair font-bold text-3xl md:text-5xl text-white leading-tight">{article.title}</h1>
            <p className="mt-4 text-white/70 font-inter text-lg leading-relaxed">{article.excerpt}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-white rounded-3xl shadow-card p-8 md:p-12">
            {article.blocks.map((block, idx) => {
              if (block.type === 'image' && block.url) {
                return (
                  <figure key={idx} className="my-8">
                    <Image
                      src={block.url}
                      alt={block.legenda || article.title}
                      width={1200}
                      height={800}
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="w-full h-auto rounded-2xl shadow-card"
                    />
                    {block.legenda && (
                      <figcaption className="mt-3 text-center text-text-muted text-sm font-inter italic">{block.legenda}</figcaption>
                    )}
                  </figure>
                )
              }
              if (block.type === 'text' && block.text) {
                return <div key={idx}>{renderContent(block.text)}</div>
              }
              if (block.type === 'timeline' && block.phases) {
                return (
                  <div key={idx}>
                    {block.title && <SectionTitle>{block.title}</SectionTitle>}
                    <Timeline phases={block.phases} note={block.note} />
                  </div>
                )
              }
              if (block.type === 'techniqueCards' && block.cards) {
                return (
                  <div key={idx}>
                    {block.title && <SectionTitle>{block.title}</SectionTitle>}
                    <TechniqueCards cards={block.cards} />
                  </div>
                )
              }
              if (block.type === 'careChecklist' && (block.doItems || block.dontItems)) {
                return (
                  <div key={idx}>
                    {block.title && <SectionTitle>{block.title}</SectionTitle>}
                    <CareChecklist doItems={block.doItems} dontItems={block.dontItems} />
                  </div>
                )
              }
              if (block.type === 'chips' && block.items) {
                return (
                  <div key={idx}>
                    {block.title && <SectionTitle>{block.title}</SectionTitle>}
                    <Chips items={block.items} />
                  </div>
                )
              }
              return null
            })}
          </motion.div>

          <div className="mt-8 text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 text-rose-gold font-semibold font-inter hover:gap-3 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" /> Ver Todos os Artigos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
