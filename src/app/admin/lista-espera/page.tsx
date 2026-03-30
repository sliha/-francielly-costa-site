'use client'
import { useState } from 'react'
import { Clock, User, Bell, CheckCircle2, X, ChevronDown, Calendar, Search } from 'lucide-react'

const mockListaEspera = [
  {
    id: 'le_1',
    clienteNome: 'Patrícia Vieira',
    telefone: '916 234 567',
    email: 'patricia@email.com',
    servico: 'Microblading',
    preferenciaDatas: ['Semanas de trabalho', 'Manhã (9h-12h)'],
    dataEntrada: '28 Mar 2026',
    posicao: 1,
    notificada: false,
  },
  {
    id: 'le_2',
    clienteNome: 'Catarina Alves',
    telefone: '934 876 543',
    email: 'catarina@email.com',
    servico: 'Micropigmentação Labial',
    preferenciaDatas: ['Fins de semana', 'Qualquer hora'],
    dataEntrada: '27 Mar 2026',
    posicao: 2,
    notificada: false,
  },
  {
    id: 'le_3',
    clienteNome: 'Rita Ferreira',
    telefone: '961 543 210',
    email: 'rita@email.com',
    servico: 'Microblading',
    preferenciaDatas: ['Qualquer dia', 'Tarde (14h-18h)'],
    dataEntrada: '25 Mar 2026',
    posicao: 3,
    notificada: true,
  },
]

const servicosDisponiveis = ['Microblading', 'Micropigmentação Labial', 'Microshading', 'Eyeliner Permanente']

