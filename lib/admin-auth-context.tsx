'use client'

/**
 * lib/admin-auth-context.tsx
 *
 * Authentication context for the ADMIN PORTAL ONLY.
 *
 * Uses the SEPARATE adminPortalAuth (named "admin-portal" Firebase app) so
 * that logging in as admin NEVER displaces a storefront customer session.
 * Both apps talk to the same Firebase project and Firestore database;
 * Firestore security rules (isAdmin() checks) still work because the token
 * email is the same — it's just issued from an isolated app instance.
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
import { adminPortalAuth } from '@/lib/firebase-admin-client'
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
    const unsubscribe = onAuthStateChanged(adminPortalAuth, (firebaseUser) => {
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
    await signInWithEmailAndPassword(adminPortalAuth, email, password)
  }

  async function signOut() {
    await firebaseSignOut(adminPortalAuth)
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
