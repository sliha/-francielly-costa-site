'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Save, Trash2, Upload, Award, GripVertical } from 'lucide-react'
import { db, storage } from '@/lib/firebase'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp
} from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

interface Certificacao {
  id: string
  titulo: string
  descricao: string
  fotoUrl: string
  fotoPath: string
  ordem: number
}

function toast(msg: string, error = false) {
  if (typeof window === 'undefined') return
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${error ? '#EF4444' : '#10B981'};color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;z-index:9999;font-family:Inter,sans-serif`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

const EMPTY: Omit<Certificacao, 'id'> = { titulo: '', descricao: '', fotoUrl: '', fotoPath: '', ordem: 0 }

export default function CertificacoesAdminPage() {
  const [items, setItems] = useState<Certificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...EMPTY })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!db) return
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'certificacoes'), orderBy('ordem', 'asc')))
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificacao)))
    } catch { toast('Erro ao carregar.', true) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (file: File) => {
    if (!storage) return
    setUploading(true)
    setUploadProgress(0)
    const path = `certificacoes/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    const task = uploadBytesResumable(sRef, file)
    task.on('state_changed',
      (snap) => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      () => { toast('Erro no upload.', true); setUploading(false) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        console.log('Upload URL:', url)
        setForm((f) => ({ ...f, fotoUrl: url, fotoPath: path }))
        setUploading(false)
        toast('Foto carregada!')
      }
    )
  }

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast('O título é obrigatório.', true); return }
    setSaving(true)
    try {
      if (editId) {
        await updateDoc(doc(db!, 'certificacoes', editId), { ...form })
        toast('Certificação atualizada!')
      } else {
        await addDoc(collection(db!, 'certificacoes'), { ...form, criadoEm: serverTimestamp() })
        toast('Certificação adicionada!')
      }
      setForm({ ...EMPTY })
      setEditId(null)
      await load()
    } catch { toast('Erro ao guardar.', true) }
    finally { setSaving(false) }
  }

  const handleEdit = (item: Certificacao) => {
    setEditId(item.id)
    setForm({ titulo: item.titulo, descricao: item.descricao, fotoUrl: item.fotoUrl, fotoPath: item.fotoPath, ordem: item.ordem })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (item: Certificacao) => {
    if (!confirm(`Eliminar "${item.titulo}"?`)) return
    try {
      if (item.fotoPath && storage) {
        await deleteObject(storageRef(storage, item.fotoPath)).catch(() => {})
      }
      await deleteDoc(doc(db!, 'certificacoes', item.id))
      toast('Eliminada.')
      await load()
    } catch { toast('Erro ao eliminar.', true) }
  }

  const cancelEdit = () => { setEditId(null); setForm({ ...EMPTY }) }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 border-b border-white/5">
        <h1 className="text-white text-xl font-playfair font-semibold">Certificações</h1>
        <p className="text-white/40 text-xs mt-0.5">Gerir certificações e formações da Francielly</p>
      </div>

      <div className="px-4 md:px-6 pt-5 pb-8 space-y-6 max-w-2xl">
        {/* Form */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Award size={16} className="text-golden" />
            {editId ? 'Editar Certificação' : 'Nova Certificação'}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Título *</label>
              <input type="text" value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Master em Microblading — Paris, 2023"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 placeholder:text-white/20 transition-colors" />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1 block">Descrição</label>
              <textarea rows={2} value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descrição da certificação..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 placeholder:text-white/20 transition-colors resize-none" />
            </div>

            <div>
              <label className="text-white/40 text-xs mb-1 block">Ordem (menor = primeiro)</label>
              <input type="number" value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
                className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50 transition-colors" />
            </div>

            {/* Foto */}
            <div>
              <label className="text-white/40 text-xs mb-2 block">Foto / Diploma</label>
              {form.fotoUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.fotoUrl} alt="certificação" className="w-48 aspect-video object-cover rounded-xl" />
                  <button onClick={() => setForm((f) => ({ ...f, fotoUrl: '', fotoPath: '' }))}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-colors">
                    <Trash2 size={13} className="text-white" />
                  </button>
                </div>
              ) : (
                <div>
                  <input type="file" accept="image/*" ref={fileRef} className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-xl transition-colors">
                    <Upload size={13} />
                    {uploading ? `A enviar… ${uploadProgress}%` : 'Carregar foto'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-rose-gold text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
              {editId ? 'Atualizar' : 'Adicionar'}
            </button>
            {editId && (
              <button onClick={cancelEdit}
                className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-6">Nenhuma certificação adicionada.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id}
                className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                <GripVertical size={16} className="text-white/20 flex-shrink-0" />
                {item.fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.fotoUrl} alt={item.titulo} className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.titulo}</p>
                  {item.descricao && <p className="text-white/40 text-xs mt-0.5 truncate">{item.descricao}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => handleEdit(item)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(item)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
