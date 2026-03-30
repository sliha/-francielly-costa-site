'use client'
import { useState } from 'react'
import { Gift, Users, TrendingUp, Search, ChevronRight } from 'lucide-react'

const mockReferencias = [
  {
    id: 'ref_1',
    clienteNome: 'Ana Silva',
    codigo: 'ANA2026',
    totalEnviadas: 3,
    totalConvertidas: 2,
    descontosGerados: 2,
    ultimaActividade: '28 Mar 2026',
    referidas: [
      { nome: 'Margarida Santos', estado: 'convertida', data: '20 Mar 2026', servico: 'Microblading' },
      { nome: 'Joana Ferreira', estado: 'convertida', data: '25 Mar 2026', servico: 'Micropigmentação Labial' },
      { nome: 'Rita Alves', estado: 'pendente', data: '28 Mar 2026', servico: 'Microblading' },
    ],
  },
  {
    id: 'ref_2',
    clienteNome: 'Sofia Rodrigues',
    codigo: 'SOF2026',
    totalEnviadas: 1,
    totalConvertidas: 1,
    descontosGerados: 1,
    ultimaActividade: '15 Mar 2026',
    referidas: [
      { nome: 'Beatriz Lima', estado: 'convertida', data: '15 Mar 2026', servico: 'Microshading' },
    ],
  },
]

export default function ReferenciasAdminPage() {
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  const filtrados = mockReferencias.filter(r =>
    r.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    r.codigo.toLowerCase().includes(busca.toLowerCase())
  )

  const totalConversoes = mockReferencias.reduce((s, r) => s + r.totalConvertidas, 0)
  const totalReferencias = mockReferencias.reduce((s, r) => s + r.totalEnviadas, 0)
  const taxaConversao = totalReferencias > 0 ? Math.round((totalConversoes / totalReferencias) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8">
        <h1 className="text-white text-2xl font-playfair font-semibold">Programa de Referências</h1>
        <p className="text-white/40 text-sm mt-0.5">Crescimento orgânico através de indicações</p>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-rose-gold">{totalReferencias}</p>
            <p className="text-white/40 text-xs mt-1">Enviadas</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{totalConversoes}</p>
            <p className="text-white/40 text-xs mt-1">Convertidas</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-golden">{taxaConversao}%</p>
            <p className="text-white/40 text-xs mt-1">Conversão</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-rose-gold/10 border border-rose-gold/20 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Gift size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/70 text-sm">
                <span className="text-white font-medium">Programa activo:</span> Quem referir ganha <span className="text-rose-gold font-medium">15% de desconto</span> no próximo procedimento. A amiga nova ganha <span className="text-golden font-medium">10% na 1ª sessão</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Pesquisar cliente ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtrados.map(r => (
            <div key={r.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
              <button
                onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-gold font-semibold text-sm">{r.clienteNome.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{r.clienteNome}</p>
                  <p className="text-white/40 text-xs font-mono">{r.codigo}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">{r.totalConvertidas}/{r.totalEnviadas}</p>
                    <p className="text-white/30 text-xs">convertidas</p>
                  </div>
                  <ChevronRight size={14} className={`text-white/20 transition-transform ${expandido === r.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {expandido === r.id && (
                <div className="border-t border-white/5 p-4 space-y-3">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Clientes Referidas</p>
                  {r.referidas.map((ref, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-white/70 text-sm">{ref.nome}</p>
                        <p className="text-white/30 text-xs">{ref.servico} · {ref.data}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ref.estado === 'convertida'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'bg-amber-400/10 text-amber-400'
                      }`}>
                        {ref.estado === 'convertida' ? 'Convertida' : 'Pendente'}
                      </span>
                    </div>
                  ))}

                  <p className="text-white/30 text-xs">Última actividade: {r.ultimaActividade}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
