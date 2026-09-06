'use client'

/**
 * lib/admin-auth-context.tsx
 *
 * Authentication context for the ADMIN PORTAL ONLY.
 *
 * Uses the SAME clientAuth (same Firebase app) as the storefront so that
 * Firestore security rules (isAdmin() checks) work correctly with the
 * admin's auth token.
 *
 * The storefront AuthProvider filters out the admin user (user=null when
 * email === ADMIN_EMAIL), so admin login is invisible to the storefront UI.
 *
 * Import useAdminAuth() in admin/* components instead of useAuth().
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  type User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { clientAuth } from '@/lib/firebase-client'
import { ADMIN_EMAIL } from '@/lib/admin-config'

// ─── Types ───────────────────────────────────────────────────────────────────

type AdminAuthContextValue = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (firebaseUser) => {
      // Admin context only exposes the admin account — others are null here
      if (firebaseUser?.email === ADMIN_EMAIL) {
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(clientAuth, email, password)
  }

  async function signOut() {
    await firebaseSignOut(clientAuth)
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
