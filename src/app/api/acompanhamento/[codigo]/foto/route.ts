import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getAcompanhamentoPorCodigo,
  addFoto,
  getFotos,
} from '@/lib/acompanhamentos'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigo = (params.codigo || '').trim()
    if (!codigo) {
      return NextResponse.json({ error: 'Código em falta' }, { status: 400 })
    }

    const acomp = await getAcompanhamentoPorCodigo(codigo)
    if (!acomp || !acomp.id) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Ficheiro em falta' }, { status: 400 })
    }
    const diaIdxRaw = form.get('diaIdx')
    const diaIdx =
      diaIdxRaw != null && diaIdxRaw !== '' ? Number(diaIdxRaw) : undefined

    const path = `acompanhamentos/${acomp.id}/${Date.now()}_${file.name}`
    const sb = supabaseAdmin()
    const { error: upErr } = await sb.storage
      .from('media')
      .upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
    const { data: pub } = sb.storage.from('media').getPublicUrl(path)

    await addFoto(acomp.id, {
      url: pub.publicUrl,
      storagePath: path,
      diaIdx: Number.isFinite(diaIdx) ? diaIdx : undefined,
    })

    const fotos = await getFotos(acomp.id)
    return NextResponse.json({ ok: true, fotos })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('Erro no upload de foto:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
