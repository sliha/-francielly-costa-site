'use client'
import { useState, useRef } from 'react'
import { Upload, Trash2, Eye, EyeOff, ImagePlus, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// TODO: Replace with Firestore + Firebase Storage — collection('galeria').orderBy('criadoEm', 'desc')
const mockFotos = [
  { id: '1', servico: 'microblading', tipo: 'depois', ativa: true, gradient: 'from-rose-gold/40 to-golden/20', label: 'Microblading' },
  { id: '2', servico: 'microblading', tipo: 'antes', ativa: true, gradient: 'from-golden/40 to-rose-gold/20', label: 'Microblading' },
  { id: '3', servico: 'microshading', tipo: 'depois', ativa: true, gradient: 'from-purple-500/30 to-rose-gold/20', label: 'Microshading' },
  { id: '4', servico: 'eyeliner', tipo: 'depois', ativa: false, gradient: 'from-sky-500/30 to-golden/20', label: 'Eyeliner' },
  { id: '5', servico: 'labial', tipo: 'depois', ativa: true, gradient: 'from-red-500/30 to-rose-gold/30', label: 'Labial' },
  { id: '6', servico: 'microshading', tipo: 'antes', ativa: true, gradient: 'from-emerald-500/20 to-golden/20', label: 'Microshading' },
  { id: '7', servico: 'microblading', tipo: 'depois', ativa: true, gradient: 'from-rose-gold/50 to-pink-500/20', label: 'Microblading' },
  { id: '8', servico: 'labial', tipo: 'antes', ativa: false, gradient: 'from-orange-500/30 to-golden/20', label: 'Labial' },
]

type Foto = typeof mockFotos[0]

const servicoLabels: Record<string, string> = {
  todos: 'Todos',
  microblading: 'Microblading',
  microshading: 'Microshading',
  eyeliner: 'Eyeliner',
  labial: 'Labial',
}

const tipoConfig = {
  antes: { label: 'Antes', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  depois: { label: 'Depois', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

export default function GaleriaPage() {
  const [fotos, setFotos] = useState<Foto[]>(mockFotos)
  const [filterServico, setFilterServico] = useState('todos')
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredFotos =
    filterServico === 'todos'
      ? fotos
      : fotos.filter((f) => f.servico === filterServico)

  const toggleAtiva = (id: string) => {
    // TODO: Update Firestore — updateDoc(doc(db, 'galeria', id), { ativa: !foto.ativa })
    setFotos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ativa: !f.ativa } : f))
    )
  }

  const deleteFoto = (id: string) => {
    // TODO: Delete from Firestore and Firebase Storage
    setFotos((prev) => prev.filter((f) => f.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // TODO: Handle file upload to Firebase Storage, then save metadata to Firestore
    simulateUpload()
  }

  const handleFileChange = () => {
    // TODO: Handle file upload to Firebase Storage
    simulateUpload()
  }

  const simulateUpload = async () => {
    setUploading(true)
    await new Promise((res) => setTimeout(res, 1200))
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Galeria</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {fotos.filter((f) => f.ativa).length} fotos ativas · {fotos.length} total
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-rose-gold bg-rose-gold/5 scale-[1.01]'
              : 'border-white/10 hover:border-white/20 hover:bg-white/2.5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">A carregar...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-rose-gold/10 flex items-center justify-center mx-auto mb-3">
                <ImagePlus size={22} className="text-rose-gold" />
              </div>
              <p className="text-white/70 text-sm font-medium mb-1">
                Arraste fotos ou clique para selecionar
              </p>
              <p className="text-white/30 text-xs">
                PNG, JPG, WEBP até 10MB cada
              </p>
            </>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="text-white/30 flex-shrink-0" />
          {Object.entries(servicoLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterServico(key)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
                filterServico === key
                  ? 'bg-rose-gold text-white'
                  : 'bg-white/5 text-white/40 hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Photo grid */}
        <AnimatePresence mode="popLayout">
          {filteredFotos.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center border border-white/5">
              <Upload size={28} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">Nenhuma foto encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredFotos.map((foto) => {
                const tipo = tipoConfig[foto.tipo as keyof typeof tipoConfig]
                return (
                  <motion.div
                    key={foto.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative rounded-2xl overflow-hidden aspect-square group ${
                      !foto.ativa ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Photo placeholder with gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${foto.gradient}`}
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tipo.color} ${tipo.bg}`}
                      >
                        {tipo.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white/70">
                        {foto.label}
                      </span>
                    </div>

                    {/* Action buttons — show on hover */}
                    <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleAtiva(foto.id)}
                        className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                        title={foto.ativa ? 'Desativar' : 'Ativar'}
                      >
                        {foto.ativa ? (
                          <Eye size={12} className="text-white" />
                        ) : (
                          <EyeOff size={12} className="text-white/50" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteFoto(foto.id)}
                        className="w-7 h-7 rounded-lg bg-red-500/60 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/80 transition-colors"
                        title="Apagar"
                      >
                        <Trash2 size={12} className="text-white" />
                      </button>
                    </div>

                    {/* Inactive indicator */}
                    {!foto.ativa && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <EyeOff size={20} className="text-white/40" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
