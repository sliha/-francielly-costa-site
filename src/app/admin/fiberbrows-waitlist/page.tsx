'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore'
import { CheckCircle2, Clock, Mail, Phone, User, RefreshCw } from 'lucide-react'

interface WaitlistEntry {
  id: string
  nome: string
  email: string
  telefone: string
  criadoEm: { toDate: () => Date } | null
  contactada: boolean
}

export default function FiberBROWSWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchEntries = async () => {
    if (!db) { setLoading(false); return }
    setLoading(true)
    try {
      const q = query(collection(db, 'fiberbrows-waitlist'), orderBy('criadoEm', 'desc'))
      const snap = await getDocs(q)
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WaitlistEntry)))
    } catch (err) {
      console.error('Erro ao carregar waitlist:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEntries() }, [])

  const toggleContactada = async (id: string, current: boolean) => {
    if (!db) return
    setUpdating(id)
    try {
      await updateDoc(doc(db, 'fiberbrows-waitlist', id), { contactada: !current })
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, contactada: !current } : e))
      )
    } catch (err) {
      console.error('Erro ao actualizar:', err)
    } finally {
      setUpdating(null)
    }
  }

  const total = entries.length
  const pendentes = entries.filter((e) => !e.contactada).length
  const contactadas = entries.filter((e) => e.contactada).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A96E, #B76E79)' }}>
            <span className="text-white font-bold text-sm">FB</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-playfair">
            Lista de Espera — FiberBROWS
          </h1>
        </div>
        <p className="text-white/40 text-sm font-inter ml-13">
          Clientes interessadas no pré-registo da FiberBROWS
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total', value: total, color: '#C9A96E' },
          { label: 'Por contactar', value: pendentes, color: '#F59E0B' },
          { label: 'Contactadas', value: contactadas, color: '#10B981' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 p-5 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="font-playfair font-bold text-4xl mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-white/40 text-xs font-inter">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button onClick={fetchEntries}
          className="flex items-center gap-2 text-white/40 hover:text-golden text-sm font-inter transition-colors">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-golden border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-white/30 font-inter">
          Nenhum registo ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/8 p-5 transition-colors"
              style={{ background: entry.contactada ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: 'rgba(201,169,110,0.12)', color: '#C9A96E' }}>
                  {i + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-white font-semibold font-inter text-sm">{entry.nome}</span>
                    {entry.contactada && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-inter">
                        Contactada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-white/30" />
                    <a href={`mailto:${entry.email}`}
                      className="text-white/50 hover:text-golden text-xs font-inter transition-colors">
                      {entry.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-white/30" />
                    <a href={`tel:${entry.telefone}`}
                      className="text-white/50 hover:text-golden text-xs font-inter transition-colors">
                      {entry.telefone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                {entry.criadoEm && (
                  <div className="flex items-center gap-1 text-white/30 text-xs font-inter">
                    <Clock className="w-3 h-3" />
                    {entry.criadoEm.toDate().toLocaleDateString('pt-PT')}
                  </div>
                )}
                <button
                  onClick={() => toggleContactada(entry.id, entry.contactada)}
                  disabled={updating === entry.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-inter transition-all disabled:opacity-50"
                  style={
                    entry.contactada
                      ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' }
                      : { background: 'rgba(201,169,110,0.12)', color: '#C9A96E' }
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {entry.contactada ? 'Marcar como pendente' : 'Marcar contactada'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
