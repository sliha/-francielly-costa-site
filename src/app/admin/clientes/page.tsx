'use client'
import { useState, useEffect } from 'react'
import { Search, UserPlus, Phone, Mail, Calendar, ChevronRight, RefreshCw } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'

interface ClienteRow {
  id: string
  nome: string
  email: string
  telefone: string
  ultimoServico: string
  ultimoAgendamento: string
  totalAgendamentos: number
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const carregar = async () => {
    setLoading(true)
    try {
      // Derive clients from agendamentos (covers historical data)
      const snap = await getDocs(
        query(collection(db!, 'agendamentos'), orderBy('criadoEm', 'desc'))
      )

      const map = new Map<string, ClienteRow>()
      for (const d of snap.docs) {
        const a = d.data()
        const key = (a.clienteEmail as string).toLowerCase()
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            nome: a.clienteNome || '',
            email: a.clienteEmail || '',
            telefone: a.clienteTelefone || '',
            ultimoServico: a.servicoNome || '',
            ultimoAgendamento: a.data || '',
            totalAgendamentos: 1,
          })
        } else {
          const c = map.get(key)!
          c.totalAgendamentos++
          // keep the most recent service (first doc is newest due to orderBy desc)
        }
      }

      setClientes(Array.from(map.values()))
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatData = (iso: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString('pt-PT', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    } catch { return iso }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Clientes</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {loading ? 'A carregar…' : `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors">
            <UserPlus size={16} />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, telefone ou email…"
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-white/40 text-sm">
              {search ? 'Nenhum cliente encontrado' : 'Ainda não existem clientes registados'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-gold font-semibold">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{cliente.nome}</p>
                    <p className="text-white/40 text-xs truncate">{cliente.ultimoServico || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-golden text-sm font-semibold">{cliente.totalAgendamentos}</p>
                    <p className="text-white/30 text-xs">marcaç{cliente.totalAgendamentos === 1 ? 'ão' : 'ões'}</p>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5 flex-wrap">
                  {cliente.telefone && (
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                      <Phone size={11} />
                      {cliente.telefone}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-white/30 text-xs truncate">
                    <Mail size={11} />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                  {cliente.ultimoAgendamento && (
                    <div className="ml-auto flex items-center gap-1 text-white/25 text-xs flex-shrink-0">
                      <Calendar size={11} />
                      {formatData(cliente.ultimoAgendamento)}
                    </div>
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
