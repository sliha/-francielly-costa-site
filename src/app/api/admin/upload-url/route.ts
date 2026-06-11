import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const BUCKET = 'media'

// Gera um signed upload URL (autorizado pelo service_role) para o browser enviar
// o ficheiro DIRETAMENTE para o Supabase Storage. Evita o problema do JWT ES256
// no Storage e o limite de 4.5MB de body das funções serverless.
export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { path } = await req.json().catch(() => ({ path: '' }))
  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'path em falta' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin()
    .storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true })

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Falha a criar URL de upload' }, { status: 500 })
  }

  const publicUrl = supabaseAdmin().storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return NextResponse.json({ token: data.token, path: data.path, publicUrl })
}

// Remove um ficheiro do Storage (service_role).
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { path } = await req.json().catch(() => ({ path: '' }))
  if (!path) return NextResponse.json({ error: 'path em falta' }, { status: 400 })

  const { error } = await supabaseAdmin().storage.from(BUCKET).remove([path])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
