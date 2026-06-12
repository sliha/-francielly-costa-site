'use client'
import { supabase } from './supabase/client'
import { uploadMedia, getSignedUrls } from './upload'
import type { Mensagem, Foto } from './acompanhamentos'

const rowToMensagem = (r: Record<string, any>): Mensagem => ({
  id: r.id, de: r.de, texto: r.texto ?? '', criadoEm: r.criado_em ?? undefined,
})
const rowToFoto = (r: Record<string, any>): Foto => ({
  id: r.id, diaIdx: r.dia_idx ?? undefined, url: r.url ?? '', storagePath: r.storage_path ?? '', criadoEm: r.criado_em ?? undefined,
})

/**
 * Subscreve mensagens em tempo real (admin autenticado).
 * Faz fetch inicial + atualiza a cada INSERT via Supabase Realtime.
 */
export function subscribeMensagens(
  acompanhamentoId: string,
  callback: (msgs: Mensagem[]) => void
): () => void {
  const fetchAll = () =>
    supabase
      .from('acompanhamento_mensagens')
      .select('*')
      .eq('acompanhamento_id', acompanhamentoId)
      .order('criado_em', { ascending: true })
      .then(({ data }) => callback((data ?? []).map(rowToMensagem)))

  fetchAll()

  const channel = supabase
    .channel(`mensagens-${acompanhamentoId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'acompanhamento_mensagens', filter: `acompanhamento_id=eq.${acompanhamentoId}` },
      () => { fetchAll() }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

/**
 * Upload de foto para o bucket PRIVADO 'acompanhamentos' (admin autenticado)
 * + registo na BD. Fotos de clientes são dados de saúde — nunca em bucket público.
 */
export async function uploadFoto(
  acompanhamentoId: string,
  file: File,
  diaIdx?: number
): Promise<Foto> {
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const path = `acompanhamentos/${acompanhamentoId}/${safeName}`
  await uploadMedia(file, path, 'acompanhamentos')

  // url vazio assinala foto privada; a visualização resolve via signed URL.
  const { data, error } = await supabase
    .from('acompanhamento_fotos')
    .insert({ acompanhamento_id: acompanhamentoId, dia_idx: diaIdx ?? null, url: '', storage_path: path })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Falha ao registar foto')

  const foto = rowToFoto(data)
  const urls = await getSignedUrls([path])
  return { ...foto, url: urls[path] || '' }
}

export async function getFotosClient(acompanhamentoId: string): Promise<Foto[]> {
  const { data } = await supabase
    .from('acompanhamento_fotos')
    .select('*')
    .eq('acompanhamento_id', acompanhamentoId)
    .order('criado_em', { ascending: true })
  const fotos = (data ?? []).map(rowToFoto)

  // Fotos novas (url vazio) vivem no bucket privado → resolver signed URLs.
  const privadas = fotos.filter((f) => !f.url && f.storagePath).map((f) => f.storagePath)
  if (privadas.length > 0) {
    const urls = await getSignedUrls(privadas)
    return fotos.map((f) => (!f.url && urls[f.storagePath] ? { ...f, url: urls[f.storagePath] } : f))
  }
  return fotos
}
