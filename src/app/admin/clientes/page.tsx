'use client'
import { useState } from 'react'
import { Search, UserPlus, Phone, Mail, Calendar, ChevronRight } from 'lucide-react'

// TODO: Replace with Firestore query — collection('clientes').orderBy('nome')
const mockClientes = [
  { id: '1', nome: 'Ana Silva', telefone: '912 345 678', email: 'ana.silva@gmail.com', totalMarcacoes: 3, ultimaVisita: '30 Mar 2026', servico: 'Microblading' },
  { id: '2', nome: 'Marta Santos', telefone: '934 567 890', email: 'marta.santos@hotmail.com', totalMarcacoes: 1, ultimaVisita: '30 Mar 2026', servico: 'Micropigmentação Labial' },
  { id: '3', nome: 'Joana Ferreira', telefone: '961 234 567', email: 'joana.f@gmail.com', totalMarcacoes: 2, ultimaVisita: '30 Mar 2026', servico: 'Microshading' },
  { id: '4', nome: 'Sofia Rodrigues', telefone: '910 111 222', email: 'sofia.r@gmail.com', totalMarcacoes: 4, ultimaVisita: '2 Abr 2026', servico: 'Eyeliner Permanente' },
  { id: '5', nome: 'Carla Mendes', telefone: '962 333 444', email: 'carla.m@outlook.com', totalMarcacoes: 2, ultimaVisita: '5 Abr 2026', servico: 'Microblading' },
  { id: '6', nome: 'Beatriz Lopes', telefone: '935 555 666', email: 'beatriz.l@gmail.com', totalMarcacoes: 1, ultimaVisita: '7 Abr 2026', servico: 'Micropigmentação Labial' },
]

export default function ClientesPage() {
  const [search, setSearch] = useState('')

  const filtered = mockClientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Clientes</h1>
          <p className="text-white/40 text-sm mt-0.5">{mockClientes.length} clientes registados</p>
        </div>
        <button className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors">
          <UserPlus size={16} />
          <span className="hidden sm:inline">Novo</span>
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, telefone ou email..."
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
            <p className="text-white/40 text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((cliente) => (
              <div
                key={cliente.id}
                className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-gold font-semibold">
                      {cliente.nome.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{cliente.nome}</p>
                    <p className="text-white/40 text-xs truncate">{cliente.servico}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-golden text-sm font-semibold">{cliente.totalMarcacoes}</p>
                    <p className="text-white/30 text-xs">visitas</p>
                  </div>

                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-white/30 text-xs">
                    <Phone size={11} />
                    {cliente.telefone}
                  </div>
                  <div className="flex items-center gap-1.5 text-white/30 text-xs truncate">
                    <Mail size={11} />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-white/25 text-xs flex-shrink-0">
                    <Calendar size={11} />
                    {cliente.ultimaVisita}
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
