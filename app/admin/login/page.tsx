'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, signIn, signOut, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  // If admin is already signed in → go to portal immediately
  useEffect(() => {
    if (!authLoading && user?.email === 'indianmarket@test.com') {
      router.replace('/admin')
    }
  }, [user, authLoading]) // eslint-disable-line

  // If a DIFFERENT (non-admin) user lands here → sign them out silently first
  useEffect(() => {
    if (!authLoading && user && user.email !== 'indianmarket@test.com') {
      setClearing(true)
      signOut().finally(() => setClearing(false))
    }
  }, [user?.uid, authLoading]) // eslint-disable-line — only run when uid changes

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email !== 'indianmarket@test.com') {
      setError('This portal is for the store owner only.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      // onAuthStateChanged will fire → useEffect above will redirect
    } catch (err: any) {
      const code = err?.code ?? ''
      const map: Record<string, string> = {
        'auth/wrong-password':       'Incorrect password.',
        'auth/invalid-credential':   'Incorrect email or password.',
        'auth/too-many-requests':    'Too many attempts. Please wait a moment.',
        'auth/user-not-found':       'No account found with this email.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      }
      setError(map[code] ?? 'Authentication failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Always show the login form — never a blank page.
  // Show a subtle spinner overlay while auth is resolving or clearing a wrong session.
  const showOverlay = authLoading || clearing

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4"
      style={{ background: '#080C14', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Auth loading overlay — never blank, always branded */}
      {showOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: '#080C14' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative size-10">
              <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(249,115,22,0.2)' }} />
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#F97316' }} />
            </div>
            <p className="text-sm" style={{ color: '#4B5563' }}>
              {clearing ? 'Preparing login…' : 'Checking session…'}
            </p>
          </div>
        </div>
      )}

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[360px]">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex size-14 items-center justify-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 8px 24px rgba(249,115,22,0.3)' }}
          >
            🌶️
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">IndianMarket</h1>
            <p className="mt-0.5 text-[13px]" style={{ color: '#4B5563' }}>Owner portal — restricted access</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                Email
              </label>
              <div
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Mail className="size-4 shrink-0" style={{ color: '#4B5563' }} />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  placeholder="indianmarket@test.com"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                Password
              </label>
              <div
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Lock className="size-4 shrink-0" style={{ color: '#4B5563' }} />
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="transition-colors"
                  style={{ color: '#4B5563' }}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg p-3 text-[12px]"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 4px 14px rgba(249,115,22,0.25)', marginTop: '8px' }}
            >
              {submitting
                ? <><Loader2 className="size-4 animate-spin" />Authenticating…</>
                : <><ArrowRight className="size-4" />Enter Portal</>
              }
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px]" style={{ color: '#374151' }}>
          Not the owner?{' '}
          <a href="/" className="transition-colors" style={{ color: '#6B7280' }}
            onMouseEnter={e => e.currentTarget.style.color = '#D1D5DB'}
            onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
          >
            Return to store →
          </a>
        </p>
      </div>
    </div>
  )
}
