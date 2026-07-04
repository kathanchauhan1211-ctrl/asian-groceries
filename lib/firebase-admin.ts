/**
 * lib/firebase-admin.ts
 *
 * Server-only Firebase Admin SDK singleton.
 * Import this ONLY from server components, API routes, or Server Actions.
 * Never import it in client components — Next.js will throw a build error.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

// ─── Singleton references ────────────────────────────────────────────────────
let app: App
let db: Firestore
let auth: Auth

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    // The private key stored in .env.local uses literal \n sequences.
    // We replace them so the PEM parser gets real newlines.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error(
        '[firebase-admin] Missing required environment variables: ' +
          'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
      )
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })

    console.log('[firebase-admin] Initialized — project:', process.env.FIREBASE_PROJECT_ID)
  } else {
    app = getApps()[0]
  }

  db = getFirestore(app)
  auth = getAuth(app)

  return { app, db, auth }
}

export { getFirebaseAdmin }
