'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, ArrowLeft, Tag, Calendar } from 'lucide-react'
import type { BlogArticle } from './blogContent'

interface Props {
  article: BlogArticle
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

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  let tableBuffer: string[] = []
  let inTable = false

  const flushTable = () => {
    if (tableBuffer.length < 2) {
      tableBuffer = []
      inTable = false
      return
    }
    // Parse markdown table
    const rows = tableBuffer.filter((l) => !l.match(/^\|[-| :]+\|$/))
    const headers = rows[0]
      .split('|')
      .filter((c) => c.trim() !== '')
      .map((c) => c.trim())
    const bodyRows = rows.slice(1)

    elements.push(
      <div key={key++} className="overflow-x-auto my-6">
        <table className="w-full border-collapse text-sm font-inter">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="bg-rose-gold/10 text-rose-gold font-semibold px-4 py-2 text-left border border-rose-gold/20"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => {
              const cells = row
                .split('|')
                .filter((c) => c.trim() !== '')
                .map((c) => c.trim())
              return (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-cream/50'}>
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-2 border border-rose-gold/10 text-text-secondary"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
    tableBuffer = []
    inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Table detection
    if (line.startsWith('|')) {
      inTable = true
      tableBuffer.push(line)
      continue
    }
    if (inTable) {
      flushTable()
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="font-playfair font-bold text-2xl text-text-primary mt-10 mb-4">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="font-playfair font-bold text-xl text-rose-gold mt-8 mb-3">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Collect list items
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      i-- // back up one since outer loop will increment
      elements.push(
        <ul key={key++} className="list-none space-y-2 my-4 pl-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-text-secondary font-inter text-base leading-relaxed">
              <span className="text-rose-gold mt-1 flex-shrink-0">◆</span>
              <span dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
            </li>
          ))}
        </ul>
      )
    } else if (line.match(/^\d+\.\s/)) {
      // Collect numbered list
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      i--
      elements.push(
        <ol key={key++} className="list-none space-y-3 my-4 pl-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-text-secondary font-inter text-base leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-gold text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: parseBold(item) }} />
            </li>
          ))}
        </ol>
      )
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="my-8 border-rose-gold/20" />)
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
    } else {
      elements.push(
        <p
          key={key++}
          className="text-text-secondary font-inter text-base leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: parseBold(line) }}
        />
      )
    }
  }

  if (inTable) flushTable()

  return elements
}

function parseBold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
}

export default function BlogPostPage({ article }: Props) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div className="pt-20 min-h-screen bg-cream">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-[#2a1a1f] to-[#1a1215]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-inter text-sm mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Blog
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-inter ${
                  categoryColors[article.category] ?? 'bg-white/10 text-white'
                }`}
              >
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
              <span className="text-white/50 text-xs font-inter flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime} leitura
              </span>
              <span className="text-white/50 text-xs font-inter flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(article.date)}
              </span>
            </div>

            <h1 className="font-playfair font-bold text-3xl md:text-5xl text-white leading-tight">
              {article.title}
            </h1>

            <p className="mt-4 text-white/70 font-inter text-lg leading-relaxed">
              {article.excerpt}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-card p-8 md:p-12"
          >
            {renderContent(article.content)}
          </motion.div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-rose-gold font-semibold font-inter hover:gap-3 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver Todos os Artigos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
