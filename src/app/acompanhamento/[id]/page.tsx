'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  Camera,
  ChevronRight,
  Send,
  Heart,
  AlertCircle,
  X,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  getAcompanhamentoPorCodigo,
  subscribeMensagens,
  adicionarMensagem,
  uploadFoto,
  getFotos,
  confirmarRetoque,
  type Acompanhamento,
  type Mensagem,
  type Foto,
} from '@/lib/acompanhamentos'

const timelineData = [
  {
    dia: 1,
    titulo: 'Dia 1 — Pós-Procedimento Imediato',
    instrucoes: 'Mantenha a zona limpa e seca. Não toque com as mãos. Aplique a pomada cicatrizante fornecida em camada fina.',
    checklistItems: ['Aplicou a pomada cicatrizante', 'Evitou tocar na zona tratada', 'Não molhou a zona', 'Dormiu com almofada limpa'],
  },
  {
    dia: 3,
    titulo: 'Dia 3 — Início da Cicatrização',
    instrucoes: 'É normal sentir comichão e ver pequenas escamas. NÃO arranque. Continue a aplicar a pomada. Evite maquilhagem na zona.',
    checklistItems: ['Continuou a aplicar pomada', 'Resistiu à comichão (não coçou)', 'Evitou maquilhagem na zona', 'Bebeu bastante água'],
  },
  {
    dia: 7,
    titulo: 'Dia 7 — Queda das Crostas',
    instrucoes: 'As crostas devem estar a cair naturalmente. O pigmento parece mais claro — é normal! Evite exposição solar directa.',
    checklistItems: ['As crostas caíram naturalmente', 'Usou protector solar', 'Evitou piscina e sauna', 'Continuou a hidratar a zona'],
  },
  {
    dia: 14,
    titulo: 'Dia 14 — Estabilização',
    instrucoes: 'O pigmento está a estabilizar. Já pode usar maquilhagem com cuidado. O resultado final só se vê ao fim de 30 dias.',
    checklistItems: ['Avaliou o resultado provisório', 'Retomou a rotina normal', 'Evitou esfoliação na zona', 'Fotografou o resultado'],
  },
  {
    dia: 30,
    titulo: 'Dia 30 — Resultado Final',
    instrucoes: 'Este é o resultado definitivo! Se necessário, agende a sessão de retoque para correcções ou intensificação de cor.',
    checklistItems: ['Tirou foto do resultado final', 'Avaliou se precisa de retoque', 'Agendou sessão de retoque', 'Partilhou a experiência'],
  },
]

