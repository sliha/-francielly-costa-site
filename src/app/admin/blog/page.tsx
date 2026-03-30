'use client'
import { useState } from 'react'
import { PlusCircle, Edit2, Trash2, Eye, EyeOff, FileText, Calendar } from 'lucide-react'

// TODO: Replace with Firestore query — collection('blog').orderBy('criadoEm', 'desc')
const mockPosts = [
  {
    id: '1',
    titulo: 'O que é o Microblading? Tudo o que precisa de saber',
    slug: 'o-que-e-microblading',
    resumo: 'Microblading é uma técnica semipermanente que cria sobrancelhas naturais fio a fio...',
    publicado: true,
    criadoEm: '15 Mar 2026',
    categoria: 'Microblading',
  },
  {
    id: '2',
    titulo: 'Cuidados após a Micropigmentação Labial',
    slug: 'cuidados-micropigmentacao-labial',
    resumo: 'Após o procedimento é essencial seguir alguns cuidados para garantir o melhor resultado...',
    publicado: true,
    criadoEm: '10 Mar 2026',
    categoria: 'Cuidados',
  },
  {
    id: '3',
    titulo: 'Diferença entre Microblading e Microshading',
    slug: 'microblading-vs-microshading',
    resumo: 'Ambas as técnicas criam sobrancelhas perfeitas, mas de formas distintas...',
    publicado: false,
    criadoEm: '5 Mar 2026',
    categoria: 'Comparação',
  },
]

type Post = typeof mockPosts[0]

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts)

  const togglePublicado = (id: string) => {
    // TODO: Update Firestore — updateDoc(doc(db, 'blog', id), { publicado: !post.publicado })
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, publicado: !p.publicado } : p))
    )
  }

  const deletePost = (id: string) => {
    // TODO: Delete from Firestore — deleteDoc(doc(db, 'blog', id))
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Blog</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {posts.filter((p) => p.publicado).length} publicados · {posts.length} total
          </p>
        </div>
        <button className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors">
          <PlusCircle size={16} />
          <span className="hidden sm:inline">Novo Artigo</span>
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8">
        {posts.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
            <FileText size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">Nenhum artigo publicado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-gold/10 text-rose-gold">
                        {post.categoria}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          post.publicado
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {post.publicado ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-sm leading-snug">
                      {post.titulo}
                    </h3>
                    <p className="text-white/30 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {post.resumo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-white/25 text-xs">
                    <Calendar size={11} />
                    {post.criadoEm}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublicado(post.id)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        post.publicado
                          ? 'bg-white/5 text-white/40 hover:bg-white/10'
                          : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'
                      }`}
                    >
                      {post.publicado ? <EyeOff size={12} /> : <Eye size={12} />}
                      {post.publicado ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs bg-white/5 text-white/50 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                      <Edit2 size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="flex items-center gap-1.5 text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