export default function ListaEsperaAdminPage() {
  const [lista, setLista] = useState(mockListaEspera)
  const [mostrarNotificar, setMostrarNotificar] = useState<string | null>(null)
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false)
  const [filtroServico, setFiltroServico] = useState('todos')
  const [novaEntrada, setNovaEntrada] = useState({
    clienteNome: '', telefone: '', email: '', servico: '', preferencia: ''
  })

  const filtrados = filtroServico === 'todos'
    ? lista
    : lista.filter(l => l.servico === filtroServico)

  const notificarCliente = (id: string) => {
    setLista(prev => prev.map(l => l.id === id ? { ...l, notificada: true } : l))
    setMostrarNotificar(null)
  }

  const removerDaLista = (id: string) => {
    setLista(prev => prev.filter(l => l.id !== id))
  }

  const adicionarCliente = () => {
    if (!novaEntrada.clienteNome || !novaEntrada.servico) return
    const novo = {
      id: `le_${Date.now()}`,
      clienteNome: novaEntrada.clienteNome,
      telefone: novaEntrada.telefone,
      email: novaEntrada.email,
      servico: novaEntrada.servico,
      preferenciaDatas: novaEntrada.preferencia ? [novaEntrada.preferencia] : ['Sem preferência'],
      dataEntrada: new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }),
      posicao: lista.length + 1,
      notificada: false,
    }
    setLista(prev => [...prev, novo])
    setNovaEntrada({ clienteNome: '', telefone: '', email: '', servico: '', preferencia: '' })
    setMostrarAdicionar(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Lista de Espera</h1>
          <p className="text-white/40 text-sm mt-0.5">{lista.length} cliente(s) aguardam disponibilidade</p>
        </div>
        <button
          onClick={() => setMostrarAdicionar(true)}
          className="bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-rose-gold-dark transition-colors"
        >
          + Adicionar
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-rose-gold">{lista.length}</p>
            <p className="text-white/40 text-xs mt-1">Em Espera</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{lista.filter(l => !l.notificada).length}</p>
            <p className="text-white/40 text-xs mt-1">Por Notificar</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{lista.filter(l => l.notificada).length}</p>
            <p className="text-white/40 text-xs mt-1">Notificadas</p>
          </div>
        </div>

        {/* Alerta: liberte uma vaga para notificar */}
        <div className="bg-rose-gold/10 border border-rose-gold/20 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-rose-gold" />
            <p className="text-white/70 text-sm">
              <span className="text-white font-medium">Dica:</span> Quando cancelar uma marcação, o sistema identifica automaticamente quem notificar da lista de espera.
            </p>
          </div>
        </div>

        {/* Filtro por serviço */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['todos', ...servicosDisponiveis].map(s => (
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
        <div className="space-y-3">
          {filtrados.map((entrada, idx) => (
            <div key={entrada.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-4">
              <div className="flex items-start gap-3">
                {/* Posição */}
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-white/60 text-sm font-bold">#{entrada.posicao}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{entrada.clienteNome}</p>
                    {entrada.notificada ? (
                      <span className="text-xs bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full">Notificada</span>
                    ) : (
                      <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">Aguarda</span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{entrada.servico}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entrada.preferenciaDatas.map((p, i) => (
                      <span key={i} className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded-md">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-white/30 text-xs">
                    <span>{entrada.telefone}</span>
                    <span>·</span>
                    <span>Na lista desde {entrada.dataEntrada}</span>
                  </div>
                </div>

                {/* Acções */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {!entrada.notificada && (
                    <button
                      onClick={() => setMostrarNotificar(entrada.id)}
                      className="text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Notificar
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

          {filtrados.length === 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
              <Clock size={28} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Nenhuma cliente na lista de espera</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal notificar */}
      {mostrarNotificar && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="w-full bg-[#1A1A1A] rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Notificar Cliente</h3>
              <button onClick={() => setMostrarNotificar(null)} className="text-white/40">
                <X size={20} />
              </button>
            </div>
            {(() => {
              const e = lista.find(l => l.id === mostrarNotificar)
              return e ? (
                <>
                  <p className="text-white/60 text-sm mb-4">
                    Enviar SMS/email para <span className="text-white">{e.clienteNome}</span> a informar que surgiu uma vaga para <span className="text-rose-gold">{e.servico}</span>.
                  </p>
                  <div className="bg-[#111] rounded-xl p-4 mb-4">
                    <p className="text-white/40 text-xs mb-1">Mensagem automática:</p>
                    <p className="text-white/70 text-sm italic">
                      "Boa notícia! Surgiu uma vaga para {e.servico}. Clique no link para confirmar a sua marcação: [link]"
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => notificarCliente(e.id)}
                      className="flex-1 bg-rose-gold text-white py-3 rounded-xl font-medium hover:bg-rose-gold-dark transition-colors"
                    >
                      Enviar Notificação
                    </button>
                    <button
                      onClick={() => setMostrarNotificar(null)}
                      className="px-4 bg-white/5 text-white/60 rounded-xl"
                    >
                      Cancelar
                    </button>
                  </div>
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
            <div className="space-y-3">
              <input
                type="text" placeholder="Nome da cliente*"
                value={novaEntrada.clienteNome}
                onChange={(e) => setNovaEntrada(p => ({ ...p, clienteNome: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <input
                type="tel" placeholder="Telefone"
                value={novaEntrada.telefone}
                onChange={(e) => setNovaEntrada(p => ({ ...p, telefone: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <input
                type="email" placeholder="Email"
                value={novaEntrada.email}
                onChange={(e) => setNovaEntrada(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <select
                value={novaEntrada.servico}
                onChange={(e) => setNovaEntrada(p => ({ ...p, servico: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-gold/50"
              >
                <option value="">Selecionar serviço*</option>
                {servicosDisponiveis.map(s => (
                  <option key={s} value={s} className="bg-[#1A1A1A]">{s}</option>
                ))}
              </select>
              <input
                type="text" placeholder="Preferência de horário (ex: manhãs, fins de semana)"
                value={novaEntrada.preferencia}
                onChange={(e) => setNovaEntrada(p => ({ ...p, preferencia: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50"
              />
              <button
                onClick={adicionarCliente}
                disabled={!novaEntrada.clienteNome || !novaEntrada.servico}
                className="w-full bg-rose-gold text-white py-3 rounded-xl font-medium hover:bg-rose-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar à Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
