'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  Camera,
  MessageCircle,
  Calendar,
  Clock,
  ChevronRight,
  Send,
  Lock,
  Heart,
  AlertCircle,
  X,
} from 'lucide-react'

const timelineData = [
  {
    dia: 1,
    titulo: 'Dia 1 — Pós-Procedimento Imediato',
    instrucoes: 'Mantenha a zona limpa e seca. Não toque com as mãos. Aplique a pomada cicatrizante fornecida em camada fina.',
    checklistItems: [
      'Aplicou a pomada cicatrizante',
      'Evitou tocar na zona tratada',
      'Não molhou a zona',
      'Dormiu com almofada limpa',
    ],
  },
  {
    dia: 3,
    titulo: 'Dia 3 — Início da Cicatrização',
    instrucoes: 'É normal sentir comichão e ver pequenas escamas. NÃO arranque. Continue a aplicar a pomada. Evite maquilhagem na zona.',
    checklistItems: [
      'Continuou a aplicar pomada',
      'Resistiu à comichão (não coçou)',
      'Evitou maquilhagem na zona',
      'Bebeu bastante água',
    ],
  },
  {
    dia: 7,
    titulo: 'Dia 7 — Queda das Crostas',
    instrucoes: 'As crostas devem estar a cair naturalmente. O pigmento parece mais claro — é normal! Evite exposição solar directa.',
    checklistItems: [
      'As crostas caíram naturalmente',
      'Usou protector solar (se exposta ao sol)',
      'Evitou piscina e sauna',
      'Continuou a hidratar a zona',
    ],
  },
  {
    dia: 14,
    titulo: 'Dia 14 — Estabilização',
    instrucoes: 'O pigmento está a estabilizar. Já pode usar maquilhagem com cuidado. O resultado final só se vê ao fim de 30 dias.',
    checklistItems: [
      'Avaliou o resultado provisório',
      'Retomou a rotina normal de cuidados',
      'Evitou esfoliação na zona',
      'Fotografou o resultado para comparar',
    ],
  },
  {
    dia: 30,
    titulo: 'Dia 30 — Resultado Final',
    instrucoes: 'Este é o resultado definitivo! Se necessário, agende a sessão de retoque para correcções ou intensificação de cor.',
    checklistItems: [
      'Tirou foto do resultado final',
      'Avaliou se precisa de retoque',
      'Agendou sessão de retoque (se necessário)',
      'Partilhou a experiência com a Francielly',
    ],
  },
]

const dadosMock = {
  cliente: 'Ana Silva',
  servico: 'Microblading',
  dataProcedimento: '15 de Março de 2026',
  proximaSessao: '15 de Abril de 2026',
  proximaSessaoConfirmada: false,
}

const mensagensMock = [
  { de: 'admin', texto: 'Olá Ana! O procedimento correu muito bem. Aqui fica o seu espaço de acompanhamento. Qualquer dúvida estou disponível 😊', data: '15 Mar, 14:30' },
  { de: 'cliente', texto: 'Obrigada Francielly! Estou a gostar muito do resultado já!', data: '15 Mar, 16:00' },
]

