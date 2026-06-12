import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// Buckets permitidos: 'media' é público (galeria, blog, serviços);
// 'acompanhamentos' é PRIVADO (fotos de clientes = dados de saúde).
const ALLOWED_BUCKETS = new Set(['media', 'acompanhamentos'])

function resolveBucket(raw: unknown): string | null {
  const bucket = typeof raw === 'string' && raw ? raw : 'media'
  return ALLOWED_BUCKETS.has(bucket) ? bucket : null
}

// Gera um signed upload URL (autorizado pelo service_role) para o browser enviar
// o ficheiro DIRETAMENTE para o Supabase Storage. Evita o problema do JWT ES256
// no Storage e o limite de 4.5MB de body das funções serverless.
export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const path = typeof body?.path === 'string' ? body.path : ''
  const bucket = resolveBucket(body?.bucket)
  if (!path) return NextResponse.json({ error: 'path em falta' }, { status: 400 })
  if (!bucket) return NextResponse.json({ error: 'bucket inválido' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: true })

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Falha a criar URL de upload' }, { status: 500 })
  }

  // Buckets privados não têm URL público — a leitura usa signed URLs (PUT).
  const publicUrl =
    bucket === 'media'
      ? supabaseAdmin().storage.from(bucket).getPublicUrl(path).data.publicUrl
      : ''
  return NextResponse.json({ token: data.token, path: data.path, publicUrl, bucket })
}

// Gera signed READ URLs para ficheiros de buckets privados (visualização admin).
export async function PUT(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const bucket = resolveBucket(body?.bucket)
  const paths: string[] = Array.isArray(body?.paths)
    ? body.paths.filter((p: unknown) => typeof p === 'string' && p).slice(0, 100)
    : []
  if (!bucket) return NextResponse.json({ error: 'bucket inválido' }, { status: 400 })
  if (paths.length === 0) return NextResponse.json({ urls: {} })

  const sb = supabaseAdmin()
  const urls: Record<string, string> = {}
  await Promise.all(
    paths.map(async (p) => {
      const { data } = await sb.storage.from(bucket).createSignedUrl(p, 60 * 60)
      if (data?.signedUrl) urls[p] = data.signedUrl
    })
  )
  return NextResponse.json({ urls })
}

// Remove um ficheiro do Storage (service_role).
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const path = typeof body?.path === 'string' ? body.path : ''
  const bucket = resolveBucket(body?.bucket)
  if (!path) return NextResponse.json({ error: 'path em falta' }, { status: 400 })
  if (!bucket) return NextResponse.json({ error: 'bucket inválido' }, { status: 400 })

  const { error } = await supabaseAdmin().storage.from(bucket).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
