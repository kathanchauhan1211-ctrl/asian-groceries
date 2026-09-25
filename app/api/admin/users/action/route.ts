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

    const { userId, action } = await req.json()
    if (!userId || !action) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    if (action === 'delete') {
      await adminAuth.deleteUser(userId)
      await adminDb.collection('users').doc(userId).delete()
      return NextResponse.json({ success: true, message: 'User deleted' })
    }

    if (action === 'suspend') {
      await adminAuth.updateUser(userId, { disabled: true })
      await adminDb.collection('users').doc(userId).set({ status: 'suspended' }, { merge: true })
      return NextResponse.json({ success: true, message: 'User suspended' })
    }

    if (action === 'ban') {
      await adminAuth.updateUser(userId, { disabled: true })
      await adminDb.collection('users').doc(userId).set({ status: 'banned' }, { merge: true })
      return NextResponse.json({ success: true, message: 'User banned' })
    }
    
    if (action === 'activate') {
      await adminAuth.updateUser(userId, { disabled: false })
      await adminDb.collection('users').doc(userId).set({ status: 'active' }, { merge: true })
      return NextResponse.json({ success: true, message: 'User activated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error updating user status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
