/**
 * app/api/firebase-test/route.ts
 *
 * Test endpoint — verifies the Firebase Admin SDK can initialise and
 * reach Firestore. Remove or restrict this route before going to production.
 *
 * Usage: GET http://localhost:3000/api/firebase-test
 */

import { NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { db } = getFirebaseAdmin()

    // List up to 5 collections at the root — proves we have a live connection.
    const collections = await db.listCollections()
    const collectionIds = collections.map((c) => c.id)

    return NextResponse.json({
      status: 'connected',
      project: process.env.FIREBASE_PROJECT_ID,
      collections: collectionIds.length > 0 ? collectionIds : ['(no collections yet)'],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[firebase-test] Error:', message)

    // Firestore returns "5 NOT_FOUND" when the database hasn't been
    // provisioned yet in the Firebase Console. The SDK and credentials
    // are working — you just need to create the Firestore database.
    if (message.includes('NOT_FOUND')) {
      return NextResponse.json({
        status: 'sdk_connected',
        project: process.env.FIREBASE_PROJECT_ID,
        note: 'Admin SDK authenticated successfully. Firestore database not yet created — go to Firebase Console → Firestore Database → Create database.',
      })
    }

    return NextResponse.json({ status: 'error', message }, { status: 500 })
  }
}
