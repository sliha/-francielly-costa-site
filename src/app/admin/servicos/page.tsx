'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Save, Eye, EyeOff, Euro, Upload, Trash2, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { uploadMedia, deleteMedia } from '@/lib/upload'
import { services as STATIC_SERVICES } from '@/data/services'

interface Servico {
  id: string
  nome: string
  descricao: string
  preco: string
  ativo: boolean
  destaque: boolean
  fotoUrl: string
  fotoPath: string
}

// Defaults a partir dos serviços estáticos (nome + descrição curta)
const DEFAULT_SERVICOS: Servico[] = STATIC_SERVICES.map((s) => ({
  id: s.id,
  nome: s.name,
  descricao: s.shortDescription,
  preco: s.priceRange || '',
  ativo: true,
  destaque: s.slug === 'fiberbrows',
  fotoUrl: '',
  fotoPath: '',
}))

function toast(msg: string, error = false) {
  if (typeof window === 'undefined') return
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${error ? '#EF4444' : '#10B981'};color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;z-index:9999;font-family:Inter,sans-serif;max-width:90vw;text-align:center`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

export default function ServicosAdminPage() {
  const [servicos, setServicos] = useState<Servico[]>(DEFAULT_SERVICOS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'servicos')
      .maybeSingle()
      .then(({ data }) => {
        const lista = (data?.value as { lista?: Partial<Servico>[] } | null)?.lista
        if (!Array.isArray(lista)) return
        // merge: DB sobre defaults estáticos (preenche nome/descrição em falta)
        const staticById = Object.fromEntries(DEFAULT_SERVICOS.map((d) => [d.id, d]))
        setServicos(
          lista.map((s) => {
            const base = staticById[s.id || ''] || ({} as Servico)
            return {
              id: s.id || base.id,
              nome: s.nome ?? base.nome ?? '',
              descricao: s.descricao ?? base.descricao ?? '',
              preco: s.preco ?? base.preco ?? '',
              ativo: s.ativo ?? base.ativo ?? true,
              destaque: s.destaque ?? base.destaque ?? false,
              fotoUrl: s.fotoUrl || '',
              fotoPath: s.fotoPath || '',
            }
          })
        )
      })
  }, [])

  const update = (id: string, patch: Partial<Servico>) => {
    setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    setSaved(false)
  }

  const handleFotoUpload = async (id: string, file: File) => {
    setUploading((p) => ({ ...p, [id]: true }))
    try {
      const path = `servicos/${id}/foto_${Date.now()}`
      const { url, path: p } = await uploadMedia(file, path)
      update(id, { fotoUrl: url, fotoPath: p })
      toast('Foto carregada! Guarda para aplicar.')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao fazer upload.', true)
    } finally {
      setUploading((p) => { const n = { ...p }; delete n[id]; return n })
    }
  }

  const handleFotoRemove = async (id: string) => {
    const servico = servicos.find((s) => s.id === id)
    if (servico?.fotoPath) await deleteMedia(servico.fotoPath)
    update(id, { fotoUrl: '', fotoPath: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('settings').upsert(
        { key: 'servicos', value: { lista: servicos }, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
      if (error) throw error
      setSaved(true)
      toast('Serviços guardados com sucesso!')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast('Erro ao guardar.', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0F0F0F] z-10">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Serviços & Preços</h1>
          <p className="text-white/40 text-xs mt-0.5">Editar nome, descrição, preço, foto e visibilidade</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            saved ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-rose-gold text-white hover:bg-opacity-90'
          } disabled:opacity-50`}>
          {saving ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
          {saving ? 'A guardar...' : saved ? 'Guardado!' : 'Guardar'}
        </button>
      </div>

      <div className="px-4 md:px-6 pb-8 pt-4 space-y-3">
        <p className="text-white/30 text-xs">
          As alterações são guardadas na base de dados e refletidas no site público.
        </p>

        {servicos.map((s) => (
          <div key={s.id}
            className={`bg-[#1A1A1A] rounded-2xl p-4 border transition-colors ${
              s.ativo ? 'border-white/5' : 'border-white/5 opacity-60'
            }`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-white/30 text-xs">ID: {s.id}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => update(s.id, { destaque: !s.destaque })}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    s.destaque ? 'bg-golden/15 text-golden' : 'bg-white/5 text-white/30'
                  }`}>
                  <Star size={11} className={s.destaque ? 'fill-golden' : ''} />
                  {s.destaque ? 'Destaque' : 'Normal'}
                </button>
                <button onClick={() => update(s.id, { ativo: !s.ativo })}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${
                    s.ativo ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/30'
                  }`}>
                  {s.ativo ? <Eye size={11} /> : <EyeOff size={11} />}
                  {s.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>

            {/* Nome */}
            <div className="mb-3">
              <label className="text-white/40 text-xs mb-1 block">Nome</label>
              <input type="text" value={s.nome}
                onChange={(e) => update(s.id, { nome: e.target.value })}
                placeholder="Nome do serviço"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 placeholder:text-white/20" />
            </div>

            {/* Descrição */}
            <div className="mb-3">
              <label className="text-white/40 text-xs mb-1 block">Descrição (cartão público)</label>
              <textarea value={s.descricao} rows={3}
                onChange={(e) => update(s.id, { descricao: e.target.value })}
                placeholder="Descrição curta apresentada no cartão do serviço"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 placeholder:text-white/20 resize-y" />
            </div>

            {/* Preço */}
            <div className="mb-3">
              <label className="text-white/40 text-xs mb-1 block">Preço</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-rose-gold/50 transition-colors">
                <Euro size={13} className="text-white/30 flex-shrink-0" />
                <input type="text" value={s.preco}
                  onChange={(e) => update(s.id, { preco: e.target.value })}
                  placeholder="Ex: €200 – €350 ou A partir de €1.000"
                  className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-white/20" />
              </div>
            </div>

            {/* Foto */}
            <div>
              <label className="text-white/40 text-xs mb-2 block">Foto do Serviço (homepage)</label>
              {s.fotoUrl ? (
                <div className="relative w-full max-w-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.fotoUrl} alt={s.nome} className="w-full aspect-video object-cover rounded-xl" />
                  <button onClick={() => handleFotoRemove(s.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-colors">
                    <Trash2 size={13} className="text-white" />
                  </button>
                </div>
              ) : (
                <div>
                  <input type="file" accept="image/*"
                    ref={(el) => { fileRefs.current[s.id] = el }}
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFotoUpload(s.id, f); e.target.value = '' }} />
                  <button onClick={() => fileRefs.current[s.id]?.click()}
                    disabled={uploading[s.id]}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                    {uploading[s.id]
                      ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> A enviar…</>
                      : <><Upload size={13} /> Carregar foto</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <button onClick={handleSave} disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            saved ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-gradient-to-r from-rose-gold to-golden text-white hover:opacity-90'
          } disabled:opacity-50`}>
          {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving ? 'A guardar...' : saved ? 'Guardado!' : 'Guardar Alterações'}
        </button>
      </div>
    </div>
  )
}
