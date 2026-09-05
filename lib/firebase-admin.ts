/**
 * lib/firebase-admin.ts
 *
 * Server-only Firebase Admin SDK singleton.
 * Import this ONLY from server components, API routes, or Server Actions.
 * Never import it in client components — Next.js will throw a build error.
 *
 * Credential strategy:
 *  • Local dev  — uses explicit cert() from .env.local (FIREBASE_PRIVATE_KEY present)
 *  • App Hosting / Cloud Run — uses Application Default Credentials (ADC) automatically.
 *    The firebase-app-hosting-compute service account is already attached to the runtime
 *    and has Firebase Admin permissions — no private key secret needed.
 */

import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

// ─── Singleton references ────────────────────────────────────────────────────
let app: App
let db: Firestore
let auth: Auth

// The Firebase project ID — used for ADC path and logging
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'asian-groceries-c1b58'

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

    if (privateKey && clientEmail) {
      // ── Local development: explicit service-account credentials from .env.local ──
      app = initializeApp({
        credential: cert({
          projectId: PROJECT_ID,
          clientEmail,
          privateKey,
        }),
      })
      console.log('[firebase-admin] Initialized with explicit cert — project:', PROJECT_ID)
    } else {
      // ── Firebase App Hosting / Cloud Run: Application Default Credentials ──
      // The firebase-app-hosting-compute@<project>.iam.gserviceaccount.com service
      // account is automatically attached at runtime and has Firebase Admin access.
      // No secrets or env vars needed — ADC picks it up from the metadata server.
      app = initializeApp({
        credential: applicationDefault(),
        projectId: PROJECT_ID,
      })
      console.log('[firebase-admin] Initialized with ADC (App Hosting / Cloud Run) — project:', PROJECT_ID)
    }
  } else {
    app = getApps()[0]
  }

  db = getFirestore(app, 'indianmarket')
  auth = getAuth(app)

  return { app, db, auth }
}

export { getFirebaseAdmin }
