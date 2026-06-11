'use client'
import { supabase } from './supabase/client'
import { uploadMedia } from './upload'
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

/** Upload de foto para Supabase Storage (admin autenticado) + registo na BD. */
export async function uploadFoto(
  acompanhamentoId: string,
  file: File,
  diaIdx?: number
): Promise<Foto> {
  const path = `acompanhamentos/${acompanhamentoId}/${Date.now()}_${file.name}`
  const { url } = await uploadMedia(file, path)

  const { data, error } = await supabase
    .from('acompanhamento_fotos')
    .insert({ acompanhamento_id: acompanhamentoId, dia_idx: diaIdx ?? null, url, storage_path: path })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Falha ao registar foto')
  return rowToFoto(data)
}

export async function getFotosClient(acompanhamentoId: string): Promise<Foto[]> {
  const { data } = await supabase
    .from('acompanhamento_fotos')
    .select('*')
    .eq('acompanhamento_id', acompanhamentoId)
    .order('criado_em', { ascending: true })
  return (data ?? []).map(rowToFoto)
}
