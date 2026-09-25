import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { getAdminEmail } from '@/lib/admin-config'

/**
 * GET /api/admin/users
 *
 * Returns all user documents from the 'users' Firestore collection.
 * Uses the Firebase Admin SDK — bypasses client security rules entirely.
 * The caller must supply a valid admin Firebase ID token in the Authorization header.
 */
export async function GET(req: NextRequest) {
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

    // 2. Fetch all users via Admin SDK (bypasses Firestore rules)
    const listUsersResult = await auth.listUsers(1000);
    const authUsers = listUsersResult.users.map(u => ({
      id: u.uid,
      email: u.email,
      displayName: u.displayName,
      phone: u.phoneNumber,
      photoURL: u.photoURL,
      disabled: u.disabled,
      createdAt: u.metadata.creationTime,
      lastSignInTime: u.metadata.lastSignInTime
    }));

    const snap = await db.collection('users').get();
    const dbUsers = new Map(snap.docs.map(d => [d.id, d.data()]));

    const users = authUsers.map(u => ({
      ...u,
      ...(dbUsers.get(u.id) || {})
    }));

    return NextResponse.json({ users })
  } catch (err: any) {
    console.error('[GET /api/admin/users] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
