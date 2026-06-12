'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Gift, Copy, Check, Share2, ChevronRight, Heart, Loader2 } from 'lucide-react'

interface Resumo {
  codigo: string
  nome: string
  totalEnviadas: number
  totalConvertidas: number
  totalPendentes: number
}

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_LINK || 'https://wa.link/kwctpf'

export default function ReferenciaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [copiado, setCopiado] = useState(false)

  const linkReferencia = resumo ? `${SITE_URL}/agendar?ref=${resumo.codigo}` : ''

  const procurar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setResumo(null)
    setLoading(true)
    try {
      const res = await fetch('/api/referencia/meu-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Ocorreu um erro. Tente novamente.')
        return
      }
      if (!data.existe) {
        setErro(data.message)
        return
      }
      setResumo(data)
    } catch {
      setErro('Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copiar = () => {
    if (!resumo) return
    navigator.clipboard.writeText(resumo.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const partilhar = () => {
    if (!resumo) return
    const texto = `Usa o meu código ${resumo.codigo} para agendar com a Francielly Costa e ganha 10% de desconto na primeira sessão! ${linkReferencia}`
    if (navigator.share) {
      navigator.share({ title: 'Francielly Costa — Dermopigmentação', text: texto, url: linkReferencia })
    } else {
      navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-gold via-rose-gold-dark to-golden px-4 pt-16 pb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
          <Gift size={30} className="text-white" />
        </div>
        <h1 className="text-white text-3xl font-playfair font-bold">Indique uma Amiga</h1>
        <p className="text-white/70 text-sm mt-2 max-w-sm mx-auto">
          Ganhe recompensas por cada amiga que agendar com o seu código
        </p>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Como funciona */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Heart size={16} className="text-rose-gold" />
            Como Funciona
          </h2>
          <div className="space-y-3">
            {[
              { num: '1', texto: 'Após a sua primeira marcação, recebe um código de referência único.' },
              { num: '2', texto: 'Partilhe-o com amigas — elas usam-no ao agendar.' },
              { num: '3', texto: 'Quando a amiga realiza o procedimento, ambas ganham desconto.' },
            ].map((p) => (
              <div key={p.num} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-gold flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{p.num}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recompensas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-rose-gold/10 border border-rose-gold/20 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-rose-gold">15%</p>
            <p className="text-white/60 text-xs mt-1">Desconto para si no próximo procedimento</p>
          </div>
          <div className="bg-golden/10 border border-golden/20 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-golden">10%</p>
            <p className="text-white/60 text-xs mt-1">Desconto para a sua amiga na 1ª sessão</p>
          </div>
        </div>

        {!resumo ? (
          /* Formulário: obter o meu código */
          <form onSubmit={procurar} className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 space-y-3">
            <label className="block text-white/60 text-sm">
              Já é cliente? Veja o seu código de referência
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="O email com que agendou"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-rose-gold/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-gold text-white py-3 rounded-xl font-medium hover:bg-rose-gold-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
              {loading ? 'A procurar...' : 'Ver o meu código'}
            </button>
            {erro && <p className="text-amber-400/90 text-xs text-center leading-relaxed">{erro}</p>}
          </form>
        ) : (
          <>
            {/* Código real */}
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
              <p className="text-white/40 text-xs mb-2">
                {resumo.nome ? `${resumo.nome}, o seu` : 'O seu'} código de referência
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-center">
                  <span className="text-white text-2xl font-mono font-bold tracking-widest">{resumo.codigo}</span>
                </div>
                <button
                  onClick={copiar}
                  aria-label="Copiar código"
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    copiado ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {copiado ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <button
                onClick={partilhar}
                className="w-full mt-3 bg-rose-gold text-white py-3 rounded-xl font-medium hover:bg-rose-gold-dark transition-colors flex items-center justify-center gap-2"
              >
                <Share2 size={16} />
                Partilhar Código
              </button>
            </div>

            {/* Estatísticas reais */}
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
              <h3 className="text-white/40 text-xs mb-3 uppercase tracking-widest">As suas referências</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{resumo.totalEnviadas}</p>
                  <p className="text-white/30 text-xs">Enviadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{resumo.totalConvertidas}</p>
                  <p className="text-white/30 text-xs">Convertidas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-golden">{resumo.totalPendentes}</p>
                  <p className="text-white/30 text-xs">Pendentes</p>
                </div>
              </div>
              {resumo.totalEnviadas === 0 && (
                <p className="text-white/40 text-xs text-center mt-4 leading-relaxed">
                  Ainda não tem indicações. Partilhe o seu código para começar a ganhar recompensas!
                </p>
              )}
            </div>
          </>
        )}

        {/* CTA */}
        <Link
          href="/agendar"
          className="w-full bg-white/5 border border-white/10 text-white/70 py-3 rounded-xl text-sm text-center hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
        >
          Agendar uma marcação
          <ChevronRight size={14} />
        </Link>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-white/40 text-xs hover:text-white/70 transition-colors"
        >
          Dúvidas? Fale connosco pelo WhatsApp
        </a>
      </div>
    </div>
  )
}
