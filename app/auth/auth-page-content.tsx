'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// ─── Google Icon SVG ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

// ─── Field Input ─────────────────────────────────────────────────────────────
interface FieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
  showToggle?: boolean
  autoComplete?: string
  required?: boolean
}

function Field({ id, label, type, value, onChange, placeholder, icon, showToggle, autoComplete, required }: FieldProps) {
  const [show, setShow] = useState(false)
  const inputType = showToggle ? (show ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="group relative flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20 transition-all duration-200">
        <span className="ml-3.5 shrink-0 text-slate-400 group-focus-within:text-orange-500 transition-colors">
          {icon}
        </span>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="mr-3 shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signUp, signIn, signInWithGoogle } = useAuth()

  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  function clearForm() {
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(null)
  }

  function switchTab(t: 'login' | 'signup') {
    setTab(t)
    clearForm()
  }

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email. Try signing up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Incorrect email or password. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
    }
    return map[code] || 'Something went wrong. Please try again.'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (tab === 'signup') {
      if (name.trim().length < 2) {
        setError('Please enter your full name.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    try {
      if (tab === 'signup') {
        await signUp(name.trim(), email, password)
        setSuccess('Account created! Welcome to Asian Groceries 🎉')
        setTimeout(() => router.replace('/'), 1200)
      } else {
        await signIn(email, password)
        router.replace('/')
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(friendlyError(code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      router.replace('/')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(friendlyError(code))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">

      {/* ── Top brand bar ── */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="h-[4px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden group-hover:border-orange-400 transition-colors">
              <img src="/logo.png" alt="Asian Groceries" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} />
            </span>
            <span className="font-serif text-lg font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
              Asian Groceries
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-orange-500 transition-colors">
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Back to Shop</span>
          </Link>
        </div>
      </div>

      {/* ── Main centered card ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Decorative floating elements */}
          <div className="absolute -z-10 left-1/4 top-1/4 size-64 rounded-full bg-orange-200/30 blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute -z-10 right-1/4 bottom-1/4 size-48 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" aria-hidden />

          {/* Card */}
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">

            {/* Orange accent top border */}
            <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

            <div className="px-6 pt-7 pb-8 sm:px-8">

              {/* Header */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 shadow-sm">
                  <ShoppingBag className="size-7 text-orange-500" />
                </div>
                <h1 className="font-serif text-2xl font-bold text-slate-900">
                  {tab === 'login' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  {tab === 'login'
                    ? 'Sign in to your Asian Groceries account'
                    : 'Join us to order authentic South Asian groceries'}
                </p>
              </div>

              {/* Tab switcher */}
              <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  id="tab-login"
                  type="button"
                  onClick={() => switchTab('login')}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
                    tab === 'login'
                      ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Log In
                </button>
                <button
                  id="tab-signup"
                  type="button"
                  onClick={() => switchTab('signup')}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
                    tab === 'signup'
                      ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Google button */}
              <button
                id="btn-google-auth"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="size-5 animate-spin text-orange-500" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? 'Signing in…' : `Continue with Google`}
              </button>

              {/* Divider */}
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                {tab === 'signup' && (
                  <Field
                    id="field-name"
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Your full name"
                    icon={<User className="size-4" />}
                    autoComplete="name"
                    required
                  />
                )}

                <Field
                  id="field-email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  icon={<Mail className="size-4" />}
                  autoComplete={tab === 'login' ? 'email' : 'email'}
                  required
                />

                <Field
                  id="field-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'}
                  icon={<Lock className="size-4" />}
                  showToggle
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  required
                />

                {tab === 'signup' && (
                  <Field
                    id="field-confirm-password"
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat your password"
                    icon={<Lock className="size-4" />}
                    showToggle
                    autoComplete="new-password"
                    required
                  />
                )}

                {/* Error / Success messages */}
                {error && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div role="status" className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="btn-submit-auth"
                  type="submit"
                  disabled={loading || googleLoading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-300 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {loading
                    ? tab === 'signup' ? 'Creating account…' : 'Signing in…'
                    : tab === 'signup' ? 'Create Account' : 'Log In'}
                </button>
              </form>

              {/* Bottom link */}
              <p className="mt-6 text-center text-sm text-slate-500">
                {tab === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('signup')}
                      className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Trust signals */}
          <p className="mt-5 text-center text-xs text-slate-400">
            By continuing, you agree to our{' '}
            <span className="font-medium text-slate-500">Terms of Service</span> &amp;{' '}
            <span className="font-medium text-slate-500">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}
