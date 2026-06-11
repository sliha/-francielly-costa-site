'use client'
import { supabase, getAccessToken } from '@/lib/supabase/client'

/**
 * Faz upload de um ficheiro para o Storage 'media' de forma robusta:
 * 1) pede ao servidor (service_role) um signed upload URL;
 * 2) envia o ficheiro DIRETAMENTE para o Storage com esse token.
 * Evita o problema de o Storage não aceitar o JWT ES256 do utilizador e
 * o limite de body das funções serverless. Devolve { url, path }.
 */
export async function uploadMedia(file: File, path: string): Promise<{ url: string; path: string }> {
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

  const { error } = await supabase.storage.from('media').uploadToSignedUrl(finalPath, uploadToken, file, {
    contentType: file.type || undefined,
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
