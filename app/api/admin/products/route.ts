import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

/**
 * POST /api/admin/products
 * Body: { action: 'delete', ids: string[] }
 *
 * Server-side admin route — uses Firebase Admin SDK so it bypasses
 * Firestore Security Rules entirely. The caller must provide a valid
 * Firebase ID token for the admin account (indianmarket@test.com).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify the caller is the admin
    const authHeader = req.headers.get('authorization') ?? ''
    const idToken = authHeader.replace('Bearer ', '')

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { auth, db } = getFirebaseAdmin()
    const decoded = await auth.verifyIdToken(idToken)

    if (decoded.email !== 'indianmarket@test.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse body
    const body = await req.json()
    const { action, ids } = body as { action: string; ids: string[] }

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    if (action === 'delete') {
      // Batch delete in groups of 450 (Firestore limit is 500)
      const BATCH_SIZE = 450
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = db.batch()
        ids.slice(i, i + BATCH_SIZE).forEach((id) => {
          batch.delete(db.collection('products').doc(id))
        })
        await batch.commit()
      }
      return NextResponse.json({ deleted: ids.length })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('/api/admin/products error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
