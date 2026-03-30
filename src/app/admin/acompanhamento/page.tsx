'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  Camera,
  MessageCircle,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Search,
} from 'lucide-react'

const mockAcompanhamentos = [
  {
    id: 'acomp_1',
    clienteNome: 'Ana Silva',
    servico: 'Microblading',
    dataProcedimento: '15 Mar 2026',
    diaAtual: 15,
    proximaSessao: '15 Abr 2026',
    confirmada: false,
    temMensagemNova: true,
    temFotoNova: false,
    progresso: 60,
    telefone: '912 345 678',
    email: 'ana@email.com',
    codigoAcesso: '123456',
    linkAcesso: '/acompanhamento/acomp_1',
  },
  {
    id: 'acomp_2',
    clienteNome: 'Inês Cardoso',
    servico: 'Microshading',
    dataProcedimento: '10 Mar 2026',
    diaAtual: 20,
    proximaSessao: '10 Abr 2026',
    confirmada: true,
    temMensagemNova: false,
    temFotoNova: true,
    progresso: 85,
    telefone: '913 777 888',
    email: 'ines@email.com',
    codigoAcesso: '654321',
    linkAcesso: '/acompanhamento/acomp_2',
  },
  {
    id: 'acomp_3',
    clienteNome: 'Sofia Rodrigues',
    servico: 'Eyeliner Permanente',
    dataProcedimento: '2 Abr 2026',
    diaAtual: 1,
    proximaSessao: '2 Mai 2026',
    confirmada: false,
    temMensagemNova: false,
    temFotoNova: false,
    progresso: 10,
    telefone: '910 111 222',
    email: 'sofia@email.com',
    codigoAcesso: '789012',
    linkAcesso: '/acompanhamento/acomp_3',
  },
]

export default function AcompanhamentoAdminPage() {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<typeof mockAcompanhamentos[0] | null>(null)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [mensagens, setMensagens] = useState([
    { de: 'admin', texto: 'Olá Ana! O procedimento correu muito bem. Qualquer dúvida estou disponível 😊', data: '15 Mar' },
    { de: 'cliente', texto: 'Obrigada! Estou a gostar muito do resultado!', data: '15 Mar' },
    { de: 'cliente', texto: 'Francielly, é normal ter um pouco de comichão no dia 3?', data: '18 Mar' },
  ])

  const filtrados = mockAcompanhamentos.filter(a =>
    a.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    a.servico.toLowerCase().includes(busca.toLowerCase())
  )

  const precisamRetoque = mockAcompanhamentos.filter(a => a.diaAtual >= 28 && !a.confirmada)

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return
    setMensagens(prev => [...prev, { de: 'admin', texto: novaMensagem, data: 'Agora' }])
    setNovaMensagem('')
  }

  const copiarLink = (link: string, codigo: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${link}`)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8">
        <h1 className="text-white text-2xl font-playfair font-semibold">Acompanhamento</h1>
        <p className="text-white/40 text-sm mt-0.5">Clientes em recuperação pós-procedimento</p>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Alertas: precisam de retoque */}
        {precisamRetoque.length > 0 && (
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-400" />
              <p className="text-amber-400 font-medium text-sm">{precisamRetoque.length} cliente(s) prontas para retoque</p>
            </div>
            {precisamRetoque.map(a => (
              <div key={a.id} className="flex items-center justify-between mt-2">
                <p className="text-white/70 text-sm">{a.clienteNome} — {a.servico}</p>
                <button className="text-xs bg-amber-400/20 text-amber-400 px-3 py-1 rounded-lg hover:bg-amber-400/30 transition-colors">
                  Agendar Retoque
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-rose-gold">{mockAcompanhamentos.length}</p>
            <p className="text-white/40 text-xs mt-1">Em Recuperação</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{mockAcompanhamentos.filter(a => a.temMensagemNova).length}</p>
            <p className="text-white/40 text-xs mt-1">Msg Novas</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-golden">{mockAcompanhamentos.filter(a => a.temFotoNova).length}</p>
            <p className="text-white/40 text-xs mt-1">Fotos Novas</p>
          </div>
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
          {filtrados.map(a => (
            <div key={a.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setSelecionado(selecionado?.id === a.id ? null : a)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0 relative">
                    <span className="text-rose-gold font-semibold text-sm">{a.clienteNome.charAt(0)}</span>
                    {(a.temMensagemNova || a.temFotoNova) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-gold rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">!</span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{a.clienteNome}</p>
                      {a.temMensagemNova && (
                        <span className="text-xs bg-rose-gold/20 text-rose-gold px-1.5 py-0.5 rounded-md">Nova msg</span>
                      )}
                      {a.temFotoNova && (
                        <span className="text-xs bg-golden/20 text-golden px-1.5 py-0.5 rounded-md">Nova foto</span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">{a.servico} · Dia {a.diaAtual}</p>
                    {/* Progress */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-gold rounded-full" style={{ width: `${a.progresso}%` }} />
                      </div>
                      <span className="text-white/30 text-xs">{a.progresso}%</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className={`text-white/20 transition-transform flex-shrink-0 ${selecionado?.id === a.id ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Detalhes expandidos */}
              {selecionado?.id === a.id && (
                <div className="border-t border-white/5 p-4 space-y-4">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-white/30 text-xs">Procedimento</p>
                      <p className="text-white text-sm">{a.dataProcedimento}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs">Próxima Sessão</p>
                      <p className={`text-sm ${a.confirmada ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {a.proximaSessao} {a.confirmada ? '✓' : '(não confirmada)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs">Telefone</p>
                      <p className="text-white text-sm">{a.telefone}</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs">Código de Acesso</p>
                      <p className="text-white font-mono text-sm">{a.codigoAcesso}</p>
                    </div>
                  </div>

                  {/* Acções */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => copiarLink(a.linkAcesso, a.codigoAcesso)}
                      className="text-xs bg-white/5 text-white/60 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Copiar Link
                    </button>
                    <button className="text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 px-3 py-1.5 rounded-lg transition-colors">
                      Enviar SMS
                    </button>
                    <button className="text-xs bg-golden/10 text-golden hover:bg-golden/20 px-3 py-1.5 rounded-lg transition-colors">
                      Ver Fotos
                    </button>
                    {!a.confirmada && (
                      <button className="text-xs bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-colors">
                        Agendar Retoque
                      </button>
                    )}
                  </div>

                  {/* Mini chat */}
                  <div>
                    <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                      <MessageCircle size={12} />
                      Chat com {a.clienteNome.split(' ')[0]}
                    </p>
                    <div className="bg-[#111] rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto mb-2">
                      {mensagens.map((msg, i) => (
                        <div key={i} className={`flex ${msg.de === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                            msg.de === 'admin' ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/70'
                          }`}>
                            <p className="text-xs leading-relaxed">{msg.texto}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Responder..."
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                        className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
                      />
                      <button
                        onClick={enviarMensagem}
                        className="bg-rose-gold rounded-xl px-3 py-2 hover:bg-rose-gold-dark transition-colors"
                      >
                        <MessageCircle size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
