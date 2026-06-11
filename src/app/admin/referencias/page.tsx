'use client'
import { useState, useEffect, useCallback } from 'react'
import { Gift, Search, ChevronRight, Copy } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import type { Referencia } from '@/lib/referencias'

interface Grupo {
  refenteEmail: string
  refenteNome: string
  codigoReferencia: string
  totalEnviadas: number
  totalConvertidas: number
  ultimaActividade?: string | null
  referencias: Referencia[]
}

function rowToReferencia(r: Record<string, any>): Referencia {
  return {
    id: r.id,
    codigoUsado: r.codigo_usado ?? '',
    refenteEmail: r.refente_email ?? '',
    refenteNome: r.refente_nome ?? '',
    novoNome: r.novo_nome ?? '',
    novoEmail: r.novo_email ?? '',
    agendamentoId: r.agendamento_id ?? '',
    servicoNome: r.servico_nome ?? '',
    estado: r.estado,
    criadoEm: r.criado_em ?? undefined,
    convertidaEm: r.convertida_em ?? null,
  }
}

// Agrupa referências por cliente refente (replica getReferenciasAgrupadas client-side)
function agruparReferencias(todas: Referencia[]): Grupo[] {
  const map = new Map<string, {
    refenteEmail: string
    refenteNome: string
    codigoReferencia: string
    referencias: Referencia[]
  }>()
  for (const r of todas) {
    const chave = r.refenteEmail
    const cur = map.get(chave) || {
      refenteEmail: r.refenteEmail,
      refenteNome: r.refenteNome,
      codigoReferencia: r.codigoUsado,
      referencias: [],
    }
    cur.referencias.push(r)
    map.set(chave, cur)
  }
  return Array.from(map.values()).map((g) => ({
    ...g,
    totalEnviadas: g.referencias.length,
    totalConvertidas: g.referencias.filter((x) => x.estado === 'convertida').length,
    ultimaActividade: g.referencias[0]?.criadoEm ?? null,
  })).sort((a, b) => b.totalEnviadas - a.totalEnviadas)
}

export default function ReferenciasAdminPage() {
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [origem, setOrigem] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigem(window.location.origin)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('referencias')
        .select('*')
        .order('criado_em', { ascending: false })
      setGrupos(agruparReferencias((data ?? []).map(rowToReferencia)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtrados = grupos.filter((g) =>
    g.refenteNome.toLowerCase().includes(busca.toLowerCase()) ||
    g.codigoReferencia.toLowerCase().includes(busca.toLowerCase())
  )

  const totalConversoes = grupos.reduce((s, g) => s + g.totalConvertidas, 0)
  const totalReferencias = grupos.reduce((s, g) => s + g.totalEnviadas, 0)
  const taxaConversao = totalReferencias > 0 ? Math.round((totalConversoes / totalReferencias) * 100) : 0

  const copiarLink = (codigo: string) => {
    const url = `${origem}/agendar?ref=${codigo}`
    navigator.clipboard.writeText(url).then(() => {
      alert(`Link copiado:\n${url}`)
    })
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8">
        <h1 className="text-white text-2xl font-playfair font-semibold">Programa de Referências</h1>
        <p className="text-white/40 text-sm mt-0.5">Crescimento orgânico através de indicações</p>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
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

        <div className="bg-rose-gold/10 border border-rose-gold/20 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Gift size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
            <div className="text-white/70 text-sm">
              <span className="text-white font-medium">Como funciona:</span> cada cliente recebe um código único após
              o primeiro agendamento. Pode partilhá-lo via link <code className="text-rose-gold">/agendar?ref=CODIGO</code>.
              Ao registar referências, fica visível aqui.
            </div>
          </div>
        </div>

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

        {loading ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <Gift size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              {grupos.length === 0
                ? 'Sem referências ainda. Os códigos começam a ser usados quando partilhares o link com clientes.'
                : 'Nenhum resultado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((g) => (
              <div key={g.refenteEmail} className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandido(expandido === g.refenteEmail ? null : g.refenteEmail)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold/30 to-golden/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-rose-gold font-semibold text-sm">{g.refenteNome.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{g.refenteNome}</p>
                    <p className="text-white/40 text-xs font-mono">{g.codigoReferencia}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-emerald-400 font-semibold text-sm">{g.totalConvertidas}/{g.totalEnviadas}</p>
                      <p className="text-white/30 text-xs">convertidas</p>
                    </div>
                    <ChevronRight size={14} className={`text-white/20 transition-transform ${expandido === g.refenteEmail ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {expandido === g.refenteEmail && (
                  <div className="border-t border-white/5 p-4 space-y-3">
                    <button onClick={() => copiarLink(g.codigoReferencia)}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2.5 rounded-xl text-sm transition-colors">
                      <Copy size={13} />
                      Copiar Link de Partilha
                    </button>
                    <p className="text-white/40 text-xs uppercase tracking-widest">Clientes Referidas</p>
                    {g.referencias.map((r) => {
                      const dataFmt = (() => {
                        try {
                          if (!r.criadoEm) return '—'
                          return format(new Date(r.criadoEm), "d MMM yyyy", { locale: ptBR })
                        } catch { return '—' }
                      })()
                      return (
                        <div key={r.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-white/70 text-sm truncate">{r.novoNome}</p>
                            <p className="text-white/30 text-xs truncate">{r.servicoNome} · {dataFmt}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                            r.estado === 'convertida' ? 'bg-emerald-400/10 text-emerald-400'
                            : r.estado === 'cancelada' ? 'bg-red-400/10 text-red-400'
                            : 'bg-amber-400/10 text-amber-400'
                          }`}>
                            {r.estado === 'convertida' ? 'Convertida' : r.estado === 'cancelada' ? 'Cancelada' : 'Pendente'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
