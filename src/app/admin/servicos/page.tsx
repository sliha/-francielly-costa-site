'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Save, Eye, EyeOff, Euro } from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const DEFAULT_SERVICOS = [
  { id: 'fiberbrows', nome: 'FiberBROWS', preco: 'A partir de €1.000', ativo: true, destaque: true },
  { id: 'microblading', nome: 'Microblading', preco: '€200 – €350', ativo: true, destaque: false },
  { id: 'microshading', nome: 'Microshading', preco: '€180 – €300', ativo: true, destaque: false },
  { id: 'eyeliner', nome: 'Micropigmentação Eyeliner', preco: '€150 – €250', ativo: true, destaque: false },
  { id: 'labial', nome: 'Micropigmentação Labial', preco: '€200 – €350', ativo: true, destaque: false },
  { id: 'tricopigmentacao', nome: 'Tricopigmentação', preco: 'A consultar', ativo: false, destaque: false },
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

  useEffect(() => {
    if (!db) return
    getDoc(doc(db, 'settings', 'servicos')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (Array.isArray(data.lista)) setServicos(data.lista)
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
          <p className="text-white/40 text-xs mt-0.5">Editar preços e visibilidade dos serviços</p>
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
          Os preços alterados aqui são guardados no Firestore e podem ser exibidos no site público.
        </p>

        {servicos.map((s) => (
          <div key={s.id}
            className={`bg-[#1A1A1A] rounded-2xl p-4 border transition-colors ${
              s.ativo ? 'border-white/5' : 'border-white/3 opacity-60'
            }`}>
            <div className="flex items-start justify-between gap-3">
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

            <div className="mt-3">
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
