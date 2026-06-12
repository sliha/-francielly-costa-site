'use client'
import { useState, useRef } from 'react'
import { Camera, Sparkles, X, Upload, ChevronRight, Loader2 } from 'lucide-react'

interface SimuladorIAProps {
  servicoNome: string
}

export default function SimuladorIA({ servicoNome }: SimuladorIAProps) {
  const [aberto, setAberto] = useState(false)
  const [foto, setFoto] = useState<string | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [consentiu, setConsentiu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setFoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const analisar = async () => {
    if (!foto) return
    setAnalisando(true)
    setResultado(null)

    try {
      const base64 = foto.split(',')[1]
      const res = await fetch('/api/simulador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagemBase64: base64, servico: servicoNome }),
      })
      const data = await res.json()
      setResultado(data.analise || 'Não foi possível gerar a análise.')
    } catch {
      setResultado('Ocorreu um erro. Por favor tente novamente.')
    } finally {
      setAnalisando(false)
    }
  }

  const reset = () => {
    setFoto(null)
    setResultado(null)
    setConsentiu(false)
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="w-full flex items-center justify-between bg-gradient-to-r from-rose-gold/10 to-golden/10 border border-rose-gold/20 rounded-2xl p-4 hover:border-rose-gold/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-medium text-sm">Veja como ficaria em si</p>
            <p className="text-white/40 text-xs">Análise personalizada com IA · Gratuito</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-white/30 group-hover:text-rose-gold transition-colors" />
      </button>
    )
  }

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-rose-gold/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-rose-gold" />
          <p className="text-white font-medium text-sm">Simulador de Resultado IA</p>
        </div>
        <button onClick={() => { setAberto(false); reset() }} className="text-white/30 hover:text-white/60">
          <X size={18} />
        </button>
      </div>

      <div className="p-4">
        {!foto && !resultado && (
          <div>
            <p className="text-white/50 text-sm mb-4 leading-relaxed">
              Tire uma selfie ou faça upload de uma foto do seu rosto. A nossa IA irá analisar as suas características e descrever como ficaria o resultado de <span className="text-white">{servicoNome}</span> especificamente em si.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFoto}
              className="hidden"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { if (inputRef.current) { inputRef.current.setAttribute('capture', 'user'); inputRef.current.click() } }}
                className="flex-1 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-4 transition-colors"
              >
                <Camera size={24} className="text-rose-gold" />
                <span className="text-white/60 text-sm">Selfie</span>
              </button>
              <button
                onClick={() => { if (inputRef.current) { inputRef.current.removeAttribute('capture'); inputRef.current.click() } }}
                className="flex-1 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-4 transition-colors"
              >
                <Upload size={24} className="text-golden" />
                <span className="text-white/60 text-sm">Galeria</span>
              </button>
            </div>
            <p className="text-white/30 text-xs text-center mt-3 leading-relaxed">
              A foto é enviada de forma segura para um serviço de IA (Anthropic, EUA) apenas para
              gerar a análise — não é guardada por nós nem usada para outro fim.{' '}
              <a href="/privacidade" className="underline hover:text-white/60">Política de Privacidade</a>
            </p>
          </div>
        )}

        {foto && !resultado && (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto}
              alt="Sua foto"
              className="w-32 h-32 rounded-2xl object-cover mx-auto mb-4 border-2 border-rose-gold/30"
            />
            {analisando ? (
              <div>
                <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                  <Loader2 size={16} className="animate-spin text-rose-gold" />
                  <span className="text-sm">A IA está a analisar o seu rosto...</span>
                </div>
                <p className="text-white/30 text-xs">Isto pode demorar alguns segundos</p>
              </div>
            ) : (
              <div>
                <label className="flex items-start gap-2 text-left mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentiu}
                    onChange={(e) => setConsentiu(e.target.checked)}
                    className="mt-0.5 accent-rose-gold w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-white/50 text-xs leading-relaxed">
                    Autorizo o envio da minha fotografia para análise por IA (Anthropic, EUA),
                    apenas para gerar esta simulação. A foto não é guardada.
                  </span>
                </label>
                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 bg-white/5 text-white/60 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
                    Trocar Foto
                  </button>
                  <button
                    onClick={analisar}
                    disabled={!consentiu}
                    className="flex-1 bg-rose-gold text-white py-3 rounded-xl text-sm font-medium hover:bg-rose-gold-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={14} />
                    Analisar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {resultado && (
          <div>
            <div className="flex gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto!}
                alt="Sua foto"
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-rose-gold/20"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles size={12} className="text-rose-gold" />
                  <span className="text-rose-gold text-xs font-medium">Análise IA para {servicoNome}</span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{resultado}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2">
              <a
                href="#booking"
                onClick={() => setAberto(false)}
                className="w-full bg-rose-gold text-white py-3 rounded-xl text-sm font-medium hover:bg-rose-gold-dark transition-colors flex items-center justify-center gap-2"
              >
                Gostou? Agende já com a Sofia!
                <ChevronRight size={14} />
              </a>
              <button onClick={reset} className="w-full bg-white/5 text-white/50 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
                Tentar com outra foto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
