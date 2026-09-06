/**
 * lib/firebase-admin-client.ts
 *
 * A SEPARATE Firebase App instance used ONLY by the admin portal.
 *
 * Why a separate instance?
 * Firebase Auth is per-app, not per-tab or per-window. If admin and storefront
 * share the same Firebase app (clientApp), signing into the admin portal
 * replaces the storefront user session. By creating a second named app
 * ("admin-portal"), each has its own independent Auth state.
 *
 * This file is safe to import only in admin/* components.
 * Storefront components must continue to use lib/firebase-client.ts.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const ADMIN_APP_NAME = 'admin-portal'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// ── Named app singleton ────────────────────────────────────────────────────────
const adminApp: FirebaseApp =
  getApps().find(a => a.name === ADMIN_APP_NAME) ?? initializeApp(firebaseConfig, ADMIN_APP_NAME)

const adminPortalDb: Firestore = getFirestore(
  adminApp,
  process.env.NEXT_PUBLIC_FIREBASE_DB_NAME ?? 'indianmarket',
)

const adminPortalAuth: Auth = getAuth(adminApp)

export { adminApp, adminPortalDb, adminPortalAuth }
