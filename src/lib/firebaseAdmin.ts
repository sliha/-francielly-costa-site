import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let _app: App | null = null
let _initError: string | null = null

function getApp_(): App | null {
  if (_app) return _app
  if (_initError) return null

  if (getApps().length > 0) {
    _app = getApp()
    return _app
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    _initError = 'GOOGLE_SERVICE_ACCOUNT_KEY ausente em runtime'
    console.error(_initError)
    return null
  }

  let credentials: { project_id?: string; client_email?: string; private_key?: string }
  try {
    credentials = JSON.parse(raw)
  } catch (err) {
    _initError = `GOOGLE_SERVICE_ACCOUNT_KEY não é JSON válido: ${err instanceof Error ? err.message : String(err)}`
    console.error(_initError)
    return null
  }

  if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
    _initError = 'JSON da service account incompleto (project_id, client_email ou private_key em falta)'
    console.error(_initError)
    return null
  }

  try {
    _app = initializeApp({
      credential: cert({
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key.replace(/\\n/g, '\n'),
      }),
      projectId: credentials.project_id,
    })
    return _app
  } catch (err) {
    _initError = `Erro ao inicializar firebase-admin: ${err instanceof Error ? err.message : String(err)}`
    console.error(_initError)
    return null
  }
}

export function getAdminAuth(): Auth | null {
  const app = getApp_()
  if (!app) return null
  return getAuth(app)
}

export function getAdminDb(): Firestore | null {
  const app = getApp_()
  if (!app) return null
  return getFirestore(app)
}

export function getAdminInitError(): string | null {
  return _initError
}

/**
 * Verifica se o request tem um Firebase ID token válido com claim "admin".
 * Retorna { ok, uid } se autenticado e admin, senão { ok: false, error }.
 */
export async function verifyAdminRequest(req: Request): Promise<
  | { ok: true; uid: string; email?: string }
  | { ok: false; status: number; error: string }
> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return { ok: false, status: 401, error: 'Authorization Bearer token em falta' }
  }

  const auth = getAdminAuth()
  if (!auth) {
    return { ok: false, status: 500, error: getAdminInitError() || 'firebase-admin não inicializado' }
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    if (!decoded.admin) {
      return { ok: false, status: 403, error: 'Utilizador sem permissão admin' }
    }
    return { ok: true, uid: decoded.uid, email: decoded.email }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Token inválido'
    return { ok: false, status: 401, error: msg }
  }
}
