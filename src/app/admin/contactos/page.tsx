'use client'
import { useState, useEffect } from 'react'
import { Search, Mail, Phone, RefreshCw, CheckCircle, Circle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Contacto {
  id: string
  nome: string
  email: string
  telefone: string
  servico: string
  mensagem: string
  lido: boolean
  criadoEm: string | null
}

export default function ContactosAdminPage() {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [apenasNaoLidos, setApenasNaoLidos] = useState(false)

  const carregar = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contactos')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      setContactos(
        (data ?? []).map((d) => ({
          id: d.id,
          nome: d.nome || '',
          email: d.email || '',
          telefone: d.telefone || '',
          servico: d.servico || '',
          mensagem: d.mensagem || '',
          lido: d.lido ?? false,
          criadoEm: d.criado_em || null,
        }))
      )
    } catch (err) {
      console.error('Erro ao carregar contactos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const marcarLido = async (id: string, lido: boolean) => {
    try {
      const { error } = await supabase.from('contactos').update({ lido }).eq('id', id)
      if (error) throw error
      setContactos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, lido } : c))
      )
    } catch (err) {
      console.error('Erro ao atualizar contacto:', err)
    }
  }

  const apagar = async (id: string) => {
    if (!confirm('Apagar esta mensagem?')) return
    try {
      const { error } = await supabase.from('contactos').delete().eq('id', id)
      if (error) throw error
      setContactos((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Erro ao apagar contacto:', err)
    }
  }

  const formatData = (iso: string | null) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('pt-PT', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return '—' }
  }

  const filtered = contactos.filter((c) => {
    if (apenasNaoLidos && c.lido) return false
    if (
      search &&
      !c.nome.toLowerCase().includes(search.toLowerCase()) &&
      !c.email.toLowerCase().includes(search.toLowerCase()) &&
      !c.mensagem.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const naoLidos = contactos.filter((c) => !c.lido).length

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Contactos</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {loading ? 'A carregar…' : (
              <>
                {contactos.length} mensagem{contactos.length !== 1 ? 's' : ''}
                {naoLidos > 0 && (
                  <span className="ml-2 text-rose-gold font-semibold">
                    {naoLidos} não lida{naoLidos !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <button
          onClick={carregar}
          className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          title="Atualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar…"
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setApenasNaoLidos(!apenasNaoLidos)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
              apenasNaoLidos
                ? 'bg-rose-gold text-white'
                : 'bg-[#1A1A1A] border border-white/10 text-white/50 hover:text-white/70'
            }`}
          >
            Não lidos
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-white/40 text-sm">Nenhuma mensagem encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`bg-[#1A1A1A] rounded-2xl p-4 border transition-colors ${
                  c.lido ? 'border-white/5' : 'border-rose-gold/20'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => marcarLido(c.id, !c.lido)}
                      className="mt-0.5 flex-shrink-0 text-white/30 hover:text-rose-gold transition-colors"
                      title={c.lido ? 'Marcar como não lido' : 'Marcar como lido'}
                    >
                      {c.lido ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium text-sm ${c.lido ? 'text-white/70' : 'text-white'}`}>
                          {c.nome}
                        </p>
                        {c.servico && (
                          <span className="text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">
                            {c.servico}
                          </span>
                        )}
                        {!c.lido && (
                          <span className="text-xs bg-rose-gold text-white px-2 py-0.5 rounded-full font-medium">
                            Novo
                          </span>
                        )}
                      </div>
                      <p className="text-white/30 text-xs mt-0.5">{formatData(c.criadoEm)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => apagar(c.id)}
                    className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Apagar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Message */}
                {c.mensagem && (
                  <p className="text-white/60 text-sm mt-3 leading-relaxed whitespace-pre-wrap">
                    {c.mensagem}
                  </p>
                )}

                {/* Contact details */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 flex-wrap">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-1.5 text-white/40 hover:text-rose-gold text-xs transition-colors"
                  >
                    <Mail size={12} />
                    {c.email}
                  </a>
                  {c.telefone && (
                    <a
                      href={`tel:${c.telefone}`}
                      className="flex items-center gap-1.5 text-white/40 hover:text-rose-gold text-xs transition-colors"
                    >
                      <Phone size={12} />
                      {c.telefone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
