'use client'
import { useState } from 'react'
import { Shield, CheckCircle2, Clock, Download, Search, Eye } from 'lucide-react'

const mockConsentimentos = [
  {
    id: 'cons_1',
    clienteNome: 'Ana Silva',
    servico: 'Microblading',
    dataAgendamento: '5 Abr 2026',
    dataSubmissao: '3 Abr 2026',
    estado: 'submetido',
    alertas: [],
  },
  {
    id: 'cons_2',
    clienteNome: 'Sofia Rodrigues',
    servico: 'Eyeliner Permanente',
    dataAgendamento: '8 Abr 2026',
    dataSubmissao: null,
    estado: 'pendente',
    alertas: [],
  },
  {
    id: 'cons_3',
    clienteNome: 'Carla Mendes',
    servico: 'Microblading',
    dataAgendamento: '10 Abr 2026',
    dataSubmissao: '8 Abr 2026',
    estado: 'submetido',
    alertas: ['Mencionou alergia a anestésicos locais'],
  },
]

export default function ConsentimentosAdminPage() {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<string | null>(null)

  const filtrados = mockConsentimentos.filter(c =>
    c.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    c.servico.toLowerCase().includes(busca.toLowerCase())
  )

  const enviarLink = (id: string) => {
    // Aqui enviaria SMS/email com o link de consentimento
    alert('Link enviado por SMS/email!')
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8">
        <h1 className="text-white text-2xl font-playfair font-semibold">Consentimentos</h1>
        <p className="text-white/40 text-sm mt-0.5">Formulários de anamnese e consentimento informado</p>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{mockConsentimentos.filter(c => c.estado === 'submetido').length}</p>
            <p className="text-white/40 text-xs mt-1">Submetidos</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{mockConsentimentos.filter(c => c.estado === 'pendente').length}</p>
            <p className="text-white/40 text-xs mt-1">Pendentes</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-red-400">{mockConsentimentos.filter(c => c.alertas.length > 0).length}</p>
            <p className="text-white/40 text-xs mt-1">Com Alertas</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-2">
          <Shield size={14} className="text-white/40 flex-shrink-0 mt-0.5" />
          <p className="text-white/40 text-xs">
            Os formulários são enviados automaticamente 48h antes do procedimento. Pode reenviar manualmente se necessário.
          </p>
        </div>

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
          {filtrados.map(c => (
            <div key={c.id} className={`bg-[#1A1A1A] rounded-2xl border overflow-hidden ${
              c.alertas.length > 0 ? 'border-amber-400/30' : 'border-white/5'
            }`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.estado === 'submetido' ? 'bg-emerald-400/10' : 'bg-amber-400/10'
                  }`}>
                    {c.estado === 'submetido'
                      ? <CheckCircle2 size={20} className="text-emerald-400" />
                      : <Clock size={20} className="text-amber-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{c.clienteNome}</p>
                    <p className="text-white/40 text-xs">{c.servico} · {c.dataAgendamento}</p>
                    {c.alertas.length > 0 && (
                      <div className="mt-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1.5">
                        {c.alertas.map((a, i) => (
                          <p key={i} className="text-amber-400 text-xs">⚠️ {a}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
                    c.estado === 'submetido'
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    {c.estado === 'submetido' ? 'Submetido' : 'Pendente'}
                  </span>
                </div>

                {/* Acções */}
                <div className="flex gap-2 mt-3">
                  {c.estado === 'submetido' ? (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-white/5 text-white/50 hover:bg-white/10 rounded-lg py-1.5 transition-colors">
                        <Eye size={12} />
                        Ver Formulário
                      </button>
                      <button className="flex items-center justify-center gap-1.5 text-xs bg-white/5 text-white/50 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors">
                        <Download size={12} />
                        PDF
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => enviarLink(c.id)}
                      className="flex-1 text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 rounded-lg py-1.5 transition-colors font-medium"
                    >
                      Enviar Link de Consentimento
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
