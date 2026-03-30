'use client'
import { useState } from 'react'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Euro,
  Instagram,
  Globe,
  Bell,
  BellOff,
  CheckCircle2,
  Save,
} from 'lucide-react'

// TODO: Load from Firestore — doc(db, 'config', 'negocio')
const defaultConfig = {
  morada: 'Braga, Portugal',
  telefone: '+351 912 345 678',
  email: 'geral@franciellycosta.com',
  horario: 'Seg–Sáb: 10:00–19:00',
  caucao: '50',
  instagram: 'https://instagram.com/franciellycosta',
  website: 'https://franciellycosta.com',
  notifNovasMarcacoes: true,
  notifLembretes: true,
  notifCancelamentos: true,
}

type ConfigKey = keyof typeof defaultConfig

export default function DefinicoesPage() {
  const [config, setConfig] = useState(defaultConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (key: ConfigKey, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Save to Firestore — setDoc(doc(db, 'config', 'negocio'), config)
      await new Promise((res) => setTimeout(res, 700))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      // TODO: Show error toast
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Definições</h1>
          <p className="text-white/40 text-sm mt-0.5">Configurações do negócio</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            saved
              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-rose-gold text-white hover:bg-opacity-90'
          } disabled:opacity-50`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'A guardar...' : saved ? 'Guardado!' : 'Guardar'}
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Business info */}
        <Section title="Informações do Negócio">
          <SettingField
            label="Morada"
            icon={<MapPin size={14} className="text-white/30" />}
          >
            <input
              type="text"
              value={config.morada}
              onChange={(e) => handleChange('morada', e.target.value)}
              placeholder="Morada completa"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>

          <SettingField
            label="Telefone"
            icon={<Phone size={14} className="text-white/30" />}
          >
            <input
              type="tel"
              value={config.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="+351 9XX XXX XXX"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>

          <SettingField
            label="Email"
            icon={<Mail size={14} className="text-white/30" />}
          >
            <input
              type="email"
              value={config.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="geral@exemplo.com"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>

          <SettingField
            label="Horário"
            icon={<Clock size={14} className="text-white/30" />}
          >
            <input
              type="text"
              value={config.horario}
              onChange={(e) => handleChange('horario', e.target.value)}
              placeholder="Seg–Sex: 10:00–19:00"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>
        </Section>

        {/* Pricing */}
        <Section title="Pagamentos">
          <SettingField
            label="Valor da Caução (€)"
            icon={<Euro size={14} className="text-white/30" />}
          >
            <input
              type="number"
              value={config.caucao}
              onChange={(e) => handleChange('caucao', e.target.value)}
              placeholder="50"
              min="0"
              step="5"
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>
          <p className="text-white/30 text-xs px-1 -mt-2">
            Valor cobrado antecipadamente para confirmar a marcação
          </p>
        </Section>

        {/* Social media */}
        <Section title="Redes Sociais">
          <SettingField
            label="Instagram"
            icon={<Instagram size={14} className="text-white/30" />}
          >
            <input
              type="url"
              value={config.instagram}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>

          <SettingField
            label="Website"
            icon={<Globe size={14} className="text-white/30" />}
          >
            <input
              type="url"
              value={config.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://..."
              className="w-full bg-transparent text-white placeholder:text-white/20 text-sm focus:outline-none"
            />
          </SettingField>
        </Section>

        {/* Notifications */}
        <Section title="Notificações Push">
          <ToggleSetting
            label="Novas marcações"
            desc="Receber notificação quando uma marcação é criada"
            value={config.notifNovasMarcacoes}
            onChange={(v) => handleChange('notifNovasMarcacoes', v)}
          />
          <ToggleSetting
            label="Lembretes de agenda"
            desc="Receber lembretes 1h antes das marcações"
            value={config.notifLembretes}
            onChange={(v) => handleChange('notifLembretes', v)}
          />
          <ToggleSetting
            label="Cancelamentos"
            desc="Receber notificação quando uma marcação é cancelada"
            value={config.notifCancelamentos}
            onChange={(v) => handleChange('notifCancelamentos', v)}
          />
        </Section>

        {/* Save button (bottom) */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
              : 'bg-gradient-to-r from-rose-gold to-golden text-white hover:opacity-90'
          } disabled:opacity-50`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'A guardar...' : saved ? 'Definições guardadas!' : 'Guardar Definições'}
        </button>
      </div>
    </div>
  )
}

// --- Sub-components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 space-y-4">
      <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </div>
  )
}

function SettingField({
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
      <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-3 focus-within:border-rose-gold/50 transition-colors">
        <span className="flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  desc,
  value,
  onChange,
}: {
  label: string
  desc: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {value ? (
          <Bell size={16} className="text-rose-gold flex-shrink-0" />
        ) : (
          <BellOff size={16} className="text-white/20 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{label}</p>
          <p className="text-white/30 text-xs truncate">{desc}</p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-rose-gold' : 'bg-white/10'
        }`}
        aria-checked={value}
        role="switch"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
