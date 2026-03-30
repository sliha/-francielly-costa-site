'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Gift, Copy, Check, Share2, Users, ChevronRight, Heart, Star } from 'lucide-react'

export default function ReferenciaPage() {
  const [copiado, setCopiado] = useState(false)
  const codigoReferencia = 'ANA2026'
  const linkReferencia = `https://franciellycosta.pt/agendar?ref=${codigoReferencia}`

  const copiar = () => {
    navigator.clipboard.writeText(codigoReferencia)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const partilhar = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Francielly Costa — Micropigmentação',
        text: `Usa o meu código ${codigoReferencia} e ganha 10% de desconto na primeira sessão!`,
        url: linkReferencia,
      })
    } else {
      navigator.clipboard.writeText(linkReferencia)
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
              { num: '1', texto: 'Partilhe o seu código único com amigas' },
              { num: '2', texto: 'A amiga agenda e realiza um procedimento usando o código' },
              { num: '3', texto: 'Ambas ganham recompensas automáticas' },
            ].map(p => (
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

        {/* Código */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
          <p className="text-white/40 text-xs mb-2">O seu código de referência</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 text-center">
              <span className="text-white text-2xl font-mono font-bold tracking-widest">{codigoReferencia}</span>
            </div>
            <button
              onClick={copiar}
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

        {/* Estatísticas */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
          <h3 className="text-white/40 text-xs mb-3 uppercase tracking-widest">As suas referências</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-white/30 text-xs">Enviadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">2</p>
              <p className="text-white/30 text-xs">Convertidas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-golden">1</p>
              <p className="text-white/30 text-xs">Pendentes</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { nome: 'Margarida S.', estado: 'Convertida', desconto: '15% usado', cor: 'text-emerald-400' },
              { nome: 'Joana F.', estado: 'Convertida', desconto: '15% usado', cor: 'text-emerald-400' },
              { nome: 'Rita A.', estado: 'Pendente', desconto: 'Aguarda agendamento', cor: 'text-amber-400' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-medium">{r.nome.charAt(0)}</span>
                  </div>
                  <p className="text-white/70 text-sm">{r.nome}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${r.cor}`}>{r.estado}</p>
                  <p className="text-white/30 text-xs">{r.desconto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/servicos"
          className="w-full bg-white/5 border border-white/10 text-white/60 py-3 rounded-xl text-sm text-center hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
        >
          Ver Serviços
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
