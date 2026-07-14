import 'server-only'
/**
 * Alertas operacionais da sincronização.
 * Tabela `alertas`, lida em real-time pelo AdminSideNav (badge vermelho).
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

export type AlertaTipo = 'sync_drift' | 'channel_expired' | 'multiple_failures'
export type AlertaSeveridade = 'critico' | 'aviso'

export interface Alerta {
  tipo: AlertaTipo
  severidade: AlertaSeveridade
  mensagem: string
  resolvido: boolean
  metadata?: Record<string, unknown>
}

// Anti-flood: não criar 2 alertas iguais em < 1h
const FLOOD_WINDOW_MS = 60 * 60 * 1000

export async function emitirAlerta(params: {
  tipo: AlertaTipo
  severidade: AlertaSeveridade
  mensagem: string
  metadata?: Record<string, unknown>
}): Promise<{ created: boolean; id?: string }> {
  const db = supabaseAdmin()

  // Já existe alerta do mesmo tipo, não resolvido, na última hora?
  try {
    const { data: recent } = await db
      .from('alertas')
      .select('id, criado_em')
      .eq('tipo', params.tipo)
      .eq('resolvido', false)
      .order('criado_em', { ascending: false })
      .limit(1)
    if (recent && recent.length > 0) {
      const lastMs = new Date(recent[0].criado_em).getTime()
      if (Date.now() - lastMs < FLOOD_WINDOW_MS) {
        return { created: false, id: recent[0].id }
      }
    }
  } catch {
    // ignorar e criar mesmo assim
  }

  try {
    const { data, error } = await db
      .from('alertas')
      .insert({
        tipo: params.tipo,
        severidade: params.severidade,
        mensagem: params.mensagem,
        resolvido: false,
        metadata: params.metadata ?? null,
      })
      .select('id')
      .single()
    if (error || !data) return { created: false }
    return { created: true, id: data.id }
  } catch (err) {
    console.warn('emitirAlerta falhou:', err)
    return { created: false }
  }
}

/**
 * Envia email para ADMIN_EMAILS via Resend.
 */
export async function notificarAdminsPorEmail(params: {
  subject: string
  htmlBody: string
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('RESEND_API_KEY ausente — alerta não enviado por email')
    return
  }
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  if (adminEmails.length === 0) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FC Alerts <noreply@franciellycosta.pt>',
        to: adminEmails,
        subject: params.subject,
        html: params.htmlBody,
      }),
    })
  } catch (err) {
    console.warn('Envio de email de alerta falhou:', err)
  }
}
