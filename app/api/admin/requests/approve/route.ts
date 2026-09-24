import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { getAdminEmail } from '@/lib/admin-config'

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin identity
    const authHeader = req.headers.get('authorization') ?? ''
    const idToken = authHeader.replace('Bearer ', '').trim()

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorised — missing token' }, { status: 401 })
    }

    const { auth, db } = getFirebaseAdmin()
    const decoded = await auth.verifyIdToken(idToken)

    if (decoded.email !== getAdminEmail()) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { requestId, request } = await req.json()

    if (!requestId || !request) {
      return NextResponse.json({ error: 'Missing request payload' }, { status: 400 })
    }

    const { type, userId, payload } = request

    if (type === 'DELETE_ACCOUNT') {
      await auth.deleteUser(userId)
      await db.collection('users').doc(userId).delete()
    } else if (type === 'CHANGE_EMAIL') {
      const newEmail = payload.newEmail
      if (!newEmail) throw new Error('Missing new email')
      await auth.updateUser(userId, { email: newEmail })
      // Keep firestore user doc updated if it stores email (optional, usually auth is source of truth)
    } else if (type === 'UPDATE_PROFILE') {
      await db.collection('users').doc(userId).set({
        firstName: payload.firstName,
        surname: payload.surname,
        phone: payload.phone,
        displayName: payload.displayName,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
      // Update auth profile display name too
      await auth.updateUser(userId, { displayName: payload.displayName })
    } else {
      return NextResponse.json({ error: 'Unknown request type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/admin/requests/approve] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
