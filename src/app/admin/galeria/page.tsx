'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, Trash2, Eye, EyeOff, ImagePlus, Filter, X, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { uploadMedia, deleteMedia } from '@/lib/upload'

interface Foto {
  id: string
  servico: string
  tipo: 'antes' | 'depois'
  mediaType: 'foto' | 'video'
  ativa: boolean
  url: string
  storagePath: string
  label: string
  criadoEm?: unknown
}

const servicoLabels: Record<string, string> = {
  todos: 'Todos',
  fiberbrows: 'FiberBROWS',
  tricopigmentacao: 'Tricopigmentação',
  microblading: 'Microblading',
  microshading: 'Microshading',
  eyeliner: 'Eyeliner',
  labial: 'Labial',
}

const tipoConfig = {
  antes: { label: 'Antes', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  depois: { label: 'Depois', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

interface UploadItem {
  id: string
  name: string
  progress: number
  error?: string
}

export default function GaleriaPage() {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [filterServico, setFilterServico] = useState('todos')
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadMeta, setUploadMeta] = useState({ servico: 'microblading', tipo: 'depois' as 'antes' | 'depois' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('galeria')
      .select('*')
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setFotos(data.map((d) => ({
            id: d.id,
            servico: d.servico,
            tipo: d.tipo,
            mediaType: d.media_type ?? 'foto',
            ativa: d.ativa,
            url: d.url,
            storagePath: d.storage_path,
            label: d.label,
            criadoEm: d.criado_em,
          } as Foto)))
        }
        setLoading(false)
      })
  }, [])

  const filteredFotos = filterServico === 'todos' ? fotos : fotos.filter((f) => f.servico === filterServico)

  const toggleAtiva = async (id: string, current: boolean) => {
    setFotos((prev) => prev.map((f) => (f.id === id ? { ...f, ativa: !current } : f)))
    try { await supabase.from('galeria').update({ ativa: !current }).eq('id', id) } catch {}
  }

  const deleteFoto = async (foto: Foto) => {
    if (!confirm('Eliminar este ficheiro?')) return
    setFotos((prev) => prev.filter((f) => f.id !== foto.id))
    try {
      if (foto.storagePath) await deleteMedia(foto.storagePath)
      await supabase.from('galeria').delete().eq('id', foto.id)
    } catch {}
  }

  const processFiles = async (files: File[]) => {
    setPendingFiles([])

    for (const file of files) {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`${file.name}: ficheiro demasiado grande (máx ${isVideo ? '200MB' : '10MB'})`)
        continue
      }

      const uploadId = `${Date.now()}_${Math.random()}`
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `media/servicos/${uploadMeta.servico}/${uploadId}_${safeName}`

      console.log(`[Upload] Starting: ${file.name} → ${path} (${file.type}, ${(file.size / 1024).toFixed(0)} KB)`)

      setUploads((prev) => [...prev, { id: uploadId, name: file.name, progress: 0 }])

      let url: string
      try {
        const r = await uploadMedia(file, path)
        url = r.url
      } catch (upErr) {
        const msg = upErr instanceof Error ? upErr.message : 'Erro desconhecido'
        console.error(`[Upload] ERRO em ${file.name}:`, upErr)
        alert(`❌ Erro no upload de "${file.name}":\n${msg}`)
        setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, error: msg } : u)))
        setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== uploadId)), 5000)
        continue
      }

      try {
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u))
        )

        const id = uploadId
        const newRow = {
          id,
          servico: uploadMeta.servico,
          tipo: uploadMeta.tipo,
          media_type: isVideo ? 'video' : 'foto',
          ativa: true,
          url,
          storage_path: path,
          label: servicoLabels[uploadMeta.servico] ?? uploadMeta.servico,
          criado_em: new Date().toISOString(),
        }
        const { error: insErr } = await supabase.from('galeria').insert(newRow)
        if (insErr) {
          console.error('[Upload] Erro ao guardar no Supabase:', insErr)
          alert(`❌ Erro ao guardar "${file.name}":\n${insErr.message}`)
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, error: insErr.message } : u))
          )
          continue
        }

        setFotos((prev) => [
          {
            id,
            servico: newRow.servico,
            tipo: newRow.tipo,
            mediaType: isVideo ? 'video' : 'foto',
            ativa: true,
            url,
            storagePath: path,
            label: newRow.label,
            criadoEm: newRow.criado_em,
          } as Foto,
          ...prev,
        ])
        setUploads((prev) => prev.filter((u) => u.id !== uploadId))
      } catch (err) {
        console.error('[Upload] Catch geral:', err)
        setTimeout(
          () => setUploads((prev) => prev.filter((u) => u.id !== uploadId)),
          5000
        )
      }
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPendingFiles(Array.from(files))
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold">Galeria & Vídeos</h1>
          <p className="text-white/40 text-xs mt-0.5">
            {fotos.filter((f) => f.ativa).length} ativos · {fotos.length} total
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 pt-4 space-y-4">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging ? 'border-rose-gold bg-rose-gold/5 scale-[1.01]' : 'border-white/10 hover:border-white/20'
          }`}
        >
          <input ref={fileInputRef} type="file"
            accept="image/jpeg,image/png,image/webp,.heic,.heif,video/mp4,video/quicktime,video/mov"
            multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center mx-auto mb-2">
            <ImagePlus size={20} className="text-rose-gold" />
          </div>
          <p className="text-white/70 text-sm font-medium mb-0.5">Arraste ou clique para selecionar</p>
          <p className="text-white/30 text-xs">Fotos: JPEG, PNG, WEBP, HEIC · Vídeos: MP4, MOV · Fotos até 10MB · Vídeos até 200MB</p>
        </div>

        {/* Upload progress */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((u) => (
              <div key={u.id} className={`rounded-xl border p-3 ${u.error ? 'bg-red-500/10 border-red-500/30' : 'bg-[#1A1A1A] border-white/5'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/70 text-xs truncate max-w-[60%]">{u.name}</span>
                  <span className={`text-xs font-medium ${u.error ? 'text-red-400' : 'text-white/40'}`}>
                    {u.error ? '❌ Falhou' : u.progress === 100 ? '✅ Concluído' : `${u.progress}%`}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${u.error ? 'bg-red-500' : 'bg-rose-gold'}`}
                    style={{ width: u.error ? '100%' : `${u.progress}%` }} />
                </div>
                {u.error && (
                  <p className="text-red-400 text-[10px] mt-1.5 leading-relaxed break-all">{u.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={13} className="text-white/30 flex-shrink-0" />
          {Object.entries(servicoLabels).map(([key, label]) => (
            <button key={key} onClick={() => setFilterServico(key)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                filterServico === key ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#1A1A1A] rounded-xl p-3 border border-white/5">
            <p className="text-white font-semibold text-lg">{fotos.filter(f => f.mediaType !== 'video').length}</p>
            <p className="text-white/30 text-xs">Fotos</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 border border-white/5">
            <p className="text-white font-semibold text-lg">{fotos.filter(f => f.mediaType === 'video').length}</p>
            <p className="text-white/30 text-xs">Vídeos</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 border border-white/5">
            <p className="text-white font-semibold text-lg">{fotos.filter(f => f.ativa).length}</p>
            <p className="text-white/30 text-xs">Ativos</p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredFotos.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
                <Upload size={24} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Nenhum ficheiro encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredFotos.map((foto) => {
                  const tipo = tipoConfig[foto.tipo] ?? tipoConfig.depois
                  const isVideo = foto.mediaType === 'video'
                  return (
                    <motion.div key={foto.id} layout
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative rounded-2xl overflow-hidden aspect-square group ${!foto.ativa ? 'opacity-50' : ''}`}
                    >
                      {isVideo ? (
                        <video
                          src={foto.url}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : foto.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={foto.url} alt={foto.label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-gold/30 to-golden/20" />
                      )}

                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <Play size={16} className="text-white ml-0.5" />
                          </div>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tipo.color} ${tipo.bg}`}>
                          {tipo.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-white/70">
                          {foto.label}
                        </span>
                        {isVideo && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/40 text-blue-200">
                            Vídeo
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleAtiva(foto.id, foto.ativa)}
                          className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
                          {foto.ativa ? <Eye size={11} className="text-white" /> : <EyeOff size={11} className="text-white/50" />}
                        </button>
                        <button onClick={() => deleteFoto(foto)}
                          className="w-7 h-7 rounded-lg bg-red-500/60 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/80 transition-colors">
                          <Trash2 size={11} className="text-white" />
                        </button>
                      </div>
                      {!foto.ativa && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <EyeOff size={18} className="text-white/40" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Meta selection modal */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-sm">
                  {pendingFiles.length} ficheiro(s) — {pendingFiles.some(f => f.type.startsWith('video/')) ? 'inclui vídeo(s)' : 'fotos'}
                </h3>
                <button onClick={() => setPendingFiles([])}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                  <X size={14} className="text-white/60" />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">Serviço</label>
                  <select value={uploadMeta.servico}
                    onChange={(e) => setUploadMeta((m) => ({ ...m, servico: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-rose-gold/50">
                    {Object.entries(servicoLabels).filter(([k]) => k !== 'todos').map(([k, l]) => (
                      <option key={k} value={k} className="bg-[#1A1A1A]">{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">Tipo</label>
                  <div className="flex gap-2">
                    {(['antes', 'depois'] as const).map((t) => (
                      <button key={t} onClick={() => setUploadMeta((m) => ({ ...m, tipo: t }))}
                        className={`flex-1 py-2 rounded-xl text-sm transition-colors capitalize ${
                          uploadMeta.tipo === t ? 'bg-rose-gold text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => processFiles(pendingFiles)}
                className="w-full bg-gradient-to-r from-rose-gold to-golden text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                Fazer Upload
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
