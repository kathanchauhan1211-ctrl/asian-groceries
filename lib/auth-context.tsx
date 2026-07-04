'use client'

/**
 * lib/auth-context.tsx
 *
 * Firebase Authentication React Context.
 * Provides user state + helpers (signUp, signIn, signInWithGoogle, signOut)
 * to all client components.
 *
 * Wrap your app with <AuthProvider> in client-layout.tsx.
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { clientAuth } from '@/lib/firebase-client'

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: User | null
  loading: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function signUp(name: string, email: string, password: string) {
    const { user: newUser } = await createUserWithEmailAndPassword(clientAuth, email, password)
    // Set display name immediately
    await updateProfile(newUser, { displayName: name })
    setUser({ ...newUser, displayName: name } as User)
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(clientAuth, email, password)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(clientAuth, provider)
  }

  async function signOut() {
    await firebaseSignOut(clientAuth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
