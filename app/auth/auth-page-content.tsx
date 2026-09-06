'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2,
  ShoppingBag, AlertCircle, CheckCircle2, Phone, Shield,
  ChevronRight, X, Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { LogoSVG } from '@/components/logo-svg'
import type { User as FirebaseUser } from 'firebase/auth'

// ─── Google Icon SVG ─────────────────────────────────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const NAME_REGEX = /^[a-zA-ZÀ-žÀ-ÖØ-öø-ÿĄąČčĘęĖėĮįŠšŲųŪūŽžÀ-ÖØ-öø-ÿ\s'-]+$/u

function validateName(val: string): string | null {
  const v = val.trim()
  if (!v) return 'This field is required.'
  if (v.length < 2) return 'Must be at least 2 characters.'
  if (v.length > 50) return 'Must be 50 characters or fewer.'
  if (!NAME_REGEX.test(v)) return 'Only letters allowed — no numbers or special characters.'
  return null
}

// Known free email providers for friendly hints
const EMAIL_PROVIDERS: Record<string, string> = {
  'gmail.com': 'Gmail',
  'googlemail.com': 'Gmail',
  'yahoo.com': 'Yahoo Mail',
  'yahoo.co.uk': 'Yahoo Mail',
  'ymail.com': 'Yahoo Mail',
  'icloud.com': 'Apple iCloud',
  'me.com': 'Apple Mail',
  'mac.com': 'Apple Mail',
  'outlook.com': 'Outlook',
  'hotmail.com': 'Hotmail',
  'hotmail.co.uk': 'Hotmail',
  'live.com': 'Microsoft Live',
  'msn.com': 'MSN',
  'protonmail.com': 'ProtonMail',
  'proton.me': 'ProtonMail',
  'mail.ru': 'Mail.ru',
}

// Valid TLDs
const VALID_TLD = /\.(com|net|org|io|co|lt|lv|ee|eu|de|fr|uk|us|ru|info|biz|me|app|dev|ai|tech|store|shop|online|mail|email|pro|edu|gov|mil|int|tv|cc|gg|fi|no|se|dk|pl|cz|sk|hu|ro|bg|hr|si|rs|ua|kz|by|ge|am|az|tr|il|ae|sa|in|cn|jp|kr|au|nz|za|br|ar|mx|ca|es|it|pt|nl|be|ch|at|gr|ie|is|lu|cy|mt|lc|vc|bb|jm|tt|gd|ag|dm|kn)(\.[a-zA-Z]{2})?$/i

function validateEmail(val: string): { error: string | null; hint: string | null } {
  const v = val.trim()
  if (!v) return { error: 'Email is required.', hint: null }
  // Basic structure check
  const parts = v.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { error: 'Enter a valid email (e.g. name@gmail.com).', hint: null }
  }
  const domain = parts[1].toLowerCase()
  if (!domain.includes('.')) {
    return { error: 'Email must include a valid domain (e.g. @gmail.com).', hint: null }
  }
  if (!VALID_TLD.test('.' + domain.split('.').slice(1).join('.'))) {
    return { error: 'Email domain extension not recognised. Use a standard one (e.g. .com, .net, .org).', hint: null }
  }
  const provider = EMAIL_PROVIDERS[domain]
  return { error: null, hint: provider ? `${provider} address detected ✓` : null }
}

// Phone: strip non-digits and check length 7-15
function validatePhone(val: string): string | null {
  const stripped = val.replace(/\D/g, '')
  if (!val.trim()) return 'Phone number is required.'
  if (stripped.length < 7) return 'Phone number is too short.'
  if (stripped.length > 15) return 'Phone number is too long (max 15 digits).'
  return null
}

// ─── Password strength ─────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4

