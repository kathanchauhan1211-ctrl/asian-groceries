'use client'

import { Search, ShoppingBag, User, LogOut, ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/translation-context'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoSVG } from '@/components/logo-svg'

export type Tab = 'shop' | 'checkout' | 'track' | 'dashboard' | 'community'

const LANGUAGES = [
  { name: 'English',    flag: '🇬🇧', code: 'EN' },
  { name: 'Lithuanian', flag: '🇱🇹', code: 'LT' },
  { name: 'Russian',    flag: '🇷🇺', code: 'RU' },
  { name: 'Hindi',      flag: '🇮🇳', code: 'HI' },
]


export function SiteHeader() {
  const { count, setOpen } = useCart()
  const { user, signOut } = useAuth()
  const { lang: activeLang, setLang: setActiveLang, t } = useTranslation()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const updateSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set('q', q); else params.delete('q')
    router.push(`/?${params.toString()}`)
  }

  const activeLangData = LANGUAGES.find(l => l.name === activeLang) || LANGUAGES[0]

  return (
    <header
      className="sticky top-0 z-40 shadow-lg shadow-black/30 border-b-4"
      style={{ backgroundColor: 'var(--im-navy, #1A365D)', borderColor: 'var(--im-orange, #F97316)' }}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">

          {/* Brand Logo — inline SVG, no white box */}
          <Link href="/" className="flex shrink-0 items-center gap-2 group" aria-label="IndianMarket home">
            <span className="flex shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-110">
              <LogoSVG size={36} />
            </span>
            <span className="hidden xs:block sm:block leading-none">
              <span className="block font-serif text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-orange-300 transition-colors duration-200">
                IndianMarket
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50 mt-0.5">
                Šaltinių g. 22, Vilnius
              </span>
            </span>
          </Link>

          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center overflow-hidden rounded-lg bg-white shadow-sm border-2 border-white/10 focus-within:border-orange-400/60 focus-within:ring-2 focus-within:ring-orange-400/20 transition-all duration-200">
              <Search className="ml-2.5 size-4 shrink-0 text-slate-400" />
              <input
                id="site-search"
                value={query}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder={t('nav.searchPlaceholder') || 'Search rice, atta, spices…'}
                className="w-full bg-transparent px-2.5 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => updateSearch('')}
                  className="mr-2 flex size-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">

            {/* Language selector */}
            <div className="relative hidden md:block" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex h-9 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200"
                aria-label="Select Language"
              >
                <span>{activeLangData.flag}</span>
                <span className="hidden lg:inline">{activeLangData.code}</span>
                <ChevronDown className={`size-3 text-white/50 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.name}
                      onClick={() => { setActiveLang(lang.name); setLangOpen(false) }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        activeLang === lang.name
                          ? 'bg-orange-50 text-orange-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      {lang.name}
                      {activeLang === lang.name && <span className="ml-auto text-orange-500">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => setOpen(true)}
              style={{ backgroundColor: count > 0 ? 'var(--im-orange, #F97316)' : undefined }}
              className={`relative flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold transition-all duration-200 shadow-sm ${
                count > 0
                  ? 'text-white hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline text-sm">{t('nav.basket') || 'Basket'}</span>
              {count > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white ring-1 ring-white/20">
                  {count}
                </span>
              )}
            </button>

            {/* Auth */}
            <div className="hidden md:block">
              {!user ? (
                <Link
                  href="/auth"
                  id="btn-header-login"
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-orange-400/50 bg-orange-500/10 px-3 text-sm font-semibold text-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200"
                >
                  <User className="size-4" />
                  <span className="hidden lg:inline">{t('nav.login') || 'Log In'}</span>
                </Link>
              ) : (
                <div className="relative" ref={profileRef}>
                  <button
                    id="btn-header-profile"
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-white/10 pl-1.5 pr-2.5 hover:bg-white/20 transition-all duration-200"
                    aria-label="Account menu"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--im-orange, #F97316)' }}>
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <ChevronDown className={`size-3 text-white/50 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-11 z-50 min-w-[190px] rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                          <User className="size-4" /> My Account
                        </Link>
                        <button
                          id="btn-sign-out"
                          type="button"
                          onClick={() => { signOut(); setProfileOpen(false) }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="size-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  )
}
