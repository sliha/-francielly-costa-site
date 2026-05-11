import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest, getAdminDb, getAdminInitError } from '@/lib/firebaseAdmin'
import { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getAdminDb()
  if (!db) return NextResponse.json({ error: getAdminInitError() || 'admin-sdk' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const operation = searchParams.get('operation') || ''
  const status = searchParams.get('status') || ''

  let q: FirebaseFirestore.Query = db.collection('syncLog').orderBy('timestamp', 'desc')
  if (operation) q = q.where('operation', '==', operation)
  if (status) q = q.where('status', '==', status)
  q = q.limit(limit)

  try {
    const snap = await q.get()
    const entries = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        ...data,
        timestamp: (data.timestamp as Timestamp)?.toMillis() ?? null,
        ttlExpiresAt: undefined,
      }
    })
    return NextResponse.json({ entries })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
