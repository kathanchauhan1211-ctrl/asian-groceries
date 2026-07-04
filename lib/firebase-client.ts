/**
 * lib/firebase-client.ts
 *
 * Browser-safe Firebase Client SDK singleton.
 * Safe to import in Client Components ('use client').
 *
 * Analytics only runs in the browser (not during SSR).
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// ─── Singleton (avoids duplicate app warnings in Next.js dev hot-reload) ─────
const clientApp: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

const clientDb: Firestore = getFirestore(clientApp)
const clientAuth: Auth = getAuth(clientApp)

// Analytics only works in the browser — guard against SSR
let clientAnalytics: Analytics | null = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      clientAnalytics = getAnalytics(clientApp)
    }
  })
}

export { clientApp, clientDb, clientAuth, clientAnalytics }
