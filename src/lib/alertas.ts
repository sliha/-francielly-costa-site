/**
 * Alertas operacionais da sincronização.
 * Coleção `alertas`, lida em real-time pelo AdminSideNav (badge vermelho).
 */
import { getAdminDb } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export type AlertaTipo = 'sync_drift' | 'channel_expired' | 'multiple_failures'
export type AlertaSeveridade = 'critico' | 'aviso'

export interface Alerta {
  tipo: AlertaTipo
  severidade: AlertaSeveridade
  mensagem: string
  criadoEm: Timestamp
  resolvido: boolean
  metadata?: Record<string, unknown>
}

const COL = 'alertas'

// Anti-flood: não criar 2 alertas iguais em < 1h
const FLOOD_WINDOW_MS = 60 * 60 * 1000

export async function emitirAlerta(params: {
  tipo: AlertaTipo
  severidade: AlertaSeveridade
  mensagem: string
  metadata?: Record<string, unknown>
}): Promise<{ created: boolean; id?: string }> {
  const db = getAdminDb()
  if (!db) return { created: false }

  // Verificar se já existe alerta do mesmo tipo resolvido=false na última hora
  try {
    const recent = await db
      .collection(COL)
      .where('tipo', '==', params.tipo)
      .where('resolvido', '==', false)
      .orderBy('criadoEm', 'desc')
      .limit(1)
      .get()
    if (!recent.empty) {
      const last = recent.docs[0].data() as Alerta
      const lastMs = last.criadoEm.toMillis()
      if (Date.now() - lastMs < FLOOD_WINDOW_MS) {
        return { created: false, id: recent.docs[0].id }
      }
    }
  } catch {
    // Sem índice composto pode falhar — ignorar e criar mesmo assim
  }

  try {
    const ref = await db.collection(COL).add({
      tipo: params.tipo,
      severidade: params.severidade,
      mensagem: params.mensagem,
      criadoEm: Timestamp.now(),
      resolvido: false,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    } satisfies Omit<Alerta, never>)
    return { created: true, id: ref.id }
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
        from: 'FC Alerts <noreply@franciellycosta.com>',
        to: adminEmails,
        subject: params.subject,
        html: params.htmlBody,
      }),
    })
  } catch (err) {
    console.warn('Envio de email de alerta falhou:', err)
  }
}
