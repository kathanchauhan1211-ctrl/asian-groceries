import { NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { getAdminEmail } from '@/lib/admin-config'

export async function POST(req: Request) {
  try {
    const { auth: adminAuth, db: adminDb } = getFirebaseAdmin()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(token)

    // Verify admin
    if (decodedToken.email !== getAdminEmail()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, data } = await req.json()
    if (!userId || !data) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    const { displayName, phone, email, password } = data

    // 1. Update Firebase Auth (if email, displayName, or password provided)
    const authUpdate: any = {}
    if (email) authUpdate.email = email.trim()
    if (displayName) authUpdate.displayName = displayName.trim()
    if (password) authUpdate.password = password
    
    if (Object.keys(authUpdate).length > 0) {
      await adminAuth.updateUser(userId, authUpdate)
    }

    // 2. Update Firestore user document
    const dbUpdate: any = {}
    if (displayName) dbUpdate.displayName = displayName.trim()
    if (phone !== undefined) dbUpdate.phone = phone.trim()
    if (email) dbUpdate.email = email.trim()

    if (Object.keys(dbUpdate).length > 0) {
      await adminDb.collection('users').doc(userId).set(dbUpdate, { merge: true })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
