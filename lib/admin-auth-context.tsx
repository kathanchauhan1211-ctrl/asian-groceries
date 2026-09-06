'use client'

/**
 * lib/admin-auth-context.tsx
 *
 * Isolated authentication context for the admin portal ONLY.
 *
 * Uses a SEPARATE Firebase App ("admin-portal") so admin sign-in
 * never touches or replaces the storefront customer session.
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
      setUser(firebaseUser)
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