export default function AcompanhamentoPage() {
  const params = useParams()
  const codigoUrl = String(params.id || '')

  const [carregando, setCarregando] = useState(true)
  const [acomp, setAcomp] = useState<Acompanhamento | null>(null)
  const [autenticado, setAutenticado] = useState(false)
  const [codigoInput, setCodigoInput] = useState('')
  const [erroCodigo, setErroCodigo] = useState(false)

  const [diaIdxAtivo, setDiaIdxAtivo] = useState<number | null>(null)
  const [checklist, setChecklist] = useState<Record<number, boolean[]>>({})
  const [mensagem, setMensagem] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [enviando, setEnviando] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'fotos' | 'chat'>('timeline')
  const [showFotoUpload, setShowFotoUpload] = useState<number | null>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const init: Record<number, boolean[]> = {}
    timelineData.forEach((t, i) => { init[i] = Array(t.checklistItems.length).fill(false) })
    setChecklist(init)
  }, [])

  // Tenta carregar pelo código que vem no URL
  useEffect(() => {
    if (!codigoUrl) {
      setCarregando(false)
      return
    }
    getAcompanhamentoPorCodigo(codigoUrl)
      .then((d) => {
        if (d) {
          setAcomp(d)
          setAutenticado(true)
        }
      })
      .finally(() => setCarregando(false))
  }, [codigoUrl])

  // Subscribe mensagens
  useEffect(() => {
    if (!acomp?.id) return
    if (unsubRef.current) unsubRef.current()
    unsubRef.current = subscribeMensagens(acomp.id, setMensagens)
    getFotos(acomp.id).then(setFotos).catch(() => setFotos([]))
    return () => { if (unsubRef.current) unsubRef.current() }
  }, [acomp?.id])

  const handleCodigoManual = async () => {
    if (codigoInput.length !== 6) return
    setCarregando(true)
    try {
      const d = await getAcompanhamentoPorCodigo(codigoInput)
      if (d) {
        setAcomp(d)
        setAutenticado(true)
      } else {
        setErroCodigo(true)
        setTimeout(() => setErroCodigo(false), 2000)
      }
    } finally {
      setCarregando(false)
    }
  }

  const toggleCheck = (diaIdx: number, itemIdx: number) => {
    setChecklist((prev) => ({
      ...prev,
      [diaIdx]: prev[diaIdx].map((v, i) => (i === itemIdx ? !v : v)),
    }))
  }

  const progresso = (diaIdx: number) => {
    if (!checklist[diaIdx]) return 0
    const done = checklist[diaIdx].filter(Boolean).length
    return Math.round((done / timelineData[diaIdx].checklistItems.length) * 100)
  }

  const enviarMensagem = async () => {
    if (!acomp?.id || !mensagem.trim() || enviando) return
    setEnviando(true)
    try {
      await adicionarMensagem(acomp.id, 'cliente', mensagem)
      setMensagem('')
    } catch {
      alert('Erro ao enviar mensagem.')
    } finally {
      setEnviando(false)
    }
  }

  const handleConfirmarRetoque = async () => {
    if (!acomp?.id) return
    try {
      await confirmarRetoque(acomp.id, true)
      setAcomp({ ...acomp, retoqueConfirmado: true })
    } catch {
      alert('Erro ao confirmar.')
    }
  }

  const handleUploadFoto = async (file: File) => {
    if (!acomp?.id || !file) return
    setUploading(true)
    try {
      const nova = await uploadFoto(acomp.id, file, showFotoUpload ?? undefined)
      setFotos((prev) => [...prev, nova])
      setShowFotoUpload(null)
    } catch {
      alert('Erro no upload da foto.')
    } finally {
      setUploading(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
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
            <p className="text-white/70 text-sm mb-4">
              Introduza o código de 6 dígitos que recebeu por email.
            </p>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleCodigoManual()}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none transition-colors ${
                erroCodigo ? 'border-red-400' : 'border-white/10 focus:border-rose-gold'
              }`}
            />
            {erroCodigo && (
              <p className="text-red-400 text-xs text-center mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={12} />
                Código incorrecto.
              </p>
            )}
            <button
              onClick={handleCodigoManual}
              disabled={codigoInput.length !== 6}
              className="w-full bg-rose-gold text-white rounded-xl py-3 font-medium mt-4 hover:bg-opacity-90 disabled:opacity-40 transition-colors"
            >
              Aceder
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!acomp) return null

  const dataProcedimentoFmt = (() => {
    try { return format(parseISO(acomp.dataProcedimento), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) }
    catch { return acomp.dataProcedimento }
  })()

  const retoqueDataFmt = acomp.retoqueData ? (() => {
    try { return format(parseISO(acomp.retoqueData), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) }
    catch { return acomp.retoqueData }
  })() : null

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="bg-gradient-to-r from-rose-gold to-golden px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-sm">Bem-vinda de volta,</p>
          <h1 className="text-white text-2xl font-playfair font-semibold">{acomp.clienteNome}</h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="bg-white/20 rounded-xl px-3 py-1.5">
              <p className="text-white/70 text-xs">Procedimento</p>
              <p className="text-white font-medium text-sm">{acomp.servicoNome}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-1.5">
              <p className="text-white/70 text-xs">Data</p>
              <p className="text-white font-medium text-sm">{dataProcedimentoFmt}</p>
            </div>
          </div>
        </div>
      </div>

      {retoqueDataFmt && !acomp.retoqueConfirmado && (
        <div className="px-4 -mt-3">
          <div className="max-w-lg mx-auto bg-golden/10 border border-golden/30 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Sessão de Retoque</p>
              <p className="text-white/50 text-xs">{retoqueDataFmt}</p>
            </div>
            <button onClick={handleConfirmarRetoque}
              className="bg-golden text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-opacity-90 transition-colors">
              Confirmar
            </button>
          </div>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="max-w-lg mx-auto flex gap-1 bg-[#1A1A1A] rounded-xl p-1">
          {(['timeline', 'fotos', 'chat'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-rose-gold text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {tab === 'timeline' ? 'Recuperação' : tab === 'fotos' ? 'Fotos' : 'Chat'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 mt-4">
        <div className="max-w-lg mx-auto">
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {timelineData.map((fase, idx) => {
                const isActive = diaIdxAtivo === idx
                const prog = progresso(idx)
                const allDone = prog === 100
                return (
                  <div key={fase.dia} className={`bg-[#1A1A1A] rounded-2xl border transition-colors ${
                    allDone ? 'border-emerald-400/30' : isActive ? 'border-rose-gold/30' : 'border-white/5'
                  }`}>
                    <button onClick={() => setDiaIdxAtivo(isActive ? null : idx)}
                      className="w-full p-4 flex items-center gap-3 text-left">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${allDone ? 'bg-emerald-400/10' : 'bg-rose-gold/10'}`}>
                        <span className={`text-sm font-bold ${allDone ? 'text-emerald-400' : 'text-rose-gold'}`}>D{fase.dia}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{fase.titulo}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-400' : 'bg-rose-gold'}`} style={{ width: `${prog}%` }} />
                          </div>
                          <span className="text-white/40 text-xs">{prog}%</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`text-white/30 transition-transform flex-shrink-0 ${isActive ? 'rotate-90' : ''}`} />
                    </button>
                    {isActive && (
                      <div className="px-4 pb-4 border-t border-white/5">
                        <p className="text-white/60 text-sm mt-3 leading-relaxed">{fase.instrucoes}</p>
                        <div className="mt-4 space-y-2">
                          {fase.checklistItems.map((item, itemIdx) => (
                            <button key={itemIdx} onClick={() => toggleCheck(idx, itemIdx)}
                              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left">
                              {checklist[idx]?.[itemIdx]
                                ? <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                                : <Circle size={18} className="text-white/20 flex-shrink-0" />}
                              <span className={`text-sm ${checklist[idx]?.[itemIdx] ? 'text-white/50 line-through' : 'text-white/70'}`}>
                                {item}
                              </span>
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setShowFotoUpload(idx)}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-sm text-white/60 transition-colors">
                          <Camera size={16} />Fotografar evolução — Dia {fase.dia}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'fotos' && (
            <div>
              <p className="text-white/40 text-sm mb-4">Registe a evolução com fotos</p>
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {fotos.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt="Foto" className="aspect-square object-cover rounded-xl" />
                    </a>
                  ))}
                </div>
              )}
              <button onClick={() => setShowFotoUpload(0)}
                className="w-full flex items-center justify-center gap-2 bg-rose-gold/10 hover:bg-rose-gold/20 border border-rose-gold/30 rounded-2xl py-4 text-sm text-rose-gold font-medium transition-colors">
                <Camera size={18} />
                Adicionar Foto
              </button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">FC</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Francielly Costa</p>
                    <span className="text-white/40 text-xs">Disponível</span>
                  </div>
                </div>
                <div className="p-4 space-y-3 min-h-48 max-h-72 overflow-y-auto">
                  {mensagens.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-8">
                      Sem mensagens. Envie a primeira!
                    </p>
                  ) : mensagens.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.de === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.de === 'cliente' ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/80'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
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
                  <button onClick={enviarMensagem} disabled={enviando || !mensagem.trim()}
                    className="w-10 h-10 bg-rose-gold rounded-xl flex items-center justify-center hover:bg-opacity-90 disabled:opacity-40 transition-colors">
                    <Send size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showFotoUpload !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">
                Foto {showFotoUpload < timelineData.length ? `— Dia ${timelineData[showFotoUpload].dia}` : ''}
              </h3>
              <button onClick={() => setShowFotoUpload(null)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFoto(f) }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full border-2 border-dashed border-white/10 rounded-2xl p-10 text-center hover:border-rose-gold/30 transition-colors disabled:opacity-50">
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/60 text-sm">A enviar...</p>
                </>
              ) : (
                <>
                  <Camera size={32} className="text-white/30 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Tirar/Selecionar foto</p>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