function getPasswordStrength(pwd: string): StrengthLevel {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[a-z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return 1
  if (score === 2) return 2
  if (score === 3) return 3
  return 4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong', 'Very Strong']
const STRENGTH_COLORS = [
  '',
  '#EF4444', // red — weak
  '#F59E0B', // amber — fair
  '#3B82F6', // blue — strong
  '#10B981', // green — very strong
]

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: strength >= lvl ? STRENGTH_COLORS[strength] : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <p
        className="text-[11px] font-semibold transition-colors duration-300"
        style={{ color: STRENGTH_COLORS[strength] }}
      >
        {STRENGTH_LABELS[strength]}
        {strength === 1 && ' — add uppercase, numbers & symbols'}
        {strength === 2 && ' — getting better, add more variety'}
        {strength === 3 && ' — good! Add a symbol to make it stronger'}
        {strength === 4 && ' — excellent password!'}
      </p>
    </div>
  )
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({
  id, label, type, value, onChange, onBlur, onFocus, placeholder,
  icon, showToggle, autoComplete, required, errorMsg, hint, children,
}: {
  id: string; label: string; type: string; value: string
  onChange: (v: string) => void; onBlur?: () => void; onFocus?: () => void
  placeholder: string; icon: React.ReactNode; showToggle?: boolean
  autoComplete?: string; required?: boolean
  errorMsg?: string | null; hint?: string | null
  children?: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  const inputType = showToggle ? (show ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-white/70 tracking-wide uppercase">
        {label}{required && <span className="text-orange-400 ml-0.5">*</span>}
      </label>
      <div
        className={[
          'group relative flex items-center overflow-hidden rounded-xl border transition-all duration-200',
          'bg-white/5 backdrop-blur-sm',
          errorMsg
            ? 'border-red-500/60 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]'
            : 'border-white/10 focus-within:border-orange-400/60 focus-within:shadow-[0_0_0_2px_rgba(251,146,60,0.15)]',
        ].join(' ')}
      >
        <span className="ml-3.5 shrink-0 text-white/30 group-focus-within:text-orange-400 transition-colors duration-200">
          {icon}
        </span>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 [&:-webkit-autofill]:bg-transparent"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="mr-3 shrink-0 text-white/30 hover:text-white/70 transition-colors"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {errorMsg && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-400">
          <AlertCircle className="size-3 shrink-0" />
          {errorMsg}
        </p>
      )}
      {hint && !errorMsg && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
          <Check className="size-3 shrink-0" />
          {hint}
        </p>
      )}
      {children}
    </div>
  )
}

// ─── Phone Field with country code ───────────────────────────────────────────

const COUNTRY_CODES = [
  { code: '+370', flag: '🇱🇹', label: 'LT' },
  { code: '+371', flag: '🇱🇻', label: 'LV' },
  { code: '+372', flag: '🇪🇪', label: 'EE' },
  { code: '+44',  flag: '🇬🇧', label: 'GB' },
  { code: '+49',  flag: '🇩🇪', label: 'DE' },
  { code: '+33',  flag: '🇫🇷', label: 'FR' },
  { code: '+34',  flag: '🇪🇸', label: 'ES' },
  { code: '+39',  flag: '🇮🇹', label: 'IT' },
  { code: '+48',  flag: '🇵🇱', label: 'PL' },
  { code: '+7',   flag: '🇷🇺', label: 'RU' },
  { code: '+380', flag: '🇺🇦', label: 'UA' },
  { code: '+91',  flag: '🇮🇳', label: 'IN' },
  { code: '+1',   flag: '🇺🇸', label: 'US' },
  { code: '+61',  flag: '🇦🇺', label: 'AU' },
]

