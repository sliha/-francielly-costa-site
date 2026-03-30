'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Euro,
  TrendingUp,
  PlusCircle,
  Upload,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

// TODO: Replace with Firestore query — collection('marcacoes').where('data', '==', today)
const mockToday = [
  {
    id: '1',
    clienteNome: 'Ana Silva',
    servicoNome: 'Microblading',
    horaInicio: '10:00',
    estado: 'confirmado',
  },
  {
    id: '2',
    clienteNome: 'Marta Santos',
    servicoNome: 'Micropigmentação Labial',
    horaInicio: '14:30',
    estado: 'pendente',
  },
  {
    id: '3',
    clienteNome: 'Joana Ferreira',
    servicoNome: 'Microshading',
    horaInicio: '16:00',
    estado: 'confirmado',
  },
]

// TODO: Replace with Firestore aggregation queries
const mockStats = {
  marcacoesHoje: 3,
  pendentes: 1,
  receitaEstimada: 410,
  totalMes: 24,
}

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmado: { label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  pendente: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  pago: { label: 'Pago', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  concluido: { label: 'Concluído', color: 'text-white/40', bg: 'bg-white/5' },
  cancelado: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10' },
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function AdminDashboard() {
  const [_refreshing] = useState(false)

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/40 text-sm capitalize">{getTodayFormatted()}</p>
            <h1 className="text-white text-2xl font-playfair font-semibold mt-0.5">
              {getGreeting()}, Francielly 👋
            </h1>
          </div>
          <Link
            href="/admin/agenda/nova"
            className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors flex-shrink-0"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">Nova Marcação</span>
          </Link>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<Calendar size={20} className="text-rose-gold" />}
            label="Marcações Hoje"
            value={mockStats.marcacoesHoje.toString()}
            sub="agendadas"
            accent="rose"
          />
          <StatCard
            icon={<AlertCircle size={20} className="text-amber-400" />}
            label="Pendentes"
            value={mockStats.pendentes.toString()}
            sub="a confirmar"
            accent="amber"
          />
          <StatCard
            icon={<Euro size={20} className="text-emerald-400" />}
            label="Receita Est."
            value={`€${mockStats.receitaEstimada}`}
            sub="hoje"
            accent="emerald"
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-golden" />}
            label="Total Mês"
            value={mockStats.totalMes.toString()}
            sub="marcações"
            accent="golden"
          />
        </div>

        {/* Today's agenda */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <Clock size={16} className="text-rose-gold" />
              Agenda de Hoje
            </h2>
            <Link
              href="/admin/agenda"
              className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1 transition-colors"
            >
              Ver tudo <ChevronRight size={14} />
            </Link>
          </div>

          {mockToday.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
              <Calendar size={32} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Sem marcações para hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mockToday.map((booking) => {
                const status = estadoConfig[booking.estado] ?? estadoConfig.pendente
                return (
                  <Link
                    key={booking.id}
                    href={`/admin/agenda?id=${booking.id}`}
                    className="flex items-center gap-4 bg-[#1A1A1A] hover:bg-[#222222] rounded-2xl px-4 py-3.5 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    {/* Time */}
                    <div className="text-center flex-shrink-0 w-12">
                      <span className="text-rose-gold font-semibold text-sm">
                        {booking.horaInicio}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {booking.clienteNome}
                      </p>
                      <p className="text-white/40 text-xs truncate">
                        {booking.servicoNome}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${status.color} ${status.bg}`}
                    >
                      {status.label}
                    </span>

                    <ChevronRight
                      size={14}
                      className="text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0"
                    />
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-white font-semibold text-base mb-3">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <QuickAction
              href="/admin/agenda/nova"
              icon={<PlusCircle size={18} className="text-rose-gold" />}
              label="Nova Marcação"
              desc="Agendar manualmente"
            />
            <QuickAction
              href="/admin/agenda"
              icon={<Calendar size={18} className="text-golden" />}
              label="Ver Agenda"
              desc="Calendário completo"
            />
            <QuickAction
              href="/admin/galeria"
              icon={<Upload size={18} className="text-sky-400" />}
              label="Upload Foto"
              desc="Adicionar à galeria"
            />
          </div>
        </section>

        {/* Summary card */}
        <section className="bg-gradient-to-br from-rose-gold/10 to-golden/5 rounded-2xl p-5 border border-rose-gold/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-rose-gold" />
            <h3 className="text-white font-medium text-sm">Resumo do Mês</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-playfair font-semibold text-white">24</p>
              <p className="text-white/40 text-xs mt-0.5">Marcações</p>
            </div>
            <div>
              <p className="text-2xl font-playfair font-semibold text-golden">€3.2k</p>
              <p className="text-white/40 text-xs mt-0.5">Receita</p>
            </div>
            <div>
              <p className="text-2xl font-playfair font-semibold text-emerald-400">96%</p>
              <p className="text-white/40 text-xs mt-0.5">Concluídas</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// --- Sub-components ---

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: 'rose' | 'amber' | 'emerald' | 'golden'
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40 font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-playfair font-semibold text-white leading-none">
        {value}
      </p>
      <p className="text-white/30 text-xs mt-1">{sub}</p>
    </div>
  )
}

interface QuickActionProps {
  href: string
  icon: React.ReactNode
  label: string
  desc: string
}

function QuickAction({ href, icon, label, desc }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-[#1A1A1A] hover:bg-[#222222] rounded-2xl px-4 py-3.5 border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-white/30 text-xs">{desc}</p>
      </div>
      <ChevronRight
        size={14}
        className="text-white/20 group-hover:text-white/40 transition-colors ml-auto flex-shrink-0"
      />
    </Link>
  )
}
