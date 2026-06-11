'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus, Save, Trash2, Eye, EyeOff, ArrowLeft, ExternalLink, Image as ImageIcon,
  Type, ArrowUp, ArrowDown, Upload, X,
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { uploadMedia, deleteMedia } from '@/lib/upload'
import { rowToPost, type BlogPost, type BlogBlock } from '@/lib/blogTypes'

const CATEGORIAS = ['FiberBROWS', 'Tricopigmentação', 'Microblading', 'Microshading', 'Eyeliner', 'Cuidados', 'Comparativo', 'Curiosidades', 'Desmistificando']

function toSlug(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
}
function todayIso() { return new Date().toISOString().slice(0, 10) }
function newPost(): BlogPost {
  return { id: crypto.randomUUID(), slug: '', title: '', excerpt: '', category: 'Microblading', readTime: '5 min', date: todayIso(), coverUrl: '', coverPath: '', blocks: [], published: false }
}

function toast(msg: string, error = false) {
  if (typeof window === 'undefined') return
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${error ? '#EF4444' : '#10B981'};color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;z-index:9999;max-width:90vw;text-align:center`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugLocked, setSlugLocked] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingBlock, setUploadingBlock] = useState(false)
  const coverRef = useRef<HTMLInputElement | null>(null)
  const blockImgRef = useRef<HTMLInputElement | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('date', { ascending: false })
    setPosts((data ?? []).map(rowToPost))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const startNew = () => { setEditing(newPost()); setSlugLocked(false) }
  const startEdit = (p: BlogPost) => { setEditing({ ...p, blocks: [...p.blocks] }); setSlugLocked(true) }
  const patch = (p: Partial<BlogPost>) => setEditing((cur) => (cur ? { ...cur, ...p } : cur))

  const setTitle = (title: string) => {
    setEditing((cur) => {
      if (!cur) return cur
      const next = { ...cur, title }
      if (!slugLocked) next.slug = toSlug(title)
      return next
    })
  }

  // ── Blocos ──
  const addText = () => patch({ blocks: [...(editing?.blocks ?? []), { type: 'text', text: '' }] })
  const updateBlock = (i: number, b: Partial<BlogBlock>) => {
    if (!editing) return
    const blocks = editing.blocks.map((blk, idx) => (idx === i ? { ...blk, ...b } : blk))
    patch({ blocks })
  }
  const removeBlock = async (i: number) => {
    if (!editing) return
    const blk = editing.blocks[i]
    if (blk.type === 'image' && blk.path) await deleteMedia(blk.path)
    patch({ blocks: editing.blocks.filter((_, idx) => idx !== i) })
  }
  const moveBlock = (i: number, dir: -1 | 1) => {
    if (!editing) return
    const j = i + dir
    if (j < 0 || j >= editing.blocks.length) return
    const blocks = [...editing.blocks]
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
    patch({ blocks })
  }

  const handleCover = async (file: File) => {
    if (!editing) return
    setUploadingCover(true)
    try {
      const path = `blog/${editing.slug || editing.id}/cover_${Date.now()}`
      const { url, path: p } = await uploadMedia(file, path)
      patch({ coverUrl: url, coverPath: p })
      toast('Capa carregada!')
    } catch (e) { toast(e instanceof Error ? e.message : 'Erro no upload.', true) }
    finally { setUploadingCover(false) }
  }

  const handleBlockImage = async (file: File) => {
    if (!editing) return
    setUploadingBlock(true)
    try {
      const path = `blog/${editing.slug || editing.id}/img_${Date.now()}`
      const { url, path: p } = await uploadMedia(file, path)
      patch({ blocks: [...editing.blocks, { type: 'image', url, path: p, legenda: '' }] })
      toast('Foto adicionada!')
    } catch (e) { toast(e instanceof Error ? e.message : 'Erro no upload.', true) }
    finally { setUploadingBlock(false) }
  }

  const save = async () => {
    if (!editing) return
    if (!editing.title.trim()) { toast('O título é obrigatório.', true); return }
    if (!editing.slug.trim()) { toast('O link (slug) é obrigatório.', true); return }
    setSaving(true)
    try {
      const row = {
        id: editing.id, slug: editing.slug, title: editing.title, excerpt: editing.excerpt,
        category: editing.category, read_time: editing.readTime, date: editing.date || null,
        cover_url: editing.coverUrl, cover_path: editing.coverPath, blocks: editing.blocks,
        published: editing.published, atualizado_em: new Date().toISOString(),
      }
      const { error } = await supabase.from('blog_posts').upsert(row, { onConflict: 'id' })
      if (error) throw error
      toast('Artigo guardado!')
      setEditing(null)
      await load()
    } catch (e) { toast(e instanceof Error ? e.message : 'Erro ao guardar.', true) }
    finally { setSaving(false) }
  }

  const togglePublished = async (p: BlogPost) => {
    await supabase.from('blog_posts').update({ published: !p.published }).eq('id', p.id)
    load()
  }

  const remove = async (p: BlogPost) => {
    if (!confirm(`Eliminar "${p.title}"? Esta ação é permanente.`)) return
    if (p.coverPath) await deleteMedia(p.coverPath)
    for (const b of p.blocks) if (b.type === 'image' && b.path) await deleteMedia(b.path)
    await supabase.from('blog_posts').delete().eq('id', p.id)
    toast('Artigo eliminado.')
    load()
  }

  // ─────────────────────────── EDITOR ───────────────────────────
  if (editing) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white">
        <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0F0F0F] z-10">
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-white/60 hover:text-white text-sm">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => patch({ published: !editing.published })}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl ${editing.published ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
              {editing.published ? <Eye size={13} /> : <EyeOff size={13} />} {editing.published ? 'Publicado' : 'Rascunho'}
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-rose-gold text-white hover:bg-opacity-90 disabled:opacity-50">
              {saving ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save size={14} />} Guardar
            </button>
          </div>
        </div>

        <div className="px-4 md:px-6 pb-12 pt-4 max-w-3xl mx-auto space-y-4">
          {/* Capa */}
          <div>
            <label className="text-white/40 text-xs mb-2 block">Foto de capa (aparece na lista do blog)</label>
            {editing.coverUrl ? (
              <div className="relative w-full max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editing.coverUrl} alt="capa" className="w-full aspect-video object-cover rounded-xl" />
                <button onClick={() => { if (editing.coverPath) deleteMedia(editing.coverPath); patch({ coverUrl: '', coverPath: '' }) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center"><Trash2 size={13} /></button>
              </div>
            ) : (
              <>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCover(f); e.target.value = '' }} />
                <button onClick={() => coverRef.current?.click()} disabled={uploadingCover}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs px-3 py-2 rounded-xl disabled:opacity-50">
                  {uploadingCover ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> A enviar…</> : <><Upload size={13} /> Carregar capa</>}
                </button>
              </>
            )}
          </div>

          {/* Campos */}
          <div>
            <label className="text-white/40 text-xs mb-1 block">Título</label>
            <input value={editing.title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do artigo"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Link (slug)</label>
              <input value={editing.slug} onChange={(e) => { setSlugLocked(true); patch({ slug: toSlug(e.target.value) }) }} placeholder="link-do-artigo"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Categoria</label>
              <input list="cats" value={editing.category} onChange={(e) => patch({ category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50" />
              <datalist id="cats">{CATEGORIAS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Data</label>
              <input type="date" value={editing.date} onChange={(e) => patch({ date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Tempo de leitura</label>
              <input value={editing.readTime} onChange={(e) => patch({ readTime: e.target.value })} placeholder="Ex: 5 min"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50" />
            </div>
          </div>
          <div>
            <label className="text-white/40 text-xs mb-1 block">Resumo (aparece na lista)</label>
            <textarea value={editing.excerpt} rows={2} onChange={(e) => patch({ excerpt: e.target.value })} placeholder="Resumo curto do artigo"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 resize-y" />
          </div>

          {/* Blocos */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-semibold">Conteúdo (blocos)</h3>
              <div className="flex gap-2">
                <button onClick={addText} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg"><Type size={12} /> Texto</button>
                <input ref={blockImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBlockImage(f); e.target.value = '' }} />
                <button onClick={() => blockImgRef.current?.click()} disabled={uploadingBlock} className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg disabled:opacity-50">
                  {uploadingBlock ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ImageIcon size={12} />} Foto
                </button>
              </div>
            </div>
            <p className="text-white/30 text-xs mb-3">Adiciona blocos de texto e fotos pela ordem que quiseres (como páginas). O texto aceita markdown (## títulos, **negrito**, listas).</p>

            <div className="space-y-3">
              {editing.blocks.length === 0 && <p className="text-white/20 text-xs text-center py-6">Sem conteúdo. Adiciona um bloco de texto ou foto acima.</p>}
              {editing.blocks.map((block, i) => (
                <div key={i} className="bg-[#1A1A1A] rounded-xl border border-white/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs flex items-center gap-1.5">
                      {block.type === 'image' ? <ImageIcon size={12} /> : <Type size={12} />} {block.type === 'image' ? 'Foto' : 'Texto'} #{i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="p-1 text-white/40 hover:text-white disabled:opacity-20"><ArrowUp size={13} /></button>
                      <button onClick={() => moveBlock(i, 1)} disabled={i === editing.blocks.length - 1} className="p-1 text-white/40 hover:text-white disabled:opacity-20"><ArrowDown size={13} /></button>
                      <button onClick={() => removeBlock(i)} className="p-1 text-white/40 hover:text-red-400"><X size={14} /></button>
                    </div>
                  </div>
                  {block.type === 'text' ? (
                    <textarea value={block.text || ''} rows={5} onChange={(e) => updateBlock(i, { text: e.target.value })} placeholder="Escreve aqui (markdown)…"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-gold/50 resize-y" />
                  ) : (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={block.url} alt="" className="w-full max-w-sm rounded-lg mb-2" />
                      <input value={block.legenda || ''} onChange={(e) => updateBlock(i, { legenda: e.target.value })} placeholder="Legenda / texto da foto (opcional)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-gold/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────── LISTA ───────────────────────────
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Blog</h1>
          <p className="text-white/40 text-xs mt-0.5">{posts.filter((p) => p.published).length} publicados · {posts.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/blog" target="_blank" className="flex items-center gap-1.5 bg-white/5 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl"><ExternalLink size={13} /> Ver Blog</Link>
          <button onClick={startNew} className="flex items-center gap-1.5 bg-rose-gold text-white text-xs px-3 py-2 rounded-xl hover:bg-opacity-90"><Plus size={14} /> Novo artigo</button>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 pt-4 space-y-3">
        {loading && <p className="text-white/30 text-sm text-center py-10">A carregar…</p>}
        {!loading && posts.length === 0 && <p className="text-white/30 text-sm text-center py-10">Ainda não há artigos. Cria o primeiro com &quot;Novo artigo&quot;.</p>}
        {posts.map((post) => (
          <div key={post.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
              {post.coverUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={post.coverUrl} alt="" className="w-full h-full object-cover" />
                : <ImageIcon size={18} className="text-white/20" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-gold/10 text-rose-gold">{post.category}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${post.published ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>{post.published ? 'Publicado' : 'Rascunho'}</span>
              </div>
              <h3 className="text-white font-medium text-sm leading-snug truncate">{post.title}</h3>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => togglePublished(post)} title={post.published ? 'Despublicar' : 'Publicar'} className="p-2 text-white/40 hover:text-white">{post.published ? <Eye size={15} /> : <EyeOff size={15} />}</button>
              <button onClick={() => startEdit(post)} className="text-xs bg-white/5 hover:bg-white/10 text-white/70 px-3 py-1.5 rounded-lg">Editar</button>
              <button onClick={() => remove(post)} className="p-2 text-white/40 hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
