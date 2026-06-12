import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getAcompanhamentoPorCodigo,
  addFoto,
  getFotos,
  resolverFotosUrls,
  ACOMP_BUCKET,
} from '@/lib/acompanhamentos'
import {
  isBlocked,
  registerFailure,
  rateLimit,
  getClientIp,
  tooManyRequests,
} from '@/lib/rateLimit'

export const runtime = 'nodejs'

const FAIL_LIMIT = 10
const FAIL_WINDOW_MS = 15 * 60 * 1000
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

// Só imagens; a extensão do ficheiro é derivada do MIME (nunca do nome enviado).
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export async function POST(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const ip = getClientIp(req)
  const blocked = isBlocked(`acomp-fail:${ip}`, FAIL_LIMIT, FAIL_WINDOW_MS)
  if (!blocked.ok) return tooManyRequests(blocked.retryAfterSeconds)

  // Mesmo com código válido, limitar volume de uploads (10 / 10 min por IP).
  const rl = rateLimit(`acomp-foto:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds)

  try {
    const codigo = (params.codigo || '').trim()
    if (!codigo || codigo.length > 32) {
      return NextResponse.json({ error: 'Código em falta' }, { status: 400 })
    }

    const acomp = await getAcompanhamentoPorCodigo(codigo)
    if (!acomp || !acomp.id) {
      registerFailure(`acomp-fail:${ip}`, FAIL_WINDOW_MS)
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Ficheiro em falta' }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato não suportado. Envie uma fotografia (JPG, PNG, WebP ou HEIC).' },
        { status: 415 }
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: 'Fotografia demasiado grande (máx. 8 MB).' },
        { status: 413 }
      )
    }

    const diaIdxRaw = form.get('diaIdx')
    const diaIdx =
      diaIdxRaw != null && diaIdxRaw !== '' ? Number(diaIdxRaw) : undefined

    // Nome gerado no servidor — o nome original do ficheiro nunca entra no path.
    const path = `acompanhamentos/${acomp.id}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
    const sb = supabaseAdmin()
    const { error: upErr } = await sb.storage
      .from(ACOMP_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type })
    if (upErr) {
      console.error('Erro no upload para storage:', upErr.message)
      return NextResponse.json({ error: 'Erro ao guardar a fotografia' }, { status: 500 })
    }

    // url vazio = foto no bucket privado; a visualização usa signed URLs.
    await addFoto(acomp.id, {
      url: '',
      storagePath: path,
      diaIdx: Number.isFinite(diaIdx) ? diaIdx : undefined,
    })

    const fotos = await resolverFotosUrls(await getFotos(acomp.id))
    return NextResponse.json({ ok: true, fotos })
  } catch (err) {
    console.error('Erro no upload de foto:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
