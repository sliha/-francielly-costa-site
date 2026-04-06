'use client'

import { useState } from 'react'
import { Eye, FileText, Calendar, Clock, Tag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { blogArticles } from '@/components/blog/blogContent'

export default function BlogAdminPage() {
  const [filter, setFilter] = useState<'todos' | 'publicado'>('todos')

  // All blog articles are static/published — managed in blogContent.ts
  const posts = blogArticles.map((a) => ({
    ...a,
    publicado: true,
  }))

  const filtered = filter === 'todos' ? posts : posts.filter((p) => p.publicado)

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Blog</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {posts.filter((p) => p.publicado).length} publicados · {posts.length} total
          </p>
        </div>
        <Link
          href="/blog"
          target="_blank"
          className="flex items-center gap-1.5 bg-white/5 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-colors"
        >
          <ExternalLink size={13} />
          Ver Blog
        </Link>
      </div>

      {/* Info banner */}
      <div className="mx-4 md:mx-6 mt-4 bg-golden/10 border border-golden/20 rounded-2xl p-4 flex items-start gap-3">
        <FileText size={16} className="text-golden mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-golden text-sm font-semibold">Artigos geridos em código</p>
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
            Os artigos do blog são estáticos e geridos em{' '}
            <code className="text-white/60 bg-white/5 px-1 rounded">src/components/blog/blogContent.ts</code>.
            Para adicionar ou editar artigos, actualiza esse ficheiro e faz deploy.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 px-4 md:px-6 mt-4">
        {(['todos', 'publicado'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors capitalize ${
              filter === f ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}>
            {f === 'todos' ? 'Todos' : 'Publicados'}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-6 pb-8 pt-3 space-y-3">
        {filtered.map((post) => (
          <div key={post.slug} className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-gold/10 text-rose-gold flex items-center gap-1">
                    <Tag size={9} />
                    {post.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">
                    Publicado
                  </span>
                  <span className="text-white/25 text-xs flex items-center gap-1">
                    <Clock size={10} />
                    {post.readTime} leitura
                  </span>
                </div>
                <h3 className="text-white font-medium text-sm leading-snug mb-1">
                  {post.title}
                </h3>
                <p className="text-white/30 text-xs leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-white/25 text-xs">
                <Calendar size={11} />
                {new Date(post.date).toLocaleDateString('pt-PT', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </div>
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs bg-white/5 text-white/50 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Eye size={12} />
                Ver Artigo
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
