'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Save, Eye, EyeOff, Euro, Upload, Trash2 } from 'lucide-react'
import { db, storage } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

const DEFAULT_SERVICOS = [
  { id: 'fiberbrows', nome: 'FiberBROWS', preco: 'A partir de €1.000', ativo: true, destaque: true, fotoUrl: '', fotoPath: '' },
  { id: 'microblading', nome: 'Microblading', preco: '€200 – €350', ativo: true, destaque: false, fotoUrl: '', fotoPath: '' },
  { id: 'microshading', nome: 'Microshading', preco: '€180 – €300', ativo: true, destaque: false, fotoUrl: '', fotoPath: '' },
  { id: 'eyeliner', nome: 'Micropigmentação Eyeliner', preco: '€150 – €250', ativo: true, destaque: false, fotoUrl: '', fotoPath: '' },
  { id: 'labial', nome: 'Micropigmentação Labial', preco: '€200 – €350', ativo: true, destaque: false, fotoUrl: '', fotoPath: '' },
  { id: 'tricopigmentacao', nome: 'Tricopigmentação', preco: 'A consultar', ativo: false, destaque: false, fotoUrl: '', fotoPath: '' },
]

type Servico = typeof DEFAULT_SERVICOS[0]

function toast(msg: string, error = false) {
  if (typeof window === 'undefined') return
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${error ? '#EF4444' : '#10B981'};color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;z-index:9999;font-family:Inter,sans-serif`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

export default function ServicosAdminPage() {
  const [servicos, setServicos] = useState<Servico[]>(DEFAULT_SERVICOS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState<Record<string, number>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!db) return
    getDoc(doc(db, 'settings', 'servicos')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (Array.isArray(data.lista)) {
          setServicos(data.lista.map((s: Servico) => ({ ...s, fotoUrl: s.fotoUrl || '', fotoPath: s.fotoPath || '' })))
        }
      }
    }).catch(() => {})
  }, [])

  const handlePrecoChange = (id: string, preco: string) => {
    setServicos((prev) => prev.map((s) => s.id === id ? { ...s, preco } : s))
    setSaved(false)
  }

  const toggleAtivo = (id: string) => {
    setServicos((prev) => prev.map((s) => s.id === id ? { ...s, ativo: !s.ativo } : s))
    setSaved(false)
  }

  const handleFotoUpload = async (id: string, file: File) => {
    if (!storage) return
    setUploading((prev) => ({ ...prev, [id]: 0 }))
    const path = `servicos/${id}/foto_${Date.now()}`
    const sRef = storageRef(storage, path)
    const task = uploadBytesResumable(sRef, file)
    task.on('state_changed',
      (snap) => setUploading((prev) => ({ ...prev, [id]: Math.round(snap.bytesTransferred / snap.totalBytes * 100) })),
      () => { toast('Erro ao fazer upload.', true); setUploading((prev) => { const n = { ...prev }; delete n[id]; return n }) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        console.log('Upload URL:', url)
        setServicos((prev) => prev.map((s) => s.id === id ? { ...s, fotoUrl: url, fotoPath: path } : s))
        setUploading((prev) => { const n = { ...prev }; delete n[id]; return n })
        setSaved(false)
        toast('Foto carregada! Guarda para aplicar.')
      }
    )
  }

  const handleFotoRemove = async (id: string) => {
    const servico = servicos.find((s) => s.id === id)
    if (!servico?.fotoPath || !storage) return
    try {
      await deleteObject(storageRef(storage, servico.fotoPath))
    } catch { /* ignore if already deleted */ }
    setServicos((prev) => prev.map((s) => s.id === id ? { ...s, fotoUrl: '', fotoPath: '' } : s))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (db) await setDoc(doc(db, 'settings', 'servicos'), { lista: servicos }, { merge: true })
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
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Serviços & Preços</h1>
          <p className="text-white/40 text-xs mt-0.5">Editar preços, fotos e visibilidade dos serviços</p>
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
          As alterações são guardadas no Firestore e exibidas no site público.
        </p>

        {servicos.map((s) => (
          <div key={s.id}
            className={`bg-[#1A1A1A] rounded-2xl p-4 border transition-colors ${
              s.ativo ? 'border-white/5' : 'border-white/3 opacity-60'
            }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                {s.destaque && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-golden/15 text-golden font-bold flex-shrink-0">
                    CARRO-CHEFE
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm">{s.nome}</p>
                  <p className="text-white/30 text-xs mt-0.5">ID: {s.id}</p>
                </div>
              </div>
              <button onClick={() => toggleAtivo(s.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors flex-shrink-0 ${
                  s.ativo ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/30'
                }`}>
                {s.ativo ? <Eye size={11} /> : <EyeOff size={11} />}
                {s.ativo ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            {/* Foto do serviço */}
            <div className="mb-3">
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
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFotoUpload(s.id, f) }} />
                  <button onClick={() => fileRefs.current[s.id]?.click()}
                    disabled={uploading[s.id] !== undefined}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-colors">
                    <Upload size={13} />
                    {uploading[s.id] !== undefined ? `A enviar… ${uploading[s.id]}%` : 'Carregar foto'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1 block">Preço</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-rose-gold/50 transition-colors">
                <Euro size={13} className="text-white/30 flex-shrink-0" />
                <input type="text" value={s.preco}
                  onChange={(e) => handlePrecoChange(s.id, e.target.value)}
                  placeholder="Ex: €200 – €350 ou A partir de €1.000"
                  className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-white/20" />
              </div>
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