function PhoneField({
  value, onChange, onBlur, errorMsg,
}: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; errorMsg?: string | null
}) {
  const [countryCode, setCountryCode] = useState('+370')
  const [localNumber, setLocalNumber] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Sync combined value upward
  useEffect(() => {
    onChange(localNumber ? `${countryCode} ${localNumber}` : '')
  }, [countryCode, localNumber])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = COUNTRY_CODES.find(c => c.code === countryCode) ?? COUNTRY_CODES[0]

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-white/70 tracking-wide uppercase">
        Mobile Number <span className="text-orange-400">*</span>
      </label>
      <div
        className={[
          'flex overflow-hidden rounded-xl border transition-all duration-200 bg-white/5 backdrop-blur-sm',
          errorMsg
            ? 'border-red-500/60 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]'
            : 'border-white/10 focus-within:border-orange-400/60 focus-within:shadow-[0_0_0_2px_rgba(251,146,60,0.15)]',
        ].join(' ')}
      >
        {/* Country code selector */}
        <div ref={ref} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-3 py-3 h-full border-r border-white/10 text-sm text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-base">{selected.flag}</span>
            <span className="text-xs font-bold text-white/70">{selected.code}</span>
            <ChevronRight className={`size-3 text-white/40 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 z-50 mt-1 w-44 rounded-xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto py-1">
                {COUNTRY_CODES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { setCountryCode(c.code); setOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/10 transition-colors ${c.code === countryCode ? 'text-orange-400 font-bold' : 'text-white/70'}`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span>{c.label}</span>
                    <span className="ml-auto text-white/40">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Number input */}
        <div className="flex flex-1 items-center">
          <Phone className="ml-3 size-4 shrink-0 text-white/30" />
          <input
            id="field-phone"
            type="tel"
            value={localNumber}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d\s()\-+]/g, '')
              setLocalNumber(digits)
            }}
            onBlur={onBlur}
            placeholder="e.g. 612 34567"
            autoComplete="tel"
            className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>
      </div>
      {errorMsg && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-400">
          <AlertCircle className="size-3 shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  )
}

// ─── Google Profile Completion Modal ─────────────────────────────────────────

