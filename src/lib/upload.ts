'use client'
import { supabase, getAccessToken } from '@/lib/supabase/client'

/**
 * Comprime e redimensiona uma imagem no browser ANTES do upload:
 * converte para WebP (q≈0.82) e limita o lado maior a `maxDim`px.
 * Reduz tipicamente 80–95% o peso (ex.: PNG de 5MB → ~300KB), o que acelera
 * muito o carregamento das páginas que mostram as fotos.
 * Vídeos, GIFs e SVGs passam INTACTOS. Se algo falhar — ou se não compensar —
 * devolve o ficheiro original, por isso nunca bloqueia nem corrompe um upload.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return file }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', quality),
    )
    // Mantém o original se a conversão falhou ou não reduziu o tamanho.
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^./\\]+$/, '') + '.webp'
    return new File([blob], name, { type: 'image/webp' })
  } catch {
    return file
  }
}

/**
 * Faz upload de um ficheiro para o Storage 'media' de forma robusta:
 * 0) comprime a imagem no browser (ver compressImage);
 * 1) pede ao servidor (service_role) um signed upload URL;
 * 2) envia o ficheiro DIRETAMENTE para o Storage com esse token.
 * Evita o problema de o Storage não aceitar o JWT ES256 do utilizador e
 * o limite de body das funções serverless. Devolve { url, path }.
 */
export async function uploadMedia(file: File, path: string): Promise<{ url: string; path: string }> {
  const optimized = await compressImage(file)

  const token = await getAccessToken()
  if (!token) throw new Error('Sessão expirada. Inicia sessão novamente.')

  const res = await fetch('/api/admin/upload-url', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error || `Falha ao preparar upload (${res.status})`)
  }
  const { token: uploadToken, path: finalPath, publicUrl } = await res.json()

  const { error } = await supabase.storage.from('media').uploadToSignedUrl(finalPath, uploadToken, optimized, {
    contentType: optimized.type || undefined,
  })
  if (error) throw new Error(error.message)

  return { url: publicUrl as string, path: finalPath as string }
}

/** Remove um ficheiro do Storage 'media' (via servidor/service_role). */
export async function deleteMedia(path: string): Promise<void> {
  if (!path) return
  const token = await getAccessToken()
  if (!token) return
  await fetch('/api/admin/upload-url', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  }).catch(() => {})
}
