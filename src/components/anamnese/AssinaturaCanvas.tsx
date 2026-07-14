'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser } from 'lucide-react'

interface Props {
  onChange: (dataUrl: string | null) => void
  cor?: string
}

/**
 * Área de assinatura simples: o cliente desenha com o rato ou o dedo.
 * Devolve um PNG (data URL) sempre que o traço muda, ou null quando está vazio.
 */
export default function AssinaturaCanvas({ onChange, cor = '#4a4a4a' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const ultimo = useRef<{ x: number; y: number } | null>(null)
  const temTraco = useRef(false)
  const [vazio, setVazio] = useState(true)

  const configurar = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, rect.width * ratio)
    canvas.height = Math.max(1, rect.height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = cor
  }, [cor])

  useEffect(() => {
    configurar()
    const onResize = () => {
      // Só reconfigura (limpa) se ainda não houver assinatura, para não apagar o traço.
      if (!temTraco.current) configurar()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [configurar])

  const posicao = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const iniciar = (e: React.PointerEvent) => {
    e.preventDefault()
    desenhando.current = true
    ultimo.current = posicao(e)
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {
      /* ignora */
    }
  }

  const mover = (e: React.PointerEvent) => {
    if (!desenhando.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !ultimo.current) return
    const p = posicao(e)
    ctx.beginPath()
    ctx.moveTo(ultimo.current.x, ultimo.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    ultimo.current = p
    if (!temTraco.current) {
      temTraco.current = true
      setVazio(false)
    }
  }

  const terminar = () => {
    if (!desenhando.current) return
    desenhando.current = false
    ultimo.current = null
    const url = temTraco.current ? canvasRef.current?.toDataURL('image/png') || null : null
    onChange(url)
  }

  const limpar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    temTraco.current = false
    setVazio(true)
    onChange(null)
  }

  return (
    <div>
      <div className="relative rounded-2xl border-2 border-dashed" style={{ borderColor: `${cor}55` }}>
        <canvas
          ref={canvasRef}
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerLeave={terminar}
          onPointerCancel={terminar}
          className="w-full h-44 touch-none rounded-2xl bg-white cursor-crosshair"
        />
        {vazio && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-gray-300 text-sm italic">Assine aqui com o dedo ou o rato</span>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={limpar}
          disabled={vazio}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
        >
          <Eraser size={13} /> Limpar
        </button>
      </div>
    </div>
  )
}
