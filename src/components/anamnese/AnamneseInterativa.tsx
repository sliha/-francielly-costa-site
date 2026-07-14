'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ChevronLeft, ChevronRight, Save, Sparkles, Shield, Loader2, X, Mail, PartyPopper,
} from 'lucide-react'
import {
  PASSOS, SECCOES, seccaoPorId, CONSENTIMENTO, CONSENTIMENTO_VERSAO, TOTAL_PASSOS,
  type PassoAnamnese,
} from '@/data/anamneseFiber'
import AssinaturaCanvas from './AssinaturaCanvas'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LS_KEY = 'anamnese_fiber_v1'
const LOGO = '/logo/logo-francielly-branco.png'

type Fase = 'intro' | 'form' | 'concluido'
type Respostas = Record<string, string | string[]>

interface Props {
  tokenInicial?: string
  respostasIniciais?: Respostas
  progressoInicial?: number
  nomePre?: string
  emailPre?: string
  jaSubmetido?: boolean
}

export default function AnamneseInterativa({
  tokenInicial,
  respostasIniciais,
  progressoInicial,
  nomePre,
  emailPre,
  jaSubmetido,
}: Props) {
  const [fase, setFase] = useState<Fase>(jaSubmetido ? 'concluido' : 'intro')
  const [step, setStep] = useState(progressoInicial ?? 0)
  const [token, setToken] = useState<string | null>(tokenInicial ?? null)
  const [respostas, setRespostas] = useState<Respostas>(() => ({
    ...(nomePre ? { nome: nomePre } : {}),
    ...(emailPre ? { email: emailPre } : {}),
    ...(respostasIniciais || {}),
  }))
  const [consentimentoAceite, setConsentimentoAceite] = useState(false)
  const [rgpdAceite, setRgpdAceite] = useState(false)
  const [assinaturaImagem, setAssinaturaImagem] = useState<string | null>(null)
  const [assinaturaNome, setAssinaturaNome] = useState(
    (respostasIniciais?.nome as string) || nomePre || '',
  )
  const [erro, setErro] = useState('')
  const [aSubmeter, setASubmeter] = useState(false)

  // Guardar mais tarde
  const [modalGuardar, setModalGuardar] = useState(false)
  const [emailGuardar, setEmailGuardar] = useState('')
  const [aGuardar, setAGuardar] = useState(false)
  const [guardadoMsg, setGuardadoMsg] = useState('')

  // Hidratar de localStorage se não vier nada do servidor (evita perder progresso num refresh)
  useEffect(() => {
    if (jaSubmetido || tokenInicial) return
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { token?: string; respostas?: Respostas; step?: number }
      if (saved.respostas && Object.keys(saved.respostas).length > 0) {
        setRespostas((r) => ({ ...saved.respostas, ...r }))
        if (typeof saved.step === 'number') setStep(saved.step)
        if (saved.token) setToken(saved.token)
      }
    } catch {
      /* ignora */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistir localmente a cada mudança
  useEffect(() => {
    if (jaSubmetido) return
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ token, respostas, step }))
    } catch {
      /* ignora */
    }
  }, [token, respostas, step, jaSubmetido])

  // Pré-preencher o nome na assinatura com o nome já dado na identificação
  useEffect(() => {
    if (PASSOS[step]?.tipo === 'assinatura' && !assinaturaNome && typeof respostas.nome === 'string') {
      setAssinaturaNome(respostas.nome)
    }
  }, [step, assinaturaNome, respostas.nome])

  const passo = PASSOS[step]
  const seccao = passo ? seccaoPorId(passo.seccao) : SECCOES[0]
  const cor = seccao.cor
  const progresso = Math.round(((step + 1) / TOTAL_PASSOS) * 100)

  const setResposta = useCallback((id: string, valor: string | string[]) => {
    setRespostas((r) => ({ ...r, [id]: valor }))
    setErro('')
  }, [])

  const toggleMulti = useCallback((id: string, valor: string) => {
    setRespostas((r) => {
      const atual = Array.isArray(r[id]) ? (r[id] as string[]) : []
      const novo = atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]
      return { ...r, [id]: novo }
    })
  }, [])

  const valorAtual = passo ? respostas[passo.id] : undefined

  const podeAvancar = useMemo(() => {
    if (!passo) return false
    if (passo.tipo === 'consentimento') return consentimentoAceite && rgpdAceite
    if (passo.tipo === 'assinatura') return !!assinaturaImagem && assinaturaNome.trim().length > 1
    if (passo.tipo === 'multi') return true
    if (!passo.obrigatorio && passo.tipo !== 'single') return true
    const v = valorAtual
    if (passo.tipo === 'single') return typeof v === 'string' && v.length > 0
    if (passo.tipo === 'email') return typeof v === 'string' && EMAIL_REGEX.test(v.trim())
    return typeof v === 'string' && v.trim().length > 0
  }, [passo, valorAtual, consentimentoAceite, rgpdAceite, assinaturaImagem, assinaturaNome])

  const avancar = useCallback(() => {
    if (!podeAvancar) {
      if (passo?.tipo === 'email') setErro('Escreva um email válido.')
      else setErro('Por favor, responda para continuar.')
      return
    }
    setErro('')
    if (step < TOTAL_PASSOS - 1) setStep((s) => s + 1)
  }, [podeAvancar, step, passo])

  const anterior = useCallback(() => {
    setErro('')
    if (step > 0) setStep((s) => s - 1)
    else setFase('intro')
  }, [step])

  // Auto-avanço nas escolhas únicas (sensação fluida)
  const escolherSingle = (valor: string) => {
    setResposta(passo.id, valor)
    window.setTimeout(() => {
      setStep((s) => (s < TOTAL_PASSOS - 1 ? s + 1 : s))
    }, 260)
  }

  const guardarRascunhoServidor = async (enviarLink: boolean, email?: string) => {
    const payload = {
      token: token || undefined,
      respostas: email ? { ...respostas, email } : respostas,
      progressoStep: step,
      enviarLink,
    }
    const res = await fetch('/api/anamnese/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao guardar.')
    if (data.token) setToken(data.token)
    return data as { token: string; emailEnviado: boolean }
  }

  const handleGuardarMaisTarde = async () => {
    const email = (emailGuardar || (respostas.email as string) || '').trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) {
      setGuardadoMsg('erro:Escreva um email válido para lhe enviarmos o link.')
      return
    }
    setAGuardar(true)
    setGuardadoMsg('')
    try {
      setResposta('email', email)
      await guardarRascunhoServidor(true, email)
      setGuardadoMsg('ok:' + email)
    } catch (e) {
      setGuardadoMsg('erro:' + (e instanceof Error ? e.message : 'Erro ao guardar.'))
    } finally {
      setAGuardar(false)
    }
  }

  const handleSubmeter = async () => {
    setErro('')
    setASubmeter(true)
    try {
      // garantir que existe rascunho no servidor (cria token se preciso)
      let tk = token
      if (!tk) {
        const r = await guardarRascunhoServidor(false)
        tk = r.token
      }
      const res = await fetch('/api/anamnese/submeter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tk,
          respostas: { ...respostas, nome: assinaturaNome.trim() || respostas.nome },
          assinaturaNome: assinaturaNome.trim(),
          assinaturaImagem,
          autorizacaoImagem: (respostas.autorizacaoImagem as string) || '',
          consentimentoAceite,
          rgpdAceite,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao submeter. Tente novamente.')
        return
      }
      try {
        localStorage.removeItem(LS_KEY)
      } catch {
        /* ignora */
      }
      setFase('concluido')
    } catch {
      setErro('Erro de ligação. Verifique a internet e tente novamente.')
    } finally {
      setASubmeter(false)
    }
  }

  const incentivo = useMemo(() => {
    if (progresso >= 90) return 'Está quase, só o consentimento!'
    if (progresso >= 66) return 'Já falta pouco 💪'
    if (progresso >= 33) return 'Vai muito bem!'
    return 'Demora só 2 a 3 minutos'
  }, [progresso])

  return (
    <div className="min-h-screen bg-[#F4ECE8]">
      {/* Cabeçalho com logo */}
      <div
        className="w-full flex items-center justify-center py-6 px-4"
        style={{ background: `linear-gradient(135deg, ${SECCOES[0].cor}, #C9A96E)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="Francielly Costa" className="h-12 w-auto" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {/* ── Intro ── */}
          {fase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-3xl shadow-sm p-7 sm:p-9 text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: `${SECCOES[0].cor}18` }}
              >
                <Sparkles size={30} style={{ color: SECCOES[0].cor }} />
              </div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-gray-800 mb-3">
                Ficha de Anamnese FiberBROWS
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Antes do seu procedimento, precisamos de conhecer um pouco da sua saúde e da sua pele.
                É rápido, seguro e ajuda-nos a cuidar melhor de si. Pode <strong>guardar e continuar
                mais tarde</strong> a qualquer momento.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-7">
                {SECCOES.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: `${s.cor}14`, color: s.cor }}
                  >
                    {s.emoji} {s.nome}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setFase('form')}
                className="w-full text-white font-semibold py-4 rounded-2xl transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${SECCOES[0].cor}, #C9A96E)` }}
              >
                Começar <ChevronRight size={18} />
              </button>
              <p className="text-gray-400 text-xs mt-4 flex items-center justify-center gap-1.5">
                <Shield size={12} /> Dados protegidos, submissão segura via HTTPS
              </p>
            </motion.div>
          )}

          {/* ── Formulário ── */}
          {fase === 'form' && passo && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Progresso */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: `${cor}16`, color: cor }}
                  >
                    {seccao.emoji} {seccao.nome}
                  </span>
                  <span className="text-xs text-gray-400">
                    {step + 1} / {TOTAL_PASSOS}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200/70 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cor}, #C9A96E)` }}
                    initial={false}
                    animate={{ width: `${progresso}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 text-right">{incentivo}</p>
              </div>

              {/* Cartão do passo */}
              <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 min-h-[280px] flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={passo.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22 }}
                    className="flex-1"
                  >
                    <PassoRender
                      passo={passo}
                      cor={cor}
                      valor={valorAtual}
                      onTexto={(v) => setResposta(passo.id, v)}
                      onSingle={escolherSingle}
                      onMulti={(v) => toggleMulti(passo.id, v)}
                      onEnter={avancar}
                      consentimentoAceite={consentimentoAceite}
                      rgpdAceite={rgpdAceite}
                      setConsentimentoAceite={setConsentimentoAceite}
                      setRgpdAceite={setRgpdAceite}
                      assinaturaNome={assinaturaNome}
                      setAssinaturaNome={setAssinaturaNome}
                      onAssinatura={setAssinaturaImagem}
                    />
                  </motion.div>
                </AnimatePresence>

                {erro && <p className="text-red-500 text-sm mt-3">{erro}</p>}
              </div>

              {/* Navegação */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={anterior}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm px-3 py-3 transition-colors"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>

                <div className="flex-1" />

                {passo.tipo !== 'single' && passo.tipo !== 'assinatura' && (
                  <button
                    onClick={avancar}
                    disabled={!podeAvancar}
                    className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
                    style={{ background: `linear-gradient(135deg, ${cor}, #C9A96E)` }}
                  >
                    Continuar <ChevronRight size={16} />
                  </button>
                )}

                {passo.tipo === 'assinatura' && (
                  <button
                    onClick={handleSubmeter}
                    disabled={!podeAvancar || aSubmeter}
                    className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${cor}, #C9A96E)` }}
                  >
                    {aSubmeter ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {aSubmeter ? 'A submeter...' : 'Assinar e submeter'}
                  </button>
                )}
              </div>

              {/* Guardar mais tarde */}
              <div className="text-center mt-5">
                <button
                  onClick={() => {
                    setEmailGuardar((respostas.email as string) || '')
                    setGuardadoMsg('')
                    setModalGuardar(true)
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
                >
                  <Save size={13} /> Guardar e continuar mais tarde
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Concluído ── */}
          {fase === 'concluido' && (
            <motion.div
              key="fim"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-sm p-8 sm:p-10 text-center relative overflow-hidden"
            >
              <Confetti />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5"
              >
                <PartyPopper size={38} className="text-emerald-600" />
              </motion.div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-gray-800 mb-3">
                Obrigada!
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                A sua ficha de anamnese e o consentimento ficaram registados com sucesso.
                Enviámos uma cópia para o seu email.
              </p>
              <p className="text-gray-400 text-xs">
                Vemo-nos no dia do procedimento. Qualquer coisa que mude na sua saúde até lá, avise-nos.
              </p>
              <p className="text-gray-300 text-[10px] mt-6">{CONSENTIMENTO_VERSAO}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal guardar mais tarde */}
      <AnimatePresence>
        {modalGuardar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => !aGuardar && setModalGuardar(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-playfair text-lg font-semibold text-gray-800">Guardar para depois</h3>
                <button
                  onClick={() => setModalGuardar(false)}
                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>

              {guardadoMsg.startsWith('ok:') ? (
                <div className="text-center py-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <Mail size={22} className="text-emerald-600" />
                  </div>
                  <p className="text-gray-700 text-sm">
                    Enviámos o link para <strong>{guardadoMsg.slice(3)}</strong>. Pode fechar e continuar
                    quando quiser.
                  </p>
                  <button
                    onClick={() => setModalGuardar(false)}
                    className="mt-5 w-full bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-medium"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 text-sm mb-4">
                    Enviamos-lhe um link para o email, para retomar a ficha exatamente onde ficou.
                  </p>
                  <input
                    type="email"
                    value={emailGuardar}
                    onChange={(e) => setEmailGuardar(e.target.value)}
                    placeholder="o-seu-email@exemplo.com"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-gold text-gray-800 placeholder:text-gray-400 mb-2"
                  />
                  {guardadoMsg.startsWith('erro:') && (
                    <p className="text-red-500 text-xs mb-2">{guardadoMsg.slice(5)}</p>
                  )}
                  <button
                    onClick={handleGuardarMaisTarde}
                    disabled={aGuardar}
                    className="w-full text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${SECCOES[0].cor}, #C9A96E)` }}
                  >
                    {aGuardar ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {aGuardar ? 'A enviar...' : 'Enviar-me o link'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Render de cada passo ──────────────────────────────────────────────────────
function PassoRender({
  passo, cor, valor,
  onTexto, onSingle, onMulti, onEnter,
  consentimentoAceite, rgpdAceite, setConsentimentoAceite, setRgpdAceite,
  assinaturaNome, setAssinaturaNome, onAssinatura,
}: {
  passo: PassoAnamnese
  cor: string
  valor: string | string[] | undefined
  onTexto: (v: string) => void
  onSingle: (v: string) => void
  onMulti: (v: string) => void
  onEnter: () => void
  consentimentoAceite: boolean
  rgpdAceite: boolean
  setConsentimentoAceite: (v: boolean) => void
  setRgpdAceite: (v: boolean) => void
  assinaturaNome: string
  setAssinaturaNome: (v: string) => void
  onAssinatura: (v: string | null) => void
}) {
  const titulo = (
    <>
      <h2 className="font-playfair text-xl sm:text-2xl font-semibold text-gray-800 leading-snug">
        {passo.pergunta}
      </h2>
      {passo.ajuda && <p className="text-gray-400 text-sm mt-1.5">{passo.ajuda}</p>}
    </>
  )

  if (passo.tipo === 'texto' || passo.tipo === 'email' || passo.tipo === 'tel') {
    return (
      <div>
        {titulo}
        <input
          autoFocus
          type={passo.tipo === 'email' ? 'email' : passo.tipo === 'tel' ? 'tel' : 'text'}
          value={(valor as string) || ''}
          onChange={(e) => onTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
          placeholder={passo.placeholder}
          className="w-full mt-5 border-2 border-gray-100 rounded-2xl px-4 py-4 text-gray-800 placeholder:text-gray-300 focus:outline-none text-lg transition-colors"
          style={{ borderColor: (valor as string) ? `${cor}66` : undefined }}
        />
      </div>
    )
  }

  if (passo.tipo === 'textarea') {
    return (
      <div>
        {titulo}
        <textarea
          autoFocus
          value={(valor as string) || ''}
          onChange={(e) => onTexto(e.target.value)}
          placeholder={passo.placeholder}
          rows={4}
          className="w-full mt-5 border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:outline-none resize-none transition-colors"
          style={{ borderColor: (valor as string) ? `${cor}66` : undefined }}
        />
      </div>
    )
  }

  if (passo.tipo === 'single') {
    return (
      <div>
        {titulo}
        <div className="mt-5 space-y-2.5">
          {passo.opcoes!.map((o) => {
            const sel = valor === o.valor
            return (
              <button
                key={o.valor}
                onClick={() => onSingle(o.valor)}
                className="w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center justify-between group"
                style={{
                  borderColor: sel ? cor : '#f0f0f0',
                  background: sel ? `${cor}0f` : '#fff',
                }}
              >
                <span className={`text-sm ${sel ? 'font-medium' : ''}`} style={{ color: sel ? cor : '#444' }}>
                  {o.label}
                </span>
                <span
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: sel ? cor : '#ddd', background: sel ? cor : 'transparent' }}
                >
                  {sel && <Check size={12} className="text-white" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (passo.tipo === 'multi') {
    const sel = Array.isArray(valor) ? valor : []
    return (
      <div>
        {titulo}
        <div className="mt-5 space-y-2">
          {passo.opcoes!.map((o) => {
            const on = sel.includes(o.valor)
            return (
              <button
                key={o.valor}
                onClick={() => onMulti(o.valor)}
                className="w-full text-left px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-3"
                style={{ borderColor: on ? cor : '#f0f0f0', background: on ? `${cor}0f` : '#fff' }}
              >
                <span
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: on ? cor : '#ddd', background: on ? cor : 'transparent' }}
                >
                  {on && <Check size={12} className="text-white" />}
                </span>
                <span className="text-sm" style={{ color: on ? cor : '#444' }}>
                  {o.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (passo.tipo === 'consentimento') {
    return (
      <div>
        <h2 className="font-playfair text-xl sm:text-2xl font-semibold text-gray-800 mb-1">
          {CONSENTIMENTO.titulo}
        </h2>
        <p className="text-sm mb-4" style={{ color: cor }}>{CONSENTIMENTO.subtitulo}</p>

        <div className="max-h-64 overflow-y-auto pr-1 space-y-4 text-sm text-gray-600 leading-relaxed">
          <p>{CONSENTIMENTO.procedimento}</p>
          <BlocoLista titulo="Riscos possíveis" itens={CONSENTIMENTO.riscos} cor={cor} />
          <BlocoLista titulo="Contraindicações" itens={CONSENTIMENTO.contraindicacoes} cor={cor} />
          <BlocoLista titulo="Cuidados pós-procedimento" itens={CONSENTIMENTO.cuidados} cor={cor} />
          <BlocoLista titulo="Declaro que" itens={CONSENTIMENTO.declaracoes} cor={cor} />
          <p className="text-xs text-gray-400">{CONSENTIMENTO.rgpd}</p>
        </div>

        <div className="mt-5 space-y-3">
          <CheckLinha checked={consentimentoAceite} onChange={setConsentimentoAceite} cor={cor}>
            Li e aceito as condições do procedimento e as declarações acima.
          </CheckLinha>
          <CheckLinha checked={rgpdAceite} onChange={setRgpdAceite} cor={cor}>
            Dou o meu <strong>consentimento explícito</strong> para o tratamento dos meus dados,
            incluindo os dados de saúde, para os fins descritos (RGPD).
          </CheckLinha>
        </div>
      </div>
    )
  }

  if (passo.tipo === 'assinatura') {
    return (
      <div>
        <h2 className="font-playfair text-xl sm:text-2xl font-semibold text-gray-800 leading-snug">
          {passo.pergunta}
        </h2>
        <p className="text-gray-400 text-sm mt-1.5">
          Assine no quadro e escreva o seu nome completo. A data e a hora ficam registadas automaticamente.
        </p>
        <div className="mt-5">
          <AssinaturaCanvas onChange={onAssinatura} cor={cor} />
        </div>
        <input
          type="text"
          value={assinaturaNome}
          onChange={(e) => setAssinaturaNome(e.target.value)}
          placeholder="Nome completo (assinatura)"
          className="w-full mt-3 border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-800 placeholder:text-gray-300 focus:outline-none transition-colors"
          style={{ borderColor: assinaturaNome ? `${cor}66` : undefined }}
        />
      </div>
    )
  }

  return null
}

function BlocoLista({ titulo, itens, cor }: { titulo: string; itens: string[]; cor: string }) {
  return (
    <div>
      <p className="font-semibold mb-1" style={{ color: cor }}>{titulo}</p>
      <ul className="list-disc pl-5 space-y-0.5">
        {itens.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

function CheckLinha({
  checked, onChange, cor, children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  cor: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full text-left flex items-start gap-3 px-3 py-3 rounded-2xl border-2 transition-all"
      style={{ borderColor: checked ? cor : '#f0f0f0', background: checked ? `${cor}0d` : '#fff' }}
    >
      <span
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ borderColor: checked ? cor : '#ddd', background: checked ? cor : 'transparent' }}
      >
        {checked && <Check size={12} className="text-white" />}
      </span>
      <span className="text-sm text-gray-600 leading-relaxed">{children}</span>
    </button>
  )
}

function Confetti() {
  const pontos = Array.from({ length: 14 })
  const cores = ['#B76E79', '#C9A96E', '#5EAA8B', '#B08BBB', '#7BA7C9']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pontos.map((_, i) => {
        const left = (i * 37) % 100
        const cor = cores[i % cores.length]
        const delay = (i % 5) * 0.08
        return (
          <motion.span
            key={i}
            className="absolute top-0 w-2 h-2 rounded-sm"
            style={{ left: `${left}%`, background: cor }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: 320, opacity: [0, 1, 1, 0], rotate: 360 }}
            transition={{ duration: 1.6, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}
