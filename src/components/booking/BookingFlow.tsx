'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CreditCard, Check } from 'lucide-react'
import { SERVICES } from '@/data/services'
import { format, addDays, isWeekend, startOfToday } from 'date-fns'
import { pt } from 'date-fns/locale'

type Step = 'servico' | 'data' | 'hora' | 'dados' | 'pagamento'

interface SlotInfo {
  hora: string
  disponivel: boolean
}

interface Props {
  servicoPreSelecionado?: string
  onClose?: () => void
}

function calcularHoraFim(horaInicio: string, duracaoMinutos: number): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const totalMin = h * 60 + m + duracaoMinutos
  return `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`
}

const STEP_CONFIG = [
  { key: 'servico' as Step, emoji: '✨', label: 'Serviço' },
  { key: 'data' as Step, emoji: '📅', label: 'Data' },
  { key: 'hora' as Step, emoji: '🕐', label: 'Hora' },
  { key: 'dados' as Step, emoji: '👤', label: 'Dados' },
  { key: 'pagamento' as Step, emoji: '💳', label: 'Caução' },
]

export default function BookingFlow({ servicoPreSelecionado, onClose }: Props) {
  const [step, setStep] = useState<Step>(servicoPreSelecionado ? 'data' : 'servico')
  const [servicoId, setServicoId] = useState(servicoPreSelecionado || '')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [slots, setSlots] = useState<SlotInfo[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsMotivo, setSlotsMotivo] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')
  const [codigoReferencia, setCodigoReferencia] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) setCodigoReferencia(ref.toUpperCase())
  }, [])
  const [agendamentoId, setAgendamentoId] = useState('')
  const [erro, setErro] = useState('')

  const servico = SERVICES.find((s) => s.id === servicoId)

  const fetchSlots = async (dateStr: string) => {
    setLoadingSlots(true)
    setSlots([])
    setSlotsMotivo('')
    try {
      const duracao = servico?.duracaoMinutos || 60
      const res = await fetch(`/api/slots?data=${dateStr}&duracao=${duracao}`)
      const json = await res.json()
      setSlots(json.slots || [])
      if (json.motivo) setSlotsMotivo(json.motivo)
    } catch {
      setSlotsMotivo('Erro ao carregar horários. Por favor, tente novamente.')
    }
    setLoadingSlots(false)
  }

  const handleDataSelect = (dateStr: string) => {
    setData(dateStr)
    setHora('')
    fetchSlots(dateStr)
    setStep('hora')
  }

  const handleConfirmar = async () => {
    setErro('')
    setLoading(true)
    try {
      const horaFim = calcularHoraFim(hora, servico?.duracaoMinutos || 60)
      const res = await fetch('/api/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: nome,
          clienteTelefone: telefone,
          clienteEmail: email,
          servicoId,
          servicoNome: servico?.name || '',
          data,
          horaInicio: hora,
          horaFim,
          notas,
          codigoReferencia: codigoReferencia.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.referenciaErro) {
        // Não bloqueia — apenas avisa
        console.warn('Aviso referência:', json.referenciaErro)
      }
      if (json.agendamentoId) {
        setAgendamentoId(json.agendamentoId)
        setStep('pagamento')
      } else {
        setErro(json.error || 'Erro ao criar marcação. Por favor, tente novamente.')
      }
    } catch {
      setErro('Erro de ligação. Verifique a sua internet e tente novamente.')
    }
    setLoading(false)
  }

  const handlePagamento = async () => {
    setErro('')
    setLoading(true)
    try {
      const res = await fetch('/api/pagamento/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId,
          servicoNome: servico?.name,
          clienteEmail: email,
          caucaoValor: 30,
        }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setErro(json.error || 'Erro ao iniciar pagamento. Por favor, tente novamente.')
        setLoading(false)
      }
    } catch {
      setErro('Erro de ligação. Verifique a sua internet e tente novamente.')
      setLoading(false)
    }
  }

  // Generate next 30 available weekday dates
  const getAvailableDates = () => {
    const dates: Date[] = []
    let d = addDays(startOfToday(), 1)
    while (dates.length < 30) {
      if (!isWeekend(d)) dates.push(new Date(d))
      d = addDays(d, 1)
    }
    return dates
  }

  const stepIndex = STEP_CONFIG.findIndex((s) => s.key === step)

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-8">
        {STEP_CONFIG.map(({ key, emoji, label }, i) => (
          <div key={key} className="flex items-center gap-1 flex-1">
            <div
              className={`flex flex-col items-center gap-1 flex-1 transition-opacity duration-300 ${
                STEP_CONFIG.findIndex((s) => s.key === step) >= i ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-xs text-center hidden sm:block text-gray-500">{label}</span>
            </div>
            {i < STEP_CONFIG.length - 1 && (
              <div
                className={`h-px flex-1 transition-colors duration-300 ${
                  i < stepIndex ? 'bg-rose-gold' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {erro}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Step: Serviço ── */}
        {step === 'servico' && (
          <motion.div
            key="servico"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <h2 className="font-playfair text-2xl font-semibold text-gray-800 mb-6">
              Qual serviço deseja?
            </h2>
            <div className="space-y-3">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServicoId(s.id)
                    setStep('data')
                  }}
                  className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 hover:border-rose-gold bg-white transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-rose-gold transition-colors">
                        {s.name}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {s.duration} &middot; {s.sessions} sessões
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-gray-300 group-hover:text-rose-gold mt-1 transition-colors flex-shrink-0"
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step: Data ── */}
        {step === 'data' && (
          <motion.div
            key="data"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <button
              onClick={() => setStep('servico')}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 mb-4 text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-playfair text-2xl font-semibold text-gray-800 mb-1">
              Escolha a data
            </h2>
            <p className="text-gray-500 text-sm mb-6">Segunda a Sexta, 10h às 18h</p>
            {servico && (
              <div className="mb-4 px-3 py-2 bg-rose-50 rounded-xl text-sm text-rose-gold font-medium">
                {servico.name} &middot; {servico.duration}
              </div>
            )}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {getAvailableDates().map((d) => {
                const str = format(d, 'yyyy-MM-dd')
                return (
                  <button
                    key={str}
                    onClick={() => handleDataSelect(str)}
                    className="flex flex-col items-center p-2 rounded-xl border-2 border-gray-100 hover:border-rose-gold bg-white transition-all group"
                  >
                    <span className="text-xs text-gray-400 group-hover:text-rose-gold capitalize transition-colors">
                      {format(d, 'EEE', { locale: pt })}
                    </span>
                    <span className="font-semibold text-gray-700 group-hover:text-rose-gold text-sm transition-colors">
                      {format(d, 'd')}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {format(d, 'MMM', { locale: pt })}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step: Hora ── */}
        {step === 'hora' && (
          <motion.div
            key="hora"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <button
              onClick={() => setStep('data')}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 mb-4 text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-playfair text-2xl font-semibold text-gray-800 mb-1">
              Escolha a hora
            </h2>
            <p className="text-gray-500 text-sm mb-6 capitalize">
              {data
                ? new Date(data + 'T12:00:00').toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : ''}
            </p>

            {loadingSlots ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 mb-4">
                  {slotsMotivo || 'Sem disponibilidade nesta data.'}
                </p>
                <button
                  onClick={() => setStep('data')}
                  className="text-rose-gold text-sm underline hover:no-underline"
                >
                  Escolher outro dia
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.hora}
                    disabled={!s.disponivel}
                    onClick={() => {
                      setHora(s.hora)
                      setStep('dados')
                    }}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      s.disponivel
                        ? hora === s.hora
                          ? 'bg-rose-gold text-white shadow-rose'
                          : 'bg-white border-2 border-gray-100 hover:border-rose-gold text-gray-700'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                    }`}
                  >
                    {s.hora}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Step: Dados ── */}
        {step === 'dados' && (
          <motion.div
            key="dados"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
          >
            <button
              onClick={() => setStep('hora')}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 mb-4 text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            <h2 className="font-playfair text-2xl font-semibold text-gray-800 mb-2">
              Os seus dados
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {servico?.name} &middot;{' '}
              {data &&
                new Date(data + 'T12:00:00').toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'long',
                })}{' '}
              &middot; {hora}h
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome completo *"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-gold text-gray-800 placeholder:text-gray-400 transition-colors"
              />
              <input
                type="tel"
                placeholder="Telemóvel *"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-gold text-gray-800 placeholder:text-gray-400 transition-colors"
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-gold text-gray-800 placeholder:text-gray-400 transition-colors"
              />
              <textarea
                placeholder="Notas ou observações (opcional)"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-gold text-gray-800 placeholder:text-gray-400 transition-colors resize-none"
              />
              <input
                type="text"
                placeholder="Código de referência (opcional)"
                value={codigoReferencia}
                onChange={(e) => setCodigoReferencia(e.target.value.toUpperCase())}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-gold text-gray-800 placeholder:text-gray-400 transition-colors uppercase font-mono"
              />
              <button
                onClick={handleConfirmar}
                disabled={!nome || !telefone || !email || loading}
                className="w-full bg-gradient-to-r from-rose-gold to-golden text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'A processar...' : 'Confirmar Marcação →'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step: Pagamento ── */}
        {step === 'pagamento' && (
          <motion.div
            key="pagamento"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h2 className="font-playfair text-2xl font-semibold text-gray-800 mb-2">
              Marcação Recebida!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Para confirmar a sua reserva, pedimos uma caução de{' '}
              <strong className="text-rose-gold">€30</strong> (descontada no procedimento).
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-1">
              <p className="text-sm text-gray-600">
                <strong>Serviço:</strong> {servico?.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Data:</strong>{' '}
                {data &&
                  new Date(data + 'T12:00:00').toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Hora:</strong> {hora}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Nome:</strong> {nome}
              </p>
            </div>

            <button
              onClick={handlePagamento}
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-gold to-golden text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
            >
              <CreditCard size={18} />
              {loading ? 'A redirecionar...' : 'Pagar Caução €30 →'}
            </button>

            <p className="text-xs text-gray-400 mb-4">
              Pagamento seguro via Stripe &middot; Cartão de crédito/débito
            </p>

            <a
              href="https://wa.link/kwctpf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-rose-gold transition-colors underline"
            >
              Prefere pagar via WhatsApp?
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
