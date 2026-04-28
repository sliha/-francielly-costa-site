'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Video,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react'
import { services } from '@/data/services'

const horasDisponiveis = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30']

const todayStr = new Date().toISOString().split('T')[0]

export default function ConsultaVirtualPage() {
  const [etapa, setEtapa] = useState<'info' | 'agendar' | 'confirmado'>('info')
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    servico: '',
    data: '',
    hora: '',
    duvida: '',
  })
  const [meetLink, setMeetLink] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const formValido = form.nome && form.telefone && form.email && form.servico && form.data && form.hora

  const agendar = async () => {
    setEnviando(true)
    setErro(null)
    try {
      const res = await fetch('/api/consulta-virtual/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao agendar.')
        return
      }
      setMeetLink(data.meetLink || '')
      setEtapa('confirmado')
    } catch {
      setErro('Erro de rede. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (etapa === 'confirmado') {
    return (
      <div className="min-h-screen bg-cream pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h1 className="font-playfair font-bold text-3xl text-text-primary mb-3">
            Consulta Agendada!
          </h1>
          <p className="text-text-secondary font-inter mb-8">
            A Francielly irá confirmar a sua consulta virtual em breve por SMS/email.
          </p>

          <div className="bg-white rounded-2xl shadow-card border border-cream-dark p-6 text-left space-y-4 mb-6">
            <div>
              <p className="text-text-muted text-xs font-inter uppercase tracking-widest mb-1">Serviço</p>
              <p className="text-text-primary font-semibold font-inter">{form.servico}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-xs font-inter uppercase tracking-widest mb-1">Data</p>
                <p className="text-text-primary font-semibold font-inter">{new Date(form.data).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs font-inter uppercase tracking-widest mb-1">Hora</p>
                <p className="text-text-primary font-semibold font-inter">{form.hora}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-cream-dark">
              <p className="text-text-muted text-xs font-inter uppercase tracking-widest mb-2">Link da Videochamada</p>
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium hover:bg-emerald-100 transition-colors break-all"
              >
                <Video size={16} className="flex-shrink-0" />
                {meetLink}
              </a>
              <p className="text-text-muted text-xs mt-2">O link será também enviado para {form.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center"
            >
              <Video size={16} />
              Entrar na Videochamada
            </a>
            <Link href="/" className="text-text-secondary font-inter text-sm hover:text-rose-gold transition-colors">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-gold/10 to-golden/5 py-12 mb-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center mx-auto mb-4">
            <Video size={28} className="text-white" />
          </div>
          <h1 className="font-playfair font-bold text-4xl text-text-primary mb-4">
            Consulta Virtual Gratuita
          </h1>
          <p className="text-text-secondary font-inter text-lg max-w-xl mx-auto">
            A Francielly avalia o seu caso ao vivo por videochamada antes de se deslocar ao consultório. Ideal para clientes de fora de Braga.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        {etapa === 'info' && (
          <div className="space-y-6">
            {/* Como funciona */}
            <div className="bg-white rounded-2xl shadow-card border border-cream-dark p-6">
              <h2 className="font-playfair font-bold text-xl text-text-primary mb-5">Como Funciona</h2>
              <div className="space-y-4">
                {[
                  { num: '1', titulo: 'Escolha data e hora', desc: 'Selecione um slot de 15 minutos disponível na agenda virtual.' },
                  { num: '2', titulo: 'Receba o link', desc: 'Após confirmação, recebe um link único de Google Meet por SMS e email.' },
                  { num: '3', titulo: 'Videochamada com a Francielly', desc: 'Mostre a zona a tratar. A Francielly avalia e dá a sua recomendação personalizada.' },
                  { num: '4', titulo: 'Agende com confiança', desc: 'Após a consulta, agende o seu procedimento sabendo exatamente o que esperar.' },
                ].map(p => (
                  <div key={p.num} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-rose-gold flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{p.num}</span>
                    </div>
                    <div>
                      <p className="text-text-primary font-semibold font-inter text-sm">{p.titulo}</p>
                      <p className="text-text-secondary font-inter text-sm mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Clock, label: 'Duração', value: '15 minutos' },
                { icon: Video, label: 'Plataforma', value: 'Google Meet' },
                { icon: Calendar, label: 'Custo', value: 'Gratuito' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl shadow-card border border-cream-dark p-5 text-center">
                  <Icon size={22} className="text-rose-gold mx-auto mb-2" />
                  <p className="text-text-muted text-xs font-inter uppercase tracking-widest">{label}</p>
                  <p className="text-text-primary font-semibold font-inter mt-1">{value}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEtapa('agendar')}
              className="btn-primary w-full justify-center"
            >
              Agendar Consulta Virtual
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {etapa === 'agendar' && (
          <div className="space-y-4">
            <button
              onClick={() => setEtapa('info')}
              className="flex items-center gap-2 text-text-secondary hover:text-rose-gold transition-colors text-sm font-inter"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <div className="bg-white rounded-2xl shadow-card border border-cream-dark p-6 space-y-4">
              <h2 className="font-playfair font-bold text-xl text-text-primary">Dados da Consulta</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                    <User size={14} className="inline mr-1" />Nome completo *
                  </label>
                  <input
                    type="text" name="nome" value={form.nome} onChange={handleChange}
                    placeholder="O seu nome"
                    className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm text-text-primary font-inter focus:outline-none focus:border-rose-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                    <Phone size={14} className="inline mr-1" />Telefone *
                  </label>
                  <input
                    type="tel" name="telefone" value={form.telefone} onChange={handleChange}
                    placeholder="+351 900 000 000"
                    className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm text-text-primary font-inter focus:outline-none focus:border-rose-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                    <Mail size={14} className="inline mr-1" />Email *
                  </label>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="o-seu@email.com"
                    className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm text-text-primary font-inter focus:outline-none focus:border-rose-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                    Serviço de interesse *
                  </label>
                  <select
                    name="servico" value={form.servico} onChange={handleChange}
                    className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm text-text-primary font-inter focus:outline-none focus:border-rose-gold transition-colors bg-white"
                  >
                    <option value="">Selecionar...</option>
                    {services.map(s => (
                      <option key={s.slug} value={s.name}>{s.name}</option>
                    ))}
                    <option value="Não sei ainda">Não sei ainda / Quero aconselhar-me</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                    <Calendar size={14} className="inline mr-1" />Data *
                  </label>
                  <input
                    type="date" name="data" value={form.data} onChange={handleChange}
                    min={todayStr}
                    className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm text-text-primary font-inter focus:outline-none focus:border-rose-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                    <Clock size={14} className="inline mr-1" />Hora *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                    {horasDisponiveis.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, hora: h }))}
                        className={`text-xs py-2 rounded-lg border transition-colors font-inter ${
                          form.hora === h
                            ? 'bg-rose-gold text-white border-rose-gold'
                            : 'bg-white text-text-secondary border-cream-dark hover:border-rose-gold'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary font-inter mb-1">
                  <MessageSquare size={14} className="inline mr-1" />Dúvida ou informação adicional
                </label>
                <textarea
                  name="duvida" value={form.duvida} onChange={handleChange}
                  placeholder="Descreva brevemente o que pretende saber ou qualquer informação relevante..."
                  rows={3}
                  className="w-full border border-cream-dark rounded-xl px-4 py-2.5 text-sm text-text-primary font-inter focus:outline-none focus:border-rose-gold transition-colors resize-none"
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <button
                onClick={agendar}
                disabled={!formValido || enviando}
                className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Video size={16} />
                )}
                {enviando ? 'A agendar...' : 'Confirmar Consulta Virtual'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