function CompleteProfileStep({
  googleUser,
  onComplete,
  onCancel,
}: {
  googleUser: FirebaseUser
  onComplete: (firstName: string, surname: string, phone: string) => Promise<void>
  onCancel: () => void
}) {
  const nameParts = (googleUser.displayName || '').split(' ')
  const [firstName, setFirstName] = useState(nameParts[0] || '')
  const [surname, setSurname] = useState(nameParts.slice(1).join(' ') || '')
  const [phone, setPhone] = useState('')
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [surnameError, setSurnameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fnErr = validateName(firstName)
    const snErr = validateName(surname)
    const phErr = validatePhone(phone)
    setFirstNameError(fnErr)
    setSurnameError(snErr)
    setPhoneError(phErr)
    if (fnErr || snErr || phErr) return

    setSaving(true)
    try {
      await onComplete(firstName, surname, phone)
    } catch {
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

        <div className="p-7">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Complete your profile</h2>
              <p className="mt-1 text-sm text-white/50">
                We need a few more details to finish setting up your account.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="ml-4 shrink-0 rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Google account info */}
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            {googleUser.photoURL ? (
              <img src={googleUser.photoURL} alt="" className="size-9 rounded-full" />
            ) : (
              <div className="size-9 rounded-full bg-white/10 flex items-center justify-center">
                <User className="size-4 text-white/60" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{googleUser.displayName}</p>
              <p className="text-xs text-white/50 truncate">{googleUser.email}</p>
            </div>
            <div className="ml-auto shrink-0">
              <GoogleIcon size={18} />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="google-first-name"
                label="First Name"
                type="text"
                value={firstName}
                onChange={(v) => { setFirstName(v); if (firstNameError) setFirstNameError(validateName(v)) }}
                onBlur={() => setFirstNameError(validateName(firstName))}
                placeholder="e.g. Jonas"
                icon={<User className="size-4" />}
                autoComplete="given-name"
                required
                errorMsg={firstNameError}
              />
              <Field
                id="google-surname"
                label="Surname"
                type="text"
                value={surname}
                onChange={(v) => { setSurname(v); if (surnameError) setSurnameError(validateName(v)) }}
                onBlur={() => setSurnameError(validateName(surname))}
                placeholder="e.g. Kumar"
                icon={<User className="size-4" />}
                autoComplete="family-name"
                required
                errorMsg={surnameError}
              />
            </div>

            <PhoneField
              value={phone}
              onChange={setPhone}
              onBlur={() => setPhoneError(validatePhone(phone))}
              errorMsg={phoneError}
            />

            <button
              type="submit"
              disabled={saving}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {saving ? 'Saving…' : 'Complete Setup & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Password requirements checklist ─────────────────────────────────────────

function PasswordChecklist({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)', pass: /[a-z]/.test(password) },
    { label: 'Number (0–9)', pass: /[0-9]/.test(password) },
    { label: 'Special character (!@#$…)', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 grid grid-cols-1 gap-1">
      {checks.map(c => (
        <p key={c.label} className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${c.pass ? 'text-emerald-400' : 'text-white/30'}`}>
          <span className={`size-3 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${c.pass ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
            {c.pass ? <Check className="size-2 stroke-[3]" /> : null}
          </span>
          {c.label}
        </p>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signUp, signIn, signInWithGoogle, completeGoogleProfile } = useAuth()

  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab)

  // Signup fields
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Inline errors (shown after blur or on submit)
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [surnameError, setSurnameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailHint, setEmailHint] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  // Loading/feedback
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Google profile completion step
  const [googleCompletionUser, setGoogleCompletionUser] = useState<FirebaseUser | null>(null)

  // Show checklist
  const [showChecklist, setShowChecklist] = useState(false)

  useEffect(() => {
    if (user && !googleCompletionUser) router.replace('/')
  }, [user, router, googleCompletionUser])

  function clearForm() {
    setFirstName(''); setSurname(''); setPhone(''); setEmail('')
    setPassword(''); setConfirmPassword('')
    setError(null); setSuccess(null)
    setFirstNameError(null); setSurnameError(null); setPhoneError(null)
    setEmailError(null); setEmailHint(null)
    setPasswordError(null); setConfirmPasswordError(null)
  }

  function switchTab(t: 'login' | 'signup') { setTab(t); clearForm() }

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email. Try signing up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Incorrect email or password. Please check and try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups for this site.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.',
    }
    return map[code] || 'Something went wrong. Please try again.'
  }

  function validatePasswordField(pwd: string): string | null {
    if (!pwd) return 'Password is required.'
    if (pwd.length < 8) return 'Password must be at least 8 characters.'
    const strength = getPasswordStrength(pwd)
    if (strength < 2) return 'Password is too weak. Add uppercase letters, numbers or symbols.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)

    if (tab === 'signup') {
      // Run all validations
      const fnErr = validateName(firstName)
      const snErr = validateName(surname)
      const phErr = validatePhone(phone)
      const { error: emErr, hint: emHint } = validateEmail(email)
      const pwErr = validatePasswordField(password)
      const cpErr = password !== confirmPassword ? 'Passwords do not match.' : null

      setFirstNameError(fnErr)
      setSurnameError(snErr)
      setPhoneError(phErr)
      setEmailError(emErr)
      setEmailHint(emHint)
      setPasswordError(pwErr)
      setConfirmPasswordError(cpErr)

      if (fnErr || snErr || phErr || emErr || pwErr || cpErr) return
    } else {
      // Login: just check email + password present
      const { error: emErr } = validateEmail(email)
      if (emErr) { setEmailError(emErr); return }
      if (!password) { setPasswordError('Password is required.'); return }
    }

    setLoading(true)
    try {
      if (tab === 'signup') {
        await signUp(firstName, surname, phone, email, password)
        setSuccess('Account created! Welcome to IndianMarket 🎉')
        setTimeout(() => router.replace('/'), 1200)
      } else {
        await signIn(email, password)
        router.replace('/')
      }
    } catch (err: unknown) {
      setError(friendlyError((err as { code?: string }).code ?? ''))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null); setGoogleLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result.profileComplete) {
        router.replace('/')
      } else {
        // Show profile completion step
        setGoogleCompletionUser(result.user)
      }
    } catch (err: unknown) {
      setError(friendlyError((err as { code?: string }).code ?? ''))
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleGoogleProfileComplete(fn: string, sn: string, ph: string) {
    if (!googleCompletionUser) return
    await completeGoogleProfile(googleCompletionUser.uid, fn, sn, ph)
    setGoogleCompletionUser(null)
    router.replace('/')
  }

  return (
    <>
      {/* Dark animated background */}
      <div className="auth-dark-bg min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1528 40%, #111827 70%, #0f172a 100%)' }}>

        {/* Animated orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 -left-40 size-96 rounded-full opacity-20 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }} />
          <div className="absolute top-1/3 -right-32 size-80 rounded-full opacity-10 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)', animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 left-1/2 size-72 rounded-full opacity-10 blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)', animationDelay: '3s' }} />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-white/5 backdrop-blur-xl" style={{ background: 'rgba(10, 15, 30, 0.8)' }}>
          <div className="h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="flex items-center justify-center group-hover:scale-110 transition-all duration-200">
                <LogoSVG size={38} />
              </span>
              <span className="font-serif text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                IndianMarket
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-orange-400 transition-colors"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Back to Shop</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">

            {/* Glassmorphism card */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Gradient top strip */}
              <div className="h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

              <div className="px-6 pt-7 pb-8 sm:px-8">
                {/* Brand icon + title */}
                <div className="mb-7 text-center">
                  <div
                    className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(251,191,36,0.15))', border: '1px solid rgba(249,115,22,0.3)' }}
                  >
                    <ShoppingBag className="size-7 text-orange-400" />
                  </div>
                  <h1 className="font-serif text-2xl font-bold text-white">
                    {tab === 'login' ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p className="mt-1.5 text-sm text-white/40">
                    {tab === 'login'
                      ? 'Sign in to your IndianMarket account'
                      : 'Join us to order authentic Asian groceries'}
                  </p>
                </div>

                {/* Tab switcher */}
                <div
                  className="mb-6 flex rounded-xl p-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {(['login', 'signup'] as const).map((t) => (
                    <button
                      key={t}
                      id={`tab-${t}`}
                      type="button"
                      onClick={() => switchTab(t)}
                      className={[
                        'flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200',
                        tab === t
                          ? 'text-white shadow-md'
                          : 'text-white/40 hover:text-white/70',
                      ].join(' ')}
                      style={tab === t ? {
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.9), rgba(251,191,36,0.8))',
                        boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                      } : {}}
                    >
                      {t === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {/* Google button */}
                <button
                  id="btn-google-auth"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {googleLoading
                    ? <Loader2 className="size-5 animate-spin text-orange-400" />
                    : <GoogleIcon />}
                  {googleLoading ? 'Signing in…' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs font-semibold text-white/25 uppercase tracking-widest">or</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                  {/* Signup-only fields */}
                  {tab === 'signup' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          id="field-first-name"
                          label="First Name"
                          type="text"
                          value={firstName}
                          onChange={(v) => { setFirstName(v); if (firstNameError) setFirstNameError(validateName(v)) }}
                          onBlur={() => setFirstNameError(validateName(firstName))}
                          placeholder="e.g. Jonas"
                          icon={<User className="size-4" />}
                          autoComplete="given-name"
                          required
                          errorMsg={firstNameError}
                        />
                        <Field
                          id="field-surname"
                          label="Surname"
                          type="text"
                          value={surname}
                          onChange={(v) => { setSurname(v); if (surnameError) setSurnameError(validateName(v)) }}
                          onBlur={() => setSurnameError(validateName(surname))}
                          placeholder="e.g. Kumar"
                          icon={<User className="size-4" />}
                          autoComplete="family-name"
                          required
                          errorMsg={surnameError}
                        />
                      </div>

                      <PhoneField
                        value={phone}
                        onChange={setPhone}
                        onBlur={() => setPhoneError(validatePhone(phone))}
                        errorMsg={phoneError}
                      />
                    </>
                  )}

                  {/* Email */}
                  <Field
                    id="field-email"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(v) => {
                      setEmail(v)
                      if (emailError || emailHint) {
                        const { error: err, hint } = validateEmail(v)
                        setEmailError(err)
                        setEmailHint(hint)
                      }
                    }}
                    onBlur={() => {
                      const { error: err, hint } = validateEmail(email)
                      setEmailError(err)
                      setEmailHint(hint)
                    }}
                    placeholder="you@example.com"
                    icon={<Mail className="size-4" />}
                    autoComplete="email"
                    required
                    errorMsg={emailError}
                    hint={emailHint}
                  />

                  {/* Password */}
                  <Field
                    id="field-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(v) => {
                      setPassword(v)
                      if (passwordError) setPasswordError(validatePasswordField(v))
                    }}
                    onBlur={() => {
                      if (tab === 'signup') setPasswordError(validatePasswordField(password))
                      if (tab === 'signup') setShowChecklist(false)
                    }}
                    onFocus={() => { if (tab === 'signup') setShowChecklist(true) }}
                    placeholder={tab === 'signup' ? 'Create a strong password' : 'Your password'}
                    icon={<Lock className="size-4" />}
                    showToggle
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    required
                    errorMsg={passwordError}
                  >
                    {tab === 'signup' && (
                      <>
                        <PasswordStrengthBar password={password} />
                        {showChecklist && <PasswordChecklist password={password} />}
                      </>
                    )}
                  </Field>

                  {/* Confirm password (signup only) */}
                  {tab === 'signup' && (
                    <Field
                      id="field-confirm-password"
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(v) => {
                        setConfirmPassword(v)
                        if (confirmPasswordError) setConfirmPasswordError(v !== password ? 'Passwords do not match.' : null)
                      }}
                      onBlur={() => setConfirmPasswordError(confirmPassword !== password ? 'Passwords do not match.' : null)}
                      placeholder="Repeat your password"
                      icon={<Shield className="size-4" />}
                      showToggle
                      autoComplete="new-password"
                      required
                      errorMsg={confirmPasswordError}
                    />
                  )}

                  {/* Global error */}
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm text-red-400"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Success */}
                  {success && (
                    <div
                      role="status"
                      className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm text-emerald-400"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    id="btn-submit-auth"
                    type="submit"
                    disabled={loading || googleLoading}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                      boxShadow: '0 8px 24px rgba(249,115,22,0.35)',
                    }}
                  >
                    {loading
                      ? <Loader2 className="size-4 animate-spin" />
                      : <ArrowRight className="size-4" />}
                    {loading
                      ? (tab === 'signup' ? 'Creating account…' : 'Signing in…')
                      : (tab === 'signup' ? 'Create Account' : 'Log In')}
                  </button>
                </form>

                {/* Switch tab footer */}
                <p className="mt-6 text-center text-sm text-white/40">
                  {tab === 'login' ? (
                    <>Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchTab('signup')}
                        className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Sign up free
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* ToS */}
            <p className="mt-5 text-center text-xs text-white/20">
              By continuing, you agree to our{' '}
              <span className="font-medium text-white/35 hover:text-white/50 cursor-pointer transition-colors">Terms of Service</span>{' '}
              &amp;{' '}
              <span className="font-medium text-white/35 hover:text-white/50 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>

      {/* Google profile completion overlay */}
      {googleCompletionUser && (
        <CompleteProfileStep
          googleUser={googleCompletionUser}
          onComplete={handleGoogleProfileComplete}
          onCancel={() => setGoogleCompletionUser(null)}
        />
      )}
    </>
  )
}
