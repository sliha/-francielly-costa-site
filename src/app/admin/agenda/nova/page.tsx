'use client'
import { useState } from 'react'
import { ChevronLeft, CheckCircle2, User, Phone, Mail, Scissors, Calendar, Clock, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getAccessToken } from '@/lib/supabase/client'

const servicos = [
  { value: 'fiberbrows', label: 'FiberBROWS', valor: 1000, duracao: 'A definir', minutos: 120 },
  { value: 'microblading', label: 'Microblading', valor: 180, duracao: '2h', minutos: 120 },
  { value: 'microshading', label: 'Microshading', valor: 180, duracao: '2h', minutos: 120 },
  { value: 'eyeliner', label: 'Eyeliner Permanente', valor: 120, duracao: '1h30', minutos: 90 },
  { value: 'labial', label: 'Micropigmentação Labial', valor: 150, duracao: '1h30', minutos: 90 },
  { value: 'tricopigmentacao', label: 'Tricopigmentação', valor: 200, duracao: '2h', minutos: 120 },
]

// Time slots from 10:00 to 18:00 in 30-minute intervals
const timeSlots: string[] = []
for (let h = 10; h <= 18; h++) {
  for (const m of ['00', '30']) {
    if (h === 18 && m === '30') break
    timeSlots.push(`${String(h).padStart(2, '0')}:${m}`)
  }
}

// Get today's date in YYYY-MM-DD format for min constraint
const todayStr = new Date().toISOString().split('T')[0]

interface FormData {
  clienteNome: string
  telefone: string
  email: string
  servico: string
  data: string
  hora: string
  notas: string
}

export default function NovaMarcacaoPage() {
  const [form, setForm] = useState<FormData>({
    clienteNome: '',
    telefone: '',
    email: '',
    servico: '',
    data: '',
    hora: '',
    notas: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const selectedServico = servicos.find((s) => s.value === form.servico)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clienteNome || !form.telefone || !form.servico || !form.data || !form.hora) {
      setError('Por favor preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)
    setError('')
    setWarning('')

    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Sessão expirou. Por favor faz login novamente.')
        return
      }
      const res = await fetch('/api/agendamento/criar-manual', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteNome: form.clienteNome,
          clienteTelefone: form.telefone,
          clienteEmail: form.email,
          servicoId: form.servico,
          servicoNome: selectedServico?.label ?? form.servico,
          data: form.data,
          horaInicio: form.hora,
          duracaoMinutos: selectedServico?.minutos ?? 90,
          notas: form.notas,
          estado: 'confirmado',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao guardar a marcação. Por favor tente novamente.')
        return
      }
      if (data.warning) setWarning(data.warning)
      setSuccess(true)
    } catch {
      setError('Erro ao guardar a marcação. Por favor tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-white font-playfair text-xl font-semibold mb-2">
            Marcação Criada!
          </h2>
          <p className="text-white/50 text-sm mb-1">
            {form.clienteNome}
          </p>
          <p className="text-white/40 text-sm mb-6">
            {selectedServico?.label} — {form.data} às {form.hora}
          </p>
          {warning && (
            <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs rounded-xl px-3 py-2 mb-4 text-left">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false)
                setWarning('')
                setForm({ clienteNome: '', telefone: '', email: '', servico: '', data: '', hora: '', notas: '' })
              }}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-xl transition-colors"
            >
              Nova Marcação
            </button>
            <Link
              href="/admin/agenda"
              className="px-5 py-2.5 bg-rose-gold text-white text-sm rounded-xl hover:bg-opacity-90 transition-colors font-medium"
            >
              Ver Agenda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center gap-3">
        <Link
          href="/admin/agenda"
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ChevronLeft size={18} className="text-white/60" />
        </Link>
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">
            Nova Marcação
          </h1>
          <p className="text-white/40 text-xs mt-0.5">Agendar manualmente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 md:px-8 pb-8 space-y-4">
        {/* Client info section */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <User size={12} />
            Dados do Cliente
          </h2>

          <Field
            label="Nome completo *"
            icon={<User size={14} className="text-white/30" />}
          >
            <input
              type="text"
              name="clienteNome"
              value={form.clienteNome}
              onChange={handleChange}
              placeholder="Ex: Ana Silva"
              required
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </Field>

          <Field
            label="Telemóvel *"
            icon={<Phone size={14} className="text-white/30" />}
          >
            <input
              type="tel"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="9XX XXX XXX"
              required
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </Field>

          <Field
            label="Email"
            icon={<Mail size={14} className="text-white/30" />}
          >
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="cliente@email.com"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </Field>
        </div>

        {/* Service & Scheduling section */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 space-y-4">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Scissors size={12} />
            Serviço & Horário
          </h2>

          {/* Service dropdown */}
          <div>
            <label className="text-white/40 text-xs mb-1.5 block">Serviço *</label>
            <div className="relative bg-white/5 border border-white/10 rounded-xl px-3 py-3 focus-within:border-rose-gold/50 transition-colors">
              <Scissors size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <select
                name="servico"
                value={form.servico}
                onChange={handleChange}
                required
                className="w-full bg-transparent text-white text-sm focus:outline-none pl-5 appearance-none"
              >
                <option value="" disabled className="bg-[#1A1A1A] text-white/50">
                  Selecione um serviço
                </option>
                {servicos.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#1A1A1A] text-white">
                    {s.label} — €{s.valor} ({s.duracao})
                  </option>
                ))}
              </select>
            </div>
            {selectedServico && (
              <p className="text-golden text-xs mt-1.5 pl-1">
                Duração estimada: {selectedServico.duracao} · Valor: €{selectedServico.valor}
              </p>
            )}
          </div>

          <Field
            label="Data *"
            icon={<Calendar size={14} className="text-white/30" />}
          >
            <input
              type="date"
              name="data"
              value={form.data}
              onChange={handleChange}
              min={todayStr}
              required
              className="w-full bg-transparent text-white text-sm focus:outline-none [color-scheme:dark]"
            />
          </Field>

          {/* Time slot grid */}
          <div>
            <label className="text-white/40 text-xs mb-2 block flex items-center gap-1">
              <Clock size={12} />
              Hora *
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, hora: slot }))}
                  className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                    form.hora === slot
                      ? 'bg-rose-gold text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes section */}
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
          <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-4">
            <FileText size={12} />
            Notas
          </h2>
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            placeholder="Observações, alergias, preferências do cliente..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-gold to-golden text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'A guardar...' : 'Confirmar Marcação'}
        </button>
      </form>
    </div>
  )
}

// Reusable field wrapper
function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-white/40 text-xs mb-1.5 block">{label}</label>
      <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-3 focus-within:border-rose-gold/50 transition-colors gap-2.5">
        <span className="flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  )
}
