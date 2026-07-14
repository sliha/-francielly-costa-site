'use client'
import { useState, useRef, useEffect } from 'react'
import {
  MapPin, Phone, Mail, Clock, Euro, Instagram, Globe,
  Bell, BellOff, CheckCircle2, Save, Facebook, User,
  ImagePlus, Trash2, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { supabase, getAccessToken } from '@/lib/supabase/client'
import { uploadMedia, deleteMedia } from '@/lib/upload'
import { CalendarCheck, ShieldCheck } from 'lucide-react'

const DEFAULT_CONFIG = {
  morada: 'Av. Dr. António Palha 53, 4715-091 Braga, Portugal',
  telefone: '+351913112232',
  email: 'geral@franciellycosta.pt',
  horario: 'Seg–Sex: 9h–18h, Sáb: 9h–13h',
  caucao: '50',
  instagram: 'https://www.instagram.com/franciellycostamaster/',
  facebook: 'https://www.facebook.com/Franciellycostaespecialista/',
  website: 'https://franciellycosta.pt',
  whatsapp: '+351917132116',
  notifNovasMarcacoes: true,
  notifLembretes: true,
  notifCancelamentos: true,
  // About
  biografia: '',
  fotoPessoalUrl: '',
  fotoPessoalPath: '',
}

type Config = typeof DEFAULT_CONFIG

function toast(msg: string) {
  if (typeof window === 'undefined') return
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;z-index:9999;font-family:Inter,sans-serif'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

const DEFAULT_HOMEPAGE_ABOUT = {
  titulo: 'Sobre Francielly',
  subtitulo: 'Paixão pela Arte de Realçar Beleza',
  texto: 'Com mais de 8 anos de experiência em dermopigmentação avançada, Francielly Costa é reconhecida como uma das profissionais mais conceituadas do Norte de Portugal, com formação de excelência realizada em Milão, Itália.\n\nA sua missão é transformar a vida das suas clientes através de técnicas de precisão artística, proporcionando beleza natural e duradoura que respeita as características únicas de cada rosto.',
  fotoUrl: '',
  fotoPath: '',
}

type HomepageAbout = typeof DEFAULT_HOMEPAGE_ABOUT

export default function DefinicoesPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [photoProgress, setPhotoProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [calTesting, setCalTesting] = useState(false)
  type CalCheck = { ok: boolean; error?: string; value?: string; serviceAccountEmail?: string; testEventId?: string }
  type CalDiagnostico = {
    checks: {
      serviceAccountKey: CalCheck
      calendarId: CalCheck
      auth: CalCheck
      insertAndDelete: CalCheck
    }
    overallOk: boolean
    hint?: string
  }
  const [calTestResult, setCalTestResult] = useState<{
    ok: boolean
    msg: string
    link?: string
    diagnostico?: CalDiagnostico
  } | null>(null)
  const [adminGranting, setAdminGranting] = useState(false)
  const [adminStatus, setAdminStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const [isAdminClaim, setIsAdminClaim] = useState<boolean | null>(null)

  const [cleaning, setCleaning] = useState(false)
  const [cleanResult, setCleanResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const [resyncing, setResyncing] = useState(false)
  const [resyncResult, setResyncResult] = useState<{
    ok: boolean
    msg: string
    detalhe?: string
    erros?: Array<{ id: string; tipo: string; motivo: string }>
  } | null>(null)

  type SyncChannelState = {
    channelId?: string
    channelExpiration?: number
    channelCreatedAt?: string | null
    syncToken?: string
    lastSyncAt?: string | null
    lastSyncStatus?: 'ok' | 'error' | 'full-resync-needed'
    lastError?: string
  }
  const [syncState, setSyncState] = useState<SyncChannelState | null>(null)
  const [syncStateLoading, setSyncStateLoading] = useState(true)
  const [syncBusy, setSyncBusy] = useState<'register' | 'renew' | 'stop' | 'full' | null>(null)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleLimparDadosTeste = async () => {
    if (!confirm('Tem a certeza? Esta ação é irreversível.')) return
    if (!confirm('Confirmação final: apagar TODOS os agendamentos, clientes, contactos e fiberbrows-waitlist?')) return
    setCleaning(true)
    setCleanResult(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setCleanResult({ ok: false, msg: 'Não autenticado.' })
        return
      }
      const res = await fetch('/api/admin/clean-test-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setCleanResult({ ok: false, msg: data.error || `HTTP ${res.status}` })
        return
      }
      const detalhe = (data.results || [])
        .map((r: { collection: string; deleted: number; error?: string }) =>
          `${r.collection}: ${r.deleted}${r.error ? ` (erro: ${r.error})` : ''}`,
        )
        .join(' · ')
      setCleanResult({ ok: true, msg: `Apagados ${data.total} documentos. ${detalhe}` })
      toast(`Limpeza concluída: ${data.total} documentos apagados`)
    } catch (err) {
      setCleanResult({ ok: false, msg: err instanceof Error ? err.message : 'Erro' })
    } finally {
      setCleaning(false)
    }
  }

  // Verifica permissão admin no carregamento
  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) { setIsAdminClaim(null); return }
      try {
        const res = await fetch('/api/admin/auth/grant-claim', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setIsAdminClaim(res.ok && data.isAdmin === true)
      } catch {
        setIsAdminClaim(null)
      }
    }).catch(() => setIsAdminClaim(null))
  }, [])

  const handleConcederAdmin = async () => {
    setAdminGranting(true)
    setAdminStatus(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setAdminStatus({ ok: false, msg: 'Não autenticado.' })
        return
      }
      const res = await fetch('/api/admin/auth/grant-claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setAdminStatus({ ok: false, msg: data.error || `HTTP ${res.status}` })
        return
      }
      setIsAdminClaim(true)
      setAdminStatus({
        ok: true,
        msg: data.already
          ? 'Já era admin.'
          : 'Admin concedido com sucesso!'
      })
    } catch (err) {
      setAdminStatus({ ok: false, msg: err instanceof Error ? err.message : 'Erro' })
    } finally {
      setAdminGranting(false)
    }
  }

  const handleTestarCalendario = async () => {
    setCalTesting(true)
    setCalTestResult(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setCalTestResult({ ok: false, msg: 'Não autenticado.' })
        return
      }
      const res = await fetch('/api/admin/calendar/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setCalTestResult({
          ok: true,
          msg: data.eventId ? `Evento criado (id: ${data.eventId})` : 'Diagnóstico OK',
          link: data.htmlLink,
          diagnostico: data.diagnostico,
        })
      } else {
        setCalTestResult({
          ok: false,
          msg: data.error || data.diagnostico?.hint || `Falhou (HTTP ${res.status})`,
          diagnostico: data.diagnostico,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setCalTestResult({ ok: false, msg })
    } finally {
      setCalTesting(false)
    }
  }

  const handleResync = async () => {
    if (!confirm('Re-sincronizar todos os agendamentos futuros e bloqueios com Google Calendar?')) return
    setResyncing(true)
    setResyncResult(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setResyncResult({ ok: false, msg: 'Não autenticado.' })
        return
      }
      const res = await fetch('/api/admin/calendar/resync-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setResyncResult({ ok: false, msg: data.error || `HTTP ${res.status}` })
        return
      }
      const detalhe = `Agendamentos: ${data.totalAgendamentos} (criados ${data.criadosNovos}, atualizados ${data.atualizados}, falhas ${data.falhas}) · Bloqueios: ${data.totalBloqueios}${data.erros?.length ? ` · Erros: ${data.erros.length}` : ''}`
      setResyncResult({ ok: true, msg: 'Re-sincronização concluída', detalhe, erros: data.erros })
    } catch (err) {
      setResyncResult({ ok: false, msg: err instanceof Error ? err.message : 'Erro' })
    } finally {
      setResyncing(false)
    }
  }

  const [homepageAbout, setHomepageAbout] = useState<HomepageAbout>(DEFAULT_HOMEPAGE_ABOUT)
  const [savingHomepage, setSavingHomepage] = useState(false)
  const [savedHomepage, setSavedHomepage] = useState(false)
  const [loadingHomepagePhoto, setLoadingHomepagePhoto] = useState(false)
  const [homepagePhotoProgress, setHomepagePhotoProgress] = useState(0)
  const homepageFileInputRef = useRef<HTMLInputElement>(null)

  // Load from Supabase on mount
  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'negocio').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setConfig({ ...DEFAULT_CONFIG, ...(data.value as Partial<Config>) } as Config)
      })
    supabase.from('settings').select('value').eq('key', 'homepage-about').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setHomepageAbout({ ...DEFAULT_HOMEPAGE_ABOUT, ...(data.value as Partial<HomepageAbout>) } as HomepageAbout)
      })
  }, [])

  // Load Google Calendar sync state
  const loadSyncState = async () => {
    setSyncStateLoading(true)
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'googleCalendarSync')
        .maybeSingle()
      if (error) throw error
      setSyncState((data?.value as SyncChannelState) ?? {})
    } catch {
      setSyncState(null)
    } finally {
      setSyncStateLoading(false)
    }
  }
  useEffect(() => {
    if (isAdminClaim) loadSyncState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminClaim])

  const syncAction = async (
    action: 'register' | 'renew' | 'stop' | 'full',
  ) => {
    if (action === 'stop' && !confirm('Parar a sincronização bidirecional? Eventos no Google deixarão de afetar o site.')) return
    setSyncBusy(action)
    setSyncMsg(null)
    try {
      const token = await getAccessToken()
      if (!token) {
        setSyncMsg({ ok: false, text: 'Não autenticado' })
        return
      }
      const endpoints = {
        register: '/api/admin/google-calendar/register-watch',
        renew: '/api/admin/google-calendar/renew-watch',
        stop: '/api/admin/google-calendar/stop-watch',
        full: '/api/admin/google-calendar/full-resync',
      }
      const res = await fetch(endpoints[action], {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setSyncMsg({ ok: false, text: data.error || `HTTP ${res.status}` })
        return
      }
      const labels = {
        register: 'Sincronização iniciada',
        renew: 'Canal renovado',
        stop: 'Sincronização parada',
        full: `Re-sync completo (${data.processed ?? '?'} eventos)`,
      }
      setSyncMsg({ ok: true, text: labels[action] })
      await loadSyncState()
    } catch (err) {
      setSyncMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro' })
    } finally {
      setSyncBusy(null)
    }
  }

  const handleChange = (key: keyof Config, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('settings').upsert(
        { key: 'negocio', value: config, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
      if (error) throw error
      setSaved(true)
      toast('Definições guardadas com sucesso!')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast('Erro ao guardar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    setLoadingPhoto(true)
    setPhotoProgress(0)
    try {
      const path = `about/foto-pessoal_${Date.now()}`
      const { url, path: p } = await uploadMedia(file, path)
      setPhotoProgress(100)
      setConfig((prev) => ({ ...prev, fotoPessoalUrl: url, fotoPessoalPath: p }))
    } catch {
      toast('Erro no upload da foto.')
    } finally {
      setLoadingPhoto(false)
      setPhotoProgress(0)
    }
  }

  const handlePhotoDelete = async () => {
    if (!config.fotoPessoalPath) return
    try {
      await deleteMedia(config.fotoPessoalPath)
      setConfig((prev) => ({ ...prev, fotoPessoalUrl: '', fotoPessoalPath: '' }))
    } catch {
      toast('Erro ao remover foto.')
    }
  }

  const handleHomepagePhotoUpload = async (file: File) => {
    setLoadingHomepagePhoto(true)
    setHomepagePhotoProgress(0)
    try {
      const path = `about/homepage_${Date.now()}`
      const { url, path: p } = await uploadMedia(file, path)
      setHomepagePhotoProgress(100)
      const next = { ...homepageAbout, fotoUrl: url, fotoPath: p }
      setHomepageAbout(next)
      await supabase.from('settings').upsert(
        { key: 'homepage-about', value: next, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
    } catch {
      toast('Erro no upload da foto.')
    } finally {
      setLoadingHomepagePhoto(false)
      setHomepagePhotoProgress(0)
    }
  }

  const handleHomepagePhotoDelete = async () => {
    if (!homepageAbout.fotoPath) return
    try {
      await deleteMedia(homepageAbout.fotoPath)
      setHomepageAbout((prev) => ({ ...prev, fotoUrl: '', fotoPath: '' }))
    } catch {
      toast('Erro ao remover foto.')
    }
  }

  const handleSaveHomepage = async () => {
    setSavingHomepage(true)
    try {
      const { error } = await supabase.from('settings').upsert(
        { key: 'homepage-about', value: homepageAbout, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
      if (error) throw error
      setSavedHomepage(true)
      toast('Secção "Sobre" guardada com sucesso!')
      setTimeout(() => setSavedHomepage(false), 3000)
    } catch {
      toast('Erro ao guardar. Tente novamente.')
    } finally {
      setSavingHomepage(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Definições</h1>
          <p className="text-white/40 text-xs mt-0.5">Configurações do negócio</p>
        </div>
        <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      </div>

      <div className="px-4 md:px-6 pb-8 pt-4 space-y-4">

        {/* About Me */}
        <Section title="Sobre Mim">
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="flex-shrink-0">
              {config.fotoPessoalUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.fotoPessoalUrl} alt="Foto pessoal"
                    className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                  <button onClick={handlePhotoDelete}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={10} className="text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} disabled={loadingPhoto}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 hover:border-rose-gold/50 flex flex-col items-center justify-center gap-1 transition-colors">
                  {loadingPhoto ? (
                    <div className="text-center">
                      <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                      <span className="text-white/30 text-[9px]">{photoProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <ImagePlus size={18} className="text-white/30" />
                      <span className="text-white/30 text-[10px]">Foto</span>
                    </>
                  )}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
            </div>
            {/* Bio */}
            <div className="flex-1">
              <label className="text-white/40 text-xs mb-1.5 block">Biografia</label>
              <textarea
                value={config.biografia}
                onChange={(e) => handleChange('biografia', e.target.value)}
                placeholder="Escreva aqui a sua apresentação..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-rose-gold/50 resize-none transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Homepage About */}
        <Section title="Sobre Francielly (Homepage)">
          <p className="text-white/30 text-xs -mt-1 mb-2">Texto e foto exibidos na secção "Sobre" da página inicial</p>
          {/* Photo upload */}
          <div className="flex items-start gap-4 mb-3">
            <div className="flex-shrink-0">
              {homepageAbout.fotoUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={homepageAbout.fotoUrl} alt="Foto homepage"
                    className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                  <button onClick={handleHomepagePhotoDelete}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={10} className="text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => homepageFileInputRef.current?.click()} disabled={loadingHomepagePhoto}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 hover:border-rose-gold/50 flex flex-col items-center justify-center gap-1 transition-colors">
                  {loadingHomepagePhoto ? (
                    <div className="text-center">
                      <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                      <span className="text-white/30 text-[9px]">{homepagePhotoProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <ImagePlus size={18} className="text-white/30" />
                      <span className="text-white/30 text-[10px]">Foto</span>
                    </>
                  )}
                </button>
              )}
              <input ref={homepageFileInputRef} type="file" accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHomepagePhotoUpload(f) }} />
            </div>
            <div className="flex-1 text-white/40 text-xs leading-relaxed pt-1">
              Foto principal da secção &quot;Sobre&quot; na homepage.<br />
              Formatos: JPG, PNG, HEIC. Recomendado: 3:4 vertical.
            </div>
          </div>
          {/* Text fields */}
          <div className="space-y-2">
            <div>
              <label className="text-white/40 text-[11px] mb-1 block">Título</label>
              <input type="text"
                value={homepageAbout.titulo}
                onChange={(e) => setHomepageAbout((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Sobre Francielly"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-rose-gold/50 transition-colors" />
            </div>
            <div>
              <label className="text-white/40 text-[11px] mb-1 block">Subtítulo</label>
              <input type="text"
                value={homepageAbout.subtitulo}
                onChange={(e) => setHomepageAbout((p) => ({ ...p, subtitulo: e.target.value }))}
                placeholder="Paixão pela Arte de Realçar Beleza"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-rose-gold/50 transition-colors" />
            </div>
            <div>
              <label className="text-white/40 text-[11px] mb-1 block">Texto da bio</label>
              <textarea
                value={homepageAbout.texto}
                onChange={(e) => setHomepageAbout((p) => ({ ...p, texto: e.target.value }))}
                placeholder="Escreva aqui a bio para a homepage..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-rose-gold/50 resize-none transition-colors" />
            </div>
          </div>
          <SaveButton saving={savingHomepage} saved={savedHomepage} onClick={handleSaveHomepage} full />
        </Section>

        {/* Business info */}
        <Section title="Informações do Negócio">
          <SettingField label="Morada" icon={<MapPin size={13} className="text-white/30" />}>
            <input type="text" value={config.morada} onChange={(e) => handleChange('morada', e.target.value)}
              placeholder="Morada completa" className="field-input" />
          </SettingField>
          <SettingField label="Telefone (contacto)" icon={<Phone size={13} className="text-white/30" />}>
            <input type="tel" value={config.telefone} onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="+351 9XX XXX XXX" className="field-input" />
          </SettingField>
          <SettingField label="Email" icon={<Mail size={13} className="text-white/30" />}>
            <input type="email" value={config.email} onChange={(e) => handleChange('email', e.target.value)}
              placeholder="geral@exemplo.com" className="field-input" />
          </SettingField>
          <SettingField label="Horário de funcionamento" icon={<Clock size={13} className="text-white/30" />}>
            <input type="text" value={config.horario} onChange={(e) => handleChange('horario', e.target.value)}
              placeholder="Seg–Sex: 9h–18h" className="field-input" />
          </SettingField>
        </Section>

        {/* Contacts & Social */}
        <Section title="Contactos e Redes Sociais">
          <SettingField label="Instagram" icon={<Instagram size={13} className="text-white/30" />}>
            <input type="url" value={config.instagram} onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..." className="field-input" />
          </SettingField>
          <SettingField label="Facebook" icon={<Facebook size={13} className="text-white/30" />}>
            <input type="url" value={config.facebook} onChange={(e) => handleChange('facebook', e.target.value)}
              placeholder="https://facebook.com/..." className="field-input" />
          </SettingField>
          <SettingField label="WhatsApp" icon={<Phone size={13} className="text-white/30" />}>
            <input type="tel" value={config.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="+351 9XX XXX XXX" className="field-input" />
          </SettingField>
          <SettingField label="Website" icon={<Globe size={13} className="text-white/30" />}>
            <input type="url" value={config.website} onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://..." className="field-input" />
          </SettingField>
        </Section>

        {/* Pricing */}
        <Section title="Pagamentos">
          <SettingField label="Valor da Caução (€)" icon={<Euro size={13} className="text-white/30" />}>
            <input type="number" value={config.caucao} onChange={(e) => handleChange('caucao', e.target.value)}
              placeholder="50" min="0" step="5" className="field-input" />
          </SettingField>
          <p className="text-white/30 text-xs px-1">Valor cobrado antecipadamente para confirmar a marcação</p>
        </Section>

        {/* Permissões Admin */}
        <Section title="Permissões Admin">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck size={14} className={isAdminClaim ? 'text-emerald-400' : 'text-amber-400'} />
            <span className={isAdminClaim ? 'text-emerald-400' : 'text-white/60'}>
              {isAdminClaim === null ? 'A verificar...' : isAdminClaim ? 'Tem permissões admin' : 'Sem claim admin no token'}
            </span>
          </div>
          {!isAdminClaim && (
            <button
              onClick={handleConcederAdmin}
              disabled={adminGranting}
              className="w-full flex items-center justify-center gap-2 bg-rose-gold/10 hover:bg-rose-gold/20 border border-rose-gold/30 text-rose-gold py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {adminGranting && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {adminGranting ? 'A conceder...' : 'Ativar Permissões Admin'}
            </button>
          )}
          {adminStatus && (
            <div className={`text-xs rounded-xl p-2.5 border ${
              adminStatus.ok
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              {adminStatus.msg}
            </div>
          )}
        </Section>

        {/* Google Calendar */}
        <Section title="Integração Google Calendar">
          <p className="text-white/30 text-xs -mt-1 mb-1">
            Diagnóstico passo-a-passo da integração (key, calendar id, auth, insert+delete).
          </p>
          <button
            onClick={handleTestarCalendario}
            disabled={calTesting}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {calTesting ? (
              <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CalendarCheck size={15} className="text-rose-gold" />
            )}
            {calTesting ? 'A testar...' : 'Testar Calendário Google'}
          </button>
          {calTestResult && (
            <div
              className={`text-xs rounded-xl p-2.5 border space-y-1.5 ${
                calTestResult.ok
                  ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                  : 'bg-red-400/10 text-red-400 border-red-400/20'
              }`}
            >
              <p className="font-medium">{calTestResult.ok ? 'Sucesso' : 'Falhou'}</p>
              {calTestResult.diagnostico && (
                <ul className="space-y-0.5 opacity-90">
                  <li>{calTestResult.diagnostico.checks.serviceAccountKey.ok ? '✓' : '✗'} GOOGLE_SERVICE_ACCOUNT_KEY {calTestResult.diagnostico.checks.serviceAccountKey.error ? `— ${calTestResult.diagnostico.checks.serviceAccountKey.error}` : ''}</li>
                  <li>{calTestResult.diagnostico.checks.calendarId.ok ? '✓' : '✗'} GOOGLE_CALENDAR_ID {calTestResult.diagnostico.checks.calendarId.value ? `(${calTestResult.diagnostico.checks.calendarId.value})` : ''}</li>
                  <li>{calTestResult.diagnostico.checks.auth.ok ? '✓' : '✗'} JWT auth {calTestResult.diagnostico.checks.auth.serviceAccountEmail ? `(${calTestResult.diagnostico.checks.auth.serviceAccountEmail})` : ''} {calTestResult.diagnostico.checks.auth.error ? `— ${calTestResult.diagnostico.checks.auth.error}` : ''}</li>
                  <li>{calTestResult.diagnostico.checks.insertAndDelete.ok ? '✓' : '✗'} Insert + delete evento {calTestResult.diagnostico.checks.insertAndDelete.error ? `— ${calTestResult.diagnostico.checks.insertAndDelete.error}` : ''}</li>
                </ul>
              )}
              <p className="opacity-80 break-words pt-1 border-t border-current/10">{calTestResult.msg}</p>
              {calTestResult.diagnostico?.hint && (
                <p className="opacity-80 break-words italic">{calTestResult.diagnostico.hint}</p>
              )}
              {calTestResult.ok && calTestResult.link && (
                <a
                  href={calTestResult.link}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-emerald-300 hover:text-emerald-200 mt-1 inline-block"
                >
                  Abrir no Google Calendar
                </a>
              )}
            </div>
          )}

          <button
            onClick={handleResync}
            disabled={resyncing}
            className="w-full flex items-center justify-center gap-2 bg-rose-gold/10 hover:bg-rose-gold/20 border border-rose-gold/30 text-rose-gold py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {resyncing ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {resyncing ? 'A re-sincronizar...' : 'Re-sincronizar Calendário Agora'}
          </button>
          {resyncResult && (
            <div className={`text-xs rounded-xl p-2.5 border ${
              resyncResult.ok
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              <p className="font-medium">{resyncResult.ok ? 'Sucesso' : 'Erro'}</p>
              <p className="opacity-80 break-words">{resyncResult.msg}</p>
              {resyncResult.detalhe && (
                <p className="opacity-70 break-words mt-1">{resyncResult.detalhe}</p>
              )}
              {resyncResult.erros && resyncResult.erros.length > 0 && (
                <details className="mt-2 cursor-pointer">
                  <summary className="opacity-80 select-none">Ver erros ({resyncResult.erros.length})</summary>
                  <ul className="mt-1.5 space-y-1 opacity-70 break-words pl-2">
                    {resyncResult.erros.map((e, i) => (
                      <li key={i} className="text-[11px]">
                        <span className="font-mono">[{e.tipo}]</span> <span className="font-mono">{e.id}</span>: {e.motivo}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Section>

        {/* Sincronização Bidirecional Google Calendar (Fase 2) */}
        <Section title="Sincronização Google Calendar (Bidirecional)">
          <p className="text-white/30 text-xs -mt-1 mb-1">
            Quando ativado, o site recebe push notifications do Google e bloqueia slots automaticamente quando criares eventos manualmente.
          </p>

          {/* Estado */}
          {syncStateLoading ? (
            <div className="text-white/40 text-xs">A carregar estado...</div>
          ) : (() => {
            const expiration = syncState?.channelExpiration
            const now = Date.now()
            const hasChannel = !!syncState?.channelId && !!expiration
            const expired = hasChannel && expiration! < now
            const dias = hasChannel ? Math.max(0, Math.floor((expiration! - now) / (24 * 60 * 60 * 1000))) : 0
            const horas = hasChannel ? Math.max(0, Math.floor(((expiration! - now) % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))) : 0
            const estadoLabel = !hasChannel ? '🔴 Canal não registado' : expired ? '🟡 Canal expirado' : `🟢 Canal ativo (expira em ${dias}d ${horas}h)`
            const lastSync = syncState?.lastSyncAt ? new Date(syncState.lastSyncAt) : null
            const lastSyncStr = lastSync ? lastSync.toLocaleString('pt-PT') : '—'
            return (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1 text-xs">
                <p className="text-white/80 font-medium">{estadoLabel}</p>
                <p className="text-white/40">Última sincronização: {lastSyncStr}{syncState?.lastSyncStatus ? ` (${syncState.lastSyncStatus})` : ''}</p>
                {syncState?.lastError && (
                  <p className="text-red-400/80 break-words">Erro: {syncState.lastError}</p>
                )}
              </div>
            )
          })()}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => syncAction('register')}
              disabled={syncBusy !== null}
              className="flex items-center justify-center gap-2 bg-emerald-400/10 hover:bg-emerald-400/20 border border-emerald-400/30 text-emerald-400 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              {syncBusy === 'register' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Iniciar Sincronização
            </button>
            <button
              onClick={() => syncAction('renew')}
              disabled={syncBusy !== null}
              className="flex items-center justify-center gap-2 bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/30 text-sky-400 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              {syncBusy === 'renew' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Renovar Canal
            </button>
            <button
              onClick={() => syncAction('full')}
              disabled={syncBusy !== null}
              className="flex items-center justify-center gap-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              {syncBusy === 'full' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Forçar Re-sync
            </button>
            <button
              onClick={() => syncAction('stop')}
              disabled={syncBusy !== null}
              className="flex items-center justify-center gap-2 bg-red-400/10 hover:bg-red-400/20 border border-red-400/30 text-red-400 py-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            >
              {syncBusy === 'stop' && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              Parar Sincronização
            </button>
          </div>

          {syncMsg && (
            <div className={`text-xs rounded-xl p-2.5 border ${
              syncMsg.ok
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              {syncMsg.text}
            </div>
          )}
        </Section>

        {/* Limpeza de Dados de Teste */}
        <Section title="Limpeza de Dados de Teste">
          <p className="text-white/30 text-xs -mt-1 mb-1">
            Apaga TODOS os documentos das colecções de teste: agendamentos, clientes, contactos e fiberbrows-waitlist. Mantém serviços, definições, galeria, blog e certificações. Acção irreversível.
          </p>
          <button
            onClick={handleLimparDadosTeste}
            disabled={cleaning}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {cleaning ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertTriangle size={15} />
            )}
            {cleaning ? 'A limpar...' : 'Limpar Dados de Teste'}
          </button>
          {cleanResult && (
            <div className={`text-xs rounded-xl p-2.5 border ${
              cleanResult.ok
                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                : 'bg-red-400/10 text-red-400 border-red-400/20'
            }`}>
              <p className="font-medium">{cleanResult.ok ? 'Sucesso' : 'Erro'}</p>
              <p className="opacity-80 break-words">{cleanResult.msg}</p>
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Notificações Push">
          <ToggleSetting label="Novas marcações" desc="Receber notificação quando uma marcação é criada"
            value={config.notifNovasMarcacoes} onChange={(v) => handleChange('notifNovasMarcacoes', v)} />
          <ToggleSetting label="Lembretes de agenda" desc="Receber lembretes 1h antes das marcações"
            value={config.notifLembretes} onChange={(v) => handleChange('notifLembretes', v)} />
          <ToggleSetting label="Cancelamentos" desc="Receber notificação quando uma marcação é cancelada"
            value={config.notifCancelamentos} onChange={(v) => handleChange('notifCancelamentos', v)} />
        </Section>

        {/* Save bottom */}
        <SaveButton saving={saving} saved={saved} onClick={handleSave} full />
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          background: transparent;
          color: white;
          font-size: 13px;
          outline: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveButton({ saving, saved, onClick, full = false }: {
  saving: boolean; saved: boolean; onClick: () => void; full?: boolean
}) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`flex items-center gap-2 ${full ? 'w-full justify-center py-3.5 rounded-2xl text-sm font-semibold' : 'px-4 py-2 rounded-xl text-xs font-medium'} transition-all ${
        saved ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
          : full ? 'bg-gradient-to-r from-rose-gold to-golden text-white hover:opacity-90'
          : 'bg-rose-gold text-white hover:bg-opacity-90'
      } disabled:opacity-50`}>
      {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : saved ? <CheckCircle2 size={15} />
        : <Save size={15} />}
      {saving ? 'A guardar...' : saved ? 'Guardado!' : full ? 'Guardar Definições' : 'Guardar'}
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 space-y-3">
      <h2 className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}

function SettingField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/40 text-[11px] mb-1 block">{label}</label>
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-rose-gold/50 transition-colors">
        <span className="flex-shrink-0">{icon}</span>
        {children}
      </div>
    </div>
  )
}

function ToggleSetting({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {value ? <Bell size={14} className="text-rose-gold flex-shrink-0" />
          : <BellOff size={14} className="text-white/20 flex-shrink-0" />}
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{label}</p>
          <p className="text-white/30 text-xs truncate">{desc}</p>
        </div>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-rose-gold' : 'bg-white/10'}`}
        aria-checked={value} role="switch">
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