export default function AcompanhamentoPage() {
  const params = useParams()
  const [autenticado, setAutenticado] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erroCodigo, setErroCodigo] = useState(false)
  const [diaAtual, setDiaAtual] = useState<number | null>(null)
  const [checklist, setChecklist] = useState<Record<number, boolean[]>>({})
  const [mensagem, setMensagem] = useState('')
  const [mensagens, setMensagens] = useState(mensagensMock)
  const [activeTab, setActiveTab] = useState<'timeline' | 'chat' | 'fotos'>('timeline')
  const [showFotoUpload, setShowFotoUpload] = useState<number | null>(null)

  useEffect(() => {
    // Inicializar checklist
    const init: Record<number, boolean[]> = {}
    timelineData.forEach((t, i) => {
      init[i] = Array(t.checklistItems.length).fill(false)
    })
    setChecklist(init)
  }, [])

  const handleCodigo = () => {
    if (codigo === '123456') {
      setAutenticado(true)
    } else {
      setErroCodigo(true)
      setTimeout(() => setErroCodigo(false), 2000)
    }
  }

  const toggleCheck = (diaIdx: number, itemIdx: number) => {
    setChecklist(prev => ({
      ...prev,
      [diaIdx]: prev[diaIdx].map((v, i) => i === itemIdx ? !v : v),
    }))
  }

  const progresso = (diaIdx: number) => {
    if (!checklist[diaIdx]) return 0
    const done = checklist[diaIdx].filter(Boolean).length
    return Math.round((done / timelineData[diaIdx].checklistItems.length) * 100)
  }

  const enviarMensagem = () => {
    if (!mensagem.trim()) return
    setMensagens(prev => [...prev, { de: 'cliente', texto: mensagem, data: 'Agora' }])
    setMensagem('')
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-white" />
            </div>
            <h1 className="text-white text-2xl font-playfair font-semibold">Área Pessoal</h1>
            <p className="text-white/40 text-sm mt-2">Acompanhamento pós-procedimento</p>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-rose-gold" />
              <p className="text-white/70 text-sm">Introduza o código de 6 dígitos recebido por email/SMS</p>
            </div>

            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleCodigo()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none transition-colors ${
                erroCodigo ? 'border-red-400' : 'border-white/10 focus:border-rose-gold'
              }`}
            />

            {erroCodigo && (
              <p className="text-red-400 text-xs text-center mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                Código incorrecto. Tente novamente.
              </p>
            )}

            <button
              onClick={handleCodigo}
              disabled={codigo.length !== 6}
              className="w-full bg-rose-gold text-white rounded-xl py-3 font-medium mt-4 hover:bg-rose-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Aceder
            </button>

            <p className="text-white/30 text-xs text-center mt-4">
              Não recebeu o código?{' '}
              <button className="text-rose-gold hover:underline">Reenviar</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-gold to-golden px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-sm">Bem-vinda de volta,</p>
          <h1 className="text-white text-2xl font-playfair font-semibold">{dadosMock.cliente}</h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="bg-white/20 rounded-xl px-3 py-1.5">
              <p className="text-white/70 text-xs">Procedimento</p>
              <p className="text-white font-medium text-sm">{dadosMock.servico}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-1.5">
              <p className="text-white/70 text-xs">Data</p>
              <p className="text-white font-medium text-sm">{dadosMock.dataProcedimento}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Próxima sessão banner */}
      {!dadosMock.proximaSessaoConfirmada && (
        <div className="mx-4 -mt-3 max-w-lg mx-auto">
          <div className="bg-golden/10 border border-golden/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-golden flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">Sessão de Retoque</p>
                <p className="text-white/50 text-xs">{dadosMock.proximaSessao}</p>
              </div>
            </div>
            <button className="bg-golden text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-golden-dark transition-colors">
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 mt-4 max-w-lg mx-auto">
        <div className="flex gap-1 bg-[#1A1A1A] rounded-xl p-1">
          {(['timeline', 'fotos', 'chat'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-rose-gold text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'timeline' ? 'Recuperação' : tab === 'fotos' ? 'Fotos' : 'Chat'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 mt-4 max-w-lg mx-auto">
        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {timelineData.map((fase, idx) => {
              const isActive = diaAtual === idx
              const prog = progresso(idx)
              const allDone = prog === 100

              return (
                <div key={fase.dia} className={`bg-[#1A1A1A] rounded-2xl border transition-colors ${
                  allDone ? 'border-emerald-400/30' : isActive ? 'border-rose-gold/30' : 'border-white/5'
                }`}>
                  <button
                    onClick={() => setDiaAtual(isActive ? null : idx)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    {/* Day badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      allDone ? 'bg-emerald-400/10' : 'bg-rose-gold/10'
                    }`}>
                      <span className={`text-sm font-bold ${allDone ? 'text-emerald-400' : 'text-rose-gold'}`}>
                        D{fase.dia}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{fase.titulo}</p>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-400' : 'bg-rose-gold'}`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                        <span className="text-white/40 text-xs">{prog}%</span>
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      className={`text-white/30 transition-transform flex-shrink-0 ${isActive ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isActive && (
                    <div className="px-4 pb-4 border-t border-white/5">
                      <p className="text-white/60 text-sm mt-3 leading-relaxed">{fase.instrucoes}</p>

                      <div className="mt-4 space-y-2">
                        {fase.checklistItems.map((item, itemIdx) => (
                          <button
                            key={itemIdx}
                            onClick={() => toggleCheck(idx, itemIdx)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                          >
                            {checklist[idx]?.[itemIdx] ? (
                              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Circle size={18} className="text-white/20 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${checklist[idx]?.[itemIdx] ? 'text-white/50 line-through' : 'text-white/70'}`}>
                              {item}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Upload foto */}
                      <button
                        onClick={() => setShowFotoUpload(idx)}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-sm text-white/60 transition-colors"
                      >
                        <Camera size={16} />
                        Fotografar evolução — Dia {fase.dia}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Fotos Tab */}
        {activeTab === 'fotos' && (
          <div>
            <p className="text-white/40 text-sm mb-4">Registe a evolução com fotos em cada fase</p>
            <div className="grid grid-cols-2 gap-3">
              {timelineData.map((fase, idx) => (
                <button
                  key={fase.dia}
                  onClick={() => setShowFotoUpload(idx)}
                  className="aspect-square bg-[#1A1A1A] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-rose-gold/30 transition-colors"
                >
                  <Camera size={24} className="text-white/20" />
                  <span className="text-white/40 text-xs">Dia {fase.dia}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div>
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">FC</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Francielly Costa</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white/40 text-xs">Disponível</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 min-h-48 max-h-72 overflow-y-auto">
                {mensagens.map((msg, i) => (
                  <div key={i} className={`flex ${msg.de === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.de === 'cliente'
                        ? 'bg-rose-gold text-white'
                        : 'bg-white/5 text-white/80'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.texto}</p>
                      <p className={`text-xs mt-1 ${msg.de === 'cliente' ? 'text-white/60' : 'text-white/30'}`}>
                        {msg.data}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva a sua dúvida..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
                  className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:bg-white/10 transition-colors"
                />
                <button
                  onClick={enviarMensagem}
                  disabled={!mensagem.trim()}
                  className="w-10 h-10 bg-rose-gold rounded-xl flex items-center justify-center hover:bg-rose-gold-dark disabled:opacity-40 transition-colors"
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal upload foto */}
      {showFotoUpload !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Foto — Dia {timelineData[showFotoUpload].dia}</h3>
              <button onClick={() => setShowFotoUpload(null)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center">
              <Camera size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm mb-4">Tire uma foto ou selecione da galeria</p>
              <div className="flex gap-3 justify-center">
                <button className="bg-rose-gold text-white text-sm px-4 py-2 rounded-xl">
                  Câmara
                </button>
                <button className="bg-white/10 text-white/70 text-sm px-4 py-2 rounded-xl">
                  Galeria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
