'use client'

/**
 * lib/auth-context.tsx
 *
 * Firebase Authentication React Context — STOREFRONT ONLY.
 *
 * Key rule: the admin account (ADMIN_EMAIL) is invisible to the storefront.
 * If the admin signs into Firebase, the storefront AuthProvider exposes user=null
 * so admin login never shows up as a customer session.
 *
 * The admin portal uses its own AdminAuthContext (lib/admin-auth-context.tsx)
 * but shares the SAME Firebase app/clientAuth so Firestore security rules work.
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
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { clientAuth, clientDb } from '@/lib/firebase-client'
import { ADMIN_EMAIL } from '@/lib/admin-config'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Result of Google sign-in: tells the UI whether the profile is already complete */
export type GoogleSignInResult = {
  profileComplete: boolean
  user: User
}

type AuthContextValue = {
  user: User | null        // always null for the admin account
  loading: boolean
  signUp: (
    firstName: string,
    surname: string,
    phone: string,
    email: string,
    password: string,
  ) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<GoogleSignInResult>
  signOut: () => Promise<void>
  updateUserProfile: (displayName: string) => Promise<void>
  completeGoogleProfile: (
    uid: string,
    firstName: string,
    surname: string,
    phone: string,
  ) => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Helper: write profile to Firestore ──────────────────────────────────────

async function saveUserProfile(
  uid: string,
  data: {
    firstName: string
    surname: string
    phone: string
    displayName: string
    email?: string | null
    photoURL?: string | null
  },
) {
  await setDoc(
    doc(clientDb, 'users', uid),
    { ...data, updatedAt: new Date().toISOString() },
    { merge: true },
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (firebaseUser) => {
      // Admin account is hidden from storefront — storefront sees null
      if (firebaseUser?.email === ADMIN_EMAIL) {
        setUser(null)
      } else {
        setUser(firebaseUser)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  /**
   * Sign up with email/password and save full profile to Firestore.
   */
  async function signUp(
    firstName: string,
    surname: string,
    phone: string,
    email: string,
    password: string,
  ) {
    const { user: newUser } = await createUserWithEmailAndPassword(clientAuth, email, password)
    const displayName = `${firstName.trim()} ${surname.trim()}`.trim()
    await updateProfile(newUser, { displayName })
    await saveUserProfile(newUser.uid, {
      firstName: firstName.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
      displayName,
      email: newUser.email,
      photoURL: newUser.photoURL,
    })
    setUser({ ...newUser, displayName } as User)
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(clientAuth, email, password)
  }

  /**
   * Google sign-in — returns profileComplete flag so UI can show completion step.
   */
  async function signInWithGoogle(): Promise<GoogleSignInResult> {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    const result = await signInWithPopup(clientAuth, provider)
    const { user: googleUser } = result

    // Check Firestore for existing profile
    const snap = await getDoc(doc(clientDb, 'users', googleUser.uid))
    const data = snap.exists() ? snap.data() : {}

    const profileComplete = Boolean(
      (data.firstName || googleUser.displayName) && data.phone,
    )

    // Seed Firestore on first Google sign-in
    if (!snap.exists() || !data.displayName) {
      const parts = (googleUser.displayName || '').split(' ')
      const firstName = parts[0] || ''
      const surname = parts.slice(1).join(' ') || ''
      await saveUserProfile(googleUser.uid, {
        firstName,
        surname,
        phone: data.phone || '',
        displayName: googleUser.displayName || '',
        email: googleUser.email,
        photoURL: googleUser.photoURL,
      })
    }

    return { profileComplete, user: googleUser }
  }

  /**
   * Called after the "Complete your profile" step for Google users.
   */
  async function completeGoogleProfile(
    uid: string,
    firstName: string,
    surname: string,
    phone: string,
  ) {
    const displayName = `${firstName.trim()} ${surname.trim()}`.trim()
    if (clientAuth.currentUser) {
      await updateProfile(clientAuth.currentUser, { displayName })
      setUser({ ...clientAuth.currentUser, displayName } as User)
    }
    await saveUserProfile(uid, {
      firstName: firstName.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
      displayName,
    })
  }

  async function signOut() {
    await firebaseSignOut(clientAuth)
  }

  async function updateUserProfile(displayName: string) {
    if (clientAuth.currentUser) {
      await updateProfile(clientAuth.currentUser, { displayName })
      setUser({ ...clientAuth.currentUser, displayName } as User)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        completeGoogleProfile,
      }}
    >
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
