'use client'
import { useState, useEffect } from 'react'
import { Clock, Bell, X, RefreshCw, CheckCircle2, Link2, Mail } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore'

const BASE_URL = 'https://www.franciellycosta.pt'

const servicosDisponiveis = [
  { nome: 'Microblading', slug: 'microblading' },
  { nome: 'Micropigmentação Labial', slug: 'labial' },
  { nome: 'Microshading', slug: 'microshading' },
  { nome: 'Eyeliner Permanente', slug: 'eyeliner' },
  { nome: 'FiberBROWS', slug: 'fiberbrows' },
  { nome: 'Tricopigmentação', slug: 'tricopigmentacao' },
]

interface EntradaEspera {
  id: string
  clienteNome: string
  telefone: string
  email: string
  servico: string
  servicoSlug: string
  preferenciaDatas: string[]
  criadoEm?: string
  notificada: boolean
  notificadaEm?: string
  linkEnviado?: string
}

export default function ListaEsperaAdminPage() {
  const [lista, setLista] = useState<EntradaEspera[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarNotificar, setMostrarNotificar] = useState<string | null>(null)
  const [notificando, setNotificando] = useState(false)
  const [notifLink, setNotifLink] = useState<string | null>(null)
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false)
  const [filtroServico, setFiltroServico] = useState('todos')
  const [novaEntrada, setNovaEntrada] = useState({
    clienteNome: '', telefone: '', email: '', servico: '', preferencia: ''
  })
  const [adicionando, setAdicionando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    try {
      if (!db) { setLoading(false); return }
      const snap = await getDocs(query(collection(db, 'lista-espera'), orderBy('criadoEm', 'desc')))
      setLista(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EntradaEspera)))
    } catch (err) {
      console.error('[lista-espera] erro ao carregar:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const servicosUnicos = ['todos', ...Array.from(new Set(lista.map((l) => l.servico)))]
  const filtrados = filtroServico === 'todos'
    ? lista
    : lista.filter((l) => l.servico === filtroServico)

  const notificarCliente = async (id: string) => {
    const entrada = lista.find((l) => l.id === id)
    if (!entrada) return
    setNotificando(true)
    setNotifLink(null)
    try {
      const res = await fetch('/api/lista-espera/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitlistId: id,
          clienteEmail: entrada.email,
          clienteNome: entrada.clienteNome,
          servico: entrada.servico,
          servicoSlug: entrada.servicoSlug,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setLista((prev) => prev.map((l) => l.id === id ? { ...l, notificada: true, linkEnviado: json.link } : l))
        setNotifLink(json.link)
      } else {
        // If email fails but we have the link, still show it
        const slug = entrada.servicoSlug || 'microblading'
        const link = `${BASE_URL}/agendar?servico=${slug}&ref=lista-espera&id=${id}`
        setNotifLink(link)
        alert('Aviso: erro ao enviar email mas o link foi gerado.')
      }
    } catch {
      alert('Erro ao notificar. Tenta novamente.')
    } finally {
      setNotificando(false)
    }
  }

  const removerDaLista = async (id: string) => {
    if (!confirm('Remover esta cliente da lista de espera?')) return
    try {
      if (db) await deleteDoc(doc(db, 'lista-espera', id))
      setLista((prev) => prev.filter((l) => l.id !== id))
    } catch {
      alert('Erro ao remover.')
    }
  }

  const adicionarCliente = async () => {
    if (!novaEntrada.clienteNome || !novaEntrada.servico || !db) return
    setAdicionando(true)
    try {
      const svc = servicosDisponiveis.find((s) => s.nome === novaEntrada.servico)
      const nova: Omit<EntradaEspera, 'id'> = {
        clienteNome: novaEntrada.clienteNome,
        telefone: novaEntrada.telefone,
        email: novaEntrada.email,
        servico: novaEntrada.servico,
        servicoSlug: svc?.slug || novaEntrada.servico.toLowerCase(),
        preferenciaDatas: novaEntrada.preferencia ? [novaEntrada.preferencia] : ['Sem preferência'],
        notificada: false,
      }
      const ref = await addDoc(collection(db, 'lista-espera'), {
        ...nova,
        criadoEm: serverTimestamp(),
      })
      setLista((prev) => [{ id: ref.id, ...nova }, ...prev])
      setNovaEntrada({ clienteNome: '', telefone: '', email: '', servico: '', preferencia: '' })
      setMostrarAdicionar(false)
    } catch {
      alert('Erro ao adicionar.')
    } finally {
      setAdicionando(false)
    }
  }

  const formatData = (iso?: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return iso }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Lista de Espera</h1>
          <p className="text-white/40 text-sm mt-0.5">{lista.length} cliente(s) aguardam disponibilidade</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={carregar} className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setMostrarAdicionar(true)}
            className="bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-rose-gold-dark transition-colors"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-rose-gold">{lista.length}</p>
            <p className="text-white/40 text-xs mt-1">Em Espera</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{lista.filter((l) => !l.notificada).length}</p>
            <p className="text-white/40 text-xs mt-1">Por Notificar</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{lista.filter((l) => l.notificada).length}</p>
            <p className="text-white/40 text-xs mt-1">Notificadas</p>
          </div>
        </div>

        <div className="bg-rose-gold/10 border border-rose-gold/20 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Bell size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
            <p className="text-white/70 text-sm">
              <span className="text-white font-medium">Fluxo:</span> Quando surgir vaga, clique em "Notificar" — o cliente recebe um email com link para agendar e pagar a caução de 30€. Sem pagamento antecipado para entrar na lista.
            </p>
          </div>
        </div>

        {/* Filtro por serviço */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {servicosUnicos.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroServico(s)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                filtroServico === s
                  ? 'bg-rose-gold text-white'
                  : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              {s === 'todos' ? 'Todos' : s}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((entrada, idx) => (
              <div key={entrada.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-white/60 text-sm font-bold">#{idx + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{entrada.clienteNome}</p>
                      {entrada.notificada ? (
                        <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} /> Notificada
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">Aguarda</span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">{entrada.servico}</p>
                    {entrada.preferenciaDatas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entrada.preferenciaDatas.map((p, i) => (
                          <span key={i} className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded-md">{p}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-white/30 text-xs flex-wrap">
                      {entrada.telefone && <span>{entrada.telefone}</span>}
                      {entrada.email && <span className="truncate">{entrada.email}</span>}
                      {entrada.criadoEm && <span>· desde {formatData(entrada.criadoEm)}</span>}
                    </div>
                    {entrada.linkEnviado && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/30">
                        <Link2 size={10} />
                        <span className="truncate">{entrada.linkEnviado}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {!entrada.notificada && (
                      <button
                        onClick={() => { setMostrarNotificar(entrada.id); setNotifLink(null) }}
                        className="text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Notificar
                      </button>
                    )}
                    {entrada.notificada && (
                      <button
                        onClick={() => { setMostrarNotificar(entrada.id); setNotifLink(entrada.linkEnviado || null) }}
                        className="text-xs bg-white/5 text-white/40 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver link
                      </button>
                    )}
                    <button
                      onClick={() => removerDaLista(entrada.id)}
                      className="text-xs bg-white/5 text-white/40 hover:bg-red-400/10 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtrados.length === 0 && !loading && (
              <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
                <Clock size={28} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Nenhuma cliente na lista de espera</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal notificar */}
      {mostrarNotificar && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Notificar Cliente</h3>
              <button onClick={() => { setMostrarNotificar(null); setNotifLink(null) }} className="text-white/40">
                <X size={20} />
              </button>
            </div>
            {(() => {
              const e = lista.find((l) => l.id === mostrarNotificar)
              return e ? (
                <>
                  <p className="text-white/60 text-sm mb-4">
                    Enviar email para <span className="text-white">{e.clienteNome}</span> ({e.email}) com link para agendar <span className="text-rose-gold">{e.servico}</span>.
                  </p>

                  {notifLink ? (
                    <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4 mb-4">
                      <p className="text-emerald-400 text-xs font-semibold mb-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Email enviado! Link gerado:
                      </p>
                      <p className="text-white/70 text-xs break-all">{notifLink}</p>
                      <button
                        onClick={() => navigator.clipboard?.writeText(notifLink)}
                        className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Copiar link
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#111] rounded-xl p-4 mb-4">
                      <p className="text-white/40 text-xs mb-1">Mensagem automática que será enviada:</p>
                      <p className="text-white/70 text-sm italic leading-relaxed">
                        "Boa notícia! Surgiu uma vaga para {e.servico}. Confirme a sua marcação aqui: {BASE_URL}/agendar?servico={e.servicoSlug}&ref=lista-espera&id={e.id}"
                      </p>
                    </div>
                  )}

                  {!notifLink && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => notificarCliente(e.id)}
                        disabled={notificando}
                        className="flex-1 bg-rose-gold text-white py-3 rounded-xl font-medium hover:bg-rose-gold-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {notificando ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> A enviar...</>
                        ) : (
                          <><Mail size={15} /> Enviar Notificação</>
                        )}
                      </button>
                      <button
                        onClick={() => { setMostrarNotificar(null); setNotifLink(null) }}
                        className="px-4 bg-white/5 text-white/60 rounded-xl"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {notifLink && (
                    <button
                      onClick={() => { setMostrarNotificar(null); setNotifLink(null) }}
                      className="w-full bg-white/10 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      Fechar
                    </button>
                  )}
                </>
              ) : null
            })()}
          </div>
        </div>
      )}

      {/* Modal adicionar */}
      {mostrarAdicionar && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50 overflow-y-auto">
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-6 mt-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Adicionar à Lista de Espera</h3>
              <button onClick={() => setMostrarAdicionar(false)} className="text-white/40">
                <X size={20} />
              </button>
            </div>
            <p className="text-white/40 text-xs mb-4">Sem pagamento antecipado — o cliente só paga a caução quando surgir vaga e clicar no link.</p>
            <div className="space-y-3">
              <input
                type="text" placeholder="Nome da cliente*"
                value={novaEntrada.clienteNome}
                onChange={(e) => setNovaEntrada((p) => ({ ...p, clienteNome: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <input
                type="tel" placeholder="Telefone"
                value={novaEntrada.telefone}
                onChange={(e) => setNovaEntrada((p) => ({ ...p, telefone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <input
                type="email" placeholder="Email*"
                value={novaEntrada.email}
                onChange={(e) => setNovaEntrada((p) => ({ ...p, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <select
                value={novaEntrada.servico}
                onChange={(e) => setNovaEntrada((p) => ({ ...p, servico: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-gold/50"
              >
                <option value="">Selecionar serviço*</option>
                {servicosDisponiveis.map((s) => (
                  <option key={s.slug} value={s.nome} className="bg-[#1A1A1A]">{s.nome}</option>
                ))}
              </select>
              <input
                type="text" placeholder="Preferência de horário (ex: manhãs, fins de semana)"
                value={novaEntrada.preferencia}
                onChange={(e) => setNovaEntrada((p) => ({ ...p, preferencia: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <button
                onClick={adicionarCliente}
                disabled={!novaEntrada.clienteNome || !novaEntrada.servico || adicionando}
                className="w-full bg-rose-gold text-white py-3 rounded-xl font-medium hover:bg-rose-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {adicionando ? 'A adicionar...' : 'Adicionar à Lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
