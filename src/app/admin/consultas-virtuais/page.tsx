'use client'

import { useState } from 'react'
import { Video, Calendar, Clock, ExternalLink, CheckCircle2, AlertCircle, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const mockConsultas = [
  {
    id: 'cv_1',
    clienteNome: 'Andreia Sousa',
    telefone: '912 000 111',
    email: 'andreia@email.com',
    servico: 'Microblading',
    data: new Date(2026, 3, 5),
    hora: '10:00',
    meetLink: 'https://meet.google.com/abc-defgh-ijk',
    estado: 'confirmada',
    duvida: 'Quero perceber se o microblading é adequado para o meu tipo de pele oleosa.',
  },
  {
    id: 'cv_2',
    clienteNome: 'Leonor Castro',
    telefone: '934 222 333',
    email: 'leonor@email.com',
    servico: 'Micropigmentação Labial',
    data: new Date(2026, 3, 6),
    hora: '14:30',
    meetLink: 'https://meet.google.com/lmn-opqrs-tuv',
    estado: 'pendente',
    duvida: '',
  },
  {
    id: 'cv_3',
    clienteNome: 'Madalena Faria',
    telefone: '961 444 555',
    email: 'madalena@email.com',
    servico: 'Não sei ainda',
    data: new Date(2026, 3, 3),
    hora: '11:00',
    meetLink: 'https://meet.google.com/wxy-zabcd-efg',
    estado: 'concluida',
    duvida: 'Gostaria de perceber qual o procedimento mais adequado para mim.',
  },
]

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  confirmada: { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  concluida: { label: 'Concluída', color: 'text-white/40', bg: 'bg-white/5' },
}

export default function ConsultasVirtuaisAdminPage() {
  const [consultas, setConsultas] = useState(mockConsultas)
  const [busca, setBusca] = useState('')
  const [selecionada, setSelecionada] = useState<string | null>(null)

  const filtradas = consultas.filter(c =>
    c.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    c.servico.toLowerCase().includes(busca.toLowerCase())
  )

  const confirmar = (id: string) => {
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, estado: 'confirmada' } : c))
  }

  const concluir = (id: string) => {
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, estado: 'concluida' } : c))
  }

  const hoje = consultas.filter(c => {
    const d = c.data
    const now = new Date()
    return d.toDateString() === now.toDateString() && c.estado !== 'concluida'
  })

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Consultas Virtuais</h1>
          <p className="text-white/40 text-sm mt-0.5">Videochamadas de 15 minutos via Google Meet</p>
        </div>
        <a
          href="/consulta-virtual"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-white/5 border border-white/10 text-white/60 hover:text-white px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <ExternalLink size={12} />
          Ver página pública
        </a>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{consultas.filter(c => c.estado === 'pendente').length}</p>
            <p className="text-white/40 text-xs mt-1">Pendentes</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{consultas.filter(c => c.estado === 'confirmada').length}</p>
            <p className="text-white/40 text-xs mt-1">Confirmadas</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-white/40">{consultas.filter(c => c.estado === 'concluida').length}</p>
            <p className="text-white/40 text-xs mt-1">Concluídas</p>
          </div>
        </div>

        {/* Alerta: consultas hoje */}
        {hoje.length > 0 && (
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-emerald-400" />
              <p className="text-emerald-400 font-medium text-sm">
                {hoje.length} consulta(s) virtual(ais) hoje!
              </p>
            </div>
            {hoje.map(c => (
              <div key={c.id} className="mt-2 flex items-center justify-between">
                <p className="text-white/70 text-sm">{c.clienteNome} às {c.hora}</p>
                <a
                  href={c.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Video size={12} />
                  Entrar no Meet
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtradas.map(c => {
            const status = estadoConfig[c.estado]
            const isExpanded = selecionada === c.id
            return (
              <div key={c.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setSelecionada(isExpanded ? null : c.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/20 to-golden/10 flex items-center justify-center flex-shrink-0">
                      <Video size={16} className="text-rose-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{c.clienteNome}</p>
                      <p className="text-white/40 text-xs">{c.servico}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-white/60 text-xs">{format(c.data, 'd MMM', { locale: ptBR })}</p>
                        <p className="text-white/40 text-xs">{c.hora}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-white/30 text-xs">Telefone</p>
                        <p className="text-white text-sm">{c.telefone}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-xs">Email</p>
                        <p className="text-white text-sm truncate">{c.email}</p>
                      </div>
                    </div>

                    {c.duvida && (
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-white/30 text-xs mb-1">Dúvida / Informação</p>
                        <p className="text-white/60 text-sm leading-relaxed">{c.duvida}</p>
                      </div>
                    )}

                    {/* Link Meet */}
                    <div>
                      <p className="text-white/30 text-xs mb-1.5">Link Google Meet</p>
                      <a
                        href={c.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-xl px-3 py-2.5 text-sm hover:bg-emerald-400/20 transition-colors"
                      >
                        <Video size={14} />
                        <span className="truncate">{c.meetLink}</span>
                        <ExternalLink size={12} className="flex-shrink-0" />
                      </a>
                    </div>

                    {/* Acções */}
                    <div className="flex gap-2">
                      {c.estado === 'pendente' && (
                        <button
                          onClick={() => confirmar(c.id)}
                          className="flex-1 text-xs bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg py-2 transition-colors font-medium"
                        >
                          Confirmar
                        </button>
                      )}
                      {c.estado === 'confirmada' && (
                        <button
                          onClick={() => concluir(c.id)}
                          className="flex-1 text-xs bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 rounded-lg py-2 transition-colors font-medium"
                        >
                          Marcar Concluída
                        </button>
                      )}
                      <button className="flex-1 text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 rounded-lg py-2 transition-colors">
                        Enviar Link por SMS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
