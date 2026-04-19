'use client'
import { useState, useRef, useEffect } from 'react'
import {
  MapPin, Phone, Mail, Clock, Euro, Instagram, Globe,
  Bell, BellOff, CheckCircle2, Save, Facebook, User,
  ImagePlus, Trash2, RefreshCw,
} from 'lucide-react'
import { db, storage } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'

const DEFAULT_CONFIG = {
  morada: 'Av. Dr. António Palha 53, 4715-091 Braga, Portugal',
  telefone: '+351917132116',
  email: 'geral@franciellycosta.com',
  horario: 'Seg–Sex: 9h–18h, Sáb: 9h–13h',
  caucao: '50',
  instagram: 'https://www.instagram.com/franciellycostamaster/',
  facebook: 'https://www.facebook.com/Franciellycostaespecialista/',
  website: 'https://franciellycosta.com',
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

  const [homepageAbout, setHomepageAbout] = useState<HomepageAbout>(DEFAULT_HOMEPAGE_ABOUT)
  const [savingHomepage, setSavingHomepage] = useState(false)
  const [savedHomepage, setSavedHomepage] = useState(false)
  const [loadingHomepagePhoto, setLoadingHomepagePhoto] = useState(false)
  const [homepagePhotoProgress, setHomepagePhotoProgress] = useState(0)
  const homepageFileInputRef = useRef<HTMLInputElement>(null)

  // Load from Firestore on mount
  useEffect(() => {
    if (!db) return
    getDoc(doc(db, 'settings', 'negocio')).then((snap) => {
      if (snap.exists()) setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as Config)
    }).catch(() => {})
    getDoc(doc(db, 'settings', 'homepage-about')).then((snap) => {
      if (snap.exists()) setHomepageAbout({ ...DEFAULT_HOMEPAGE_ABOUT, ...snap.data() } as HomepageAbout)
    }).catch(() => {})
  }, [])

  const handleChange = (key: keyof Config, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (db) {
        await setDoc(doc(db, 'settings', 'negocio'), config, { merge: true })
      }
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
    if (!storage || !db) { toast('Storage não configurado'); return }
    setLoadingPhoto(true)
    setPhotoProgress(0)
    try {
      const path = `about/foto-pessoal_${Date.now()}`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file)

      await new Promise<void>((resolve, reject) => {
        task.on('state_changed',
          (snap) => setPhotoProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref)
            console.log('Upload URL:', url)
            setConfig((prev) => ({ ...prev, fotoPessoalUrl: url, fotoPessoalPath: path }))
            resolve()
          }
        )
      })
    } catch {
      toast('Erro no upload da foto.')
    } finally {
      setLoadingPhoto(false)
      setPhotoProgress(0)
    }
  }

  const handlePhotoDelete = async () => {
    if (!storage || !config.fotoPessoalPath) return
    try {
      await deleteObject(ref(storage, config.fotoPessoalPath))
      setConfig((prev) => ({ ...prev, fotoPessoalUrl: '', fotoPessoalPath: '' }))
    } catch {
      toast('Erro ao remover foto.')
    }
  }

  const handleHomepagePhotoUpload = async (file: File) => {
    if (!storage || !db) { toast('Storage não configurado'); return }
    setLoadingHomepagePhoto(true)
    setHomepagePhotoProgress(0)
    try {
      const path = `about/homepage_${Date.now()}`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file)
      await new Promise<void>((resolve, reject) => {
        task.on('state_changed',
          (snap) => setHomepagePhotoProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          async () => {
            const url = await getDownloadURL(task.snapshot.ref)
            console.log('Upload URL:', url)
            setHomepageAbout((prev) => ({ ...prev, fotoUrl: url, fotoPath: path }))
            if (db) await setDoc(doc(db, 'settings', 'homepage-about'), { fotoUrl: url, fotoPath: path }, { merge: true })
            resolve()
          }
        )
      })
    } catch {
      toast('Erro no upload da foto.')
    } finally {
      setLoadingHomepagePhoto(false)
      setHomepagePhotoProgress(0)
    }
  }

  const handleHomepagePhotoDelete = async () => {
    if (!storage || !homepageAbout.fotoPath) return
    try {
      await deleteObject(ref(storage, homepageAbout.fotoPath))
      setHomepageAbout((prev) => ({ ...prev, fotoUrl: '', fotoPath: '' }))
    } catch {
      toast('Erro ao remover foto.')
    }
  }

  const handleSaveHomepage = async () => {
    setSavingHomepage(true)
    try {
      if (db) await setDoc(doc(db, 'settings', 'homepage-about'), homepageAbout, { merge: true })
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
          <SettingField label="Telefone / WhatsApp" icon={<Phone size={13} className="text-white/30" />}>
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
