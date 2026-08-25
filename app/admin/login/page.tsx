'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, signUp, signIn, signOut, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (user?.email === 'indianmarket@test.com') {
        // Already signed in as admin — go straight to portal
        router.replace('/admin')
      } else if (user && user.email !== 'indianmarket@test.com') {
        // Wrong account — sign out silently so admin can log in
        signOut()
      }
    }
  }, [user, authLoading, router, signOut])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    try {
      await signIn(email, password)
      if (email !== 'indianmarket@test.com') {
        setError('Access denied. Not an admin account.')
        setLoading(false)
        return
      }
      router.replace('/admin')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      // Auto-create admin account on first login
      if ((code === 'auth/user-not-found' || code === 'auth/invalid-credential') && email === 'indianmarket@test.com' && password === 'IndianMarket@#00') {
        try {
          await signUp('Admin', email, password)
          setSuccess('Admin account initialized! Redirecting...')
          setTimeout(() => router.replace('/admin'), 1000)
          return
        } catch { /* fall through */ }
      }
      const map: Record<string, string> = {
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Incorrect credentials.',
        'auth/too-many-requests': 'Too many attempts. Please wait.',
      }
      setError(map[code] || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: '#020617' }}>
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 shadow-lg shadow-orange-500/10">
            <ShieldCheck className="size-8 text-orange-400" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-400">God-Mode access — restricted entry</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Email</label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
                <Mail className="size-4 shrink-0 text-slate-500" />
                <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="indianmarket@test.com" autoComplete="email"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-password" className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
                <Lock className="size-4 shrink-0 text-slate-500" />
                <input id="admin-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-400">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>{success}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-400 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              {loading ? 'Authenticating…' : 'Enter Admin Portal'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Not the admin?{' '}
          <a href="/" className="text-slate-400 hover:text-white transition-colors">Return to storefront →</a>
        </p>
      </div>
    </div>
  )
}
