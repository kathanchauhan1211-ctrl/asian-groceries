'use client'

import { Search, ShoppingBag, Flame, User, LogOut, ChevronDown, Globe, X, Menu, Home, Package, Users, ClipboardList } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/translation-context'
import { ORIGIN_FLAG, type Origin } from '@/lib/products'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export type Tab = 'shop' | 'checkout' | 'track' | 'dashboard' | 'community'

const ORIGINS: (Origin | 'All')[] = ['All', 'India', 'Pakistan', 'Sri Lanka']

const QUICK_FILTERS = [
  { label: 'Basmati Rice 5kg', query: 'basmati' },
  { label: 'Ashirvad Atta', query: 'atta' },
  { label: 'Everest Spices', query: 'everest' },
  { label: 'Chana Dal', query: 'chana' },
]

const CATEGORY_PILLS = [
  { label: '🌶️ Spices', query: 'Spices' },
  { label: '🌾 Rice & Grains', query: 'Rice & Grains' },
  { label: '🥟 Frozen Foods', query: 'Frozen Foods' },
  { label: '🍵 Tea & Drinks', query: 'Tea & Drinks' },
  { label: '🍬 Sweets', query: 'Sweets' },
]

const LANGUAGES = [
  { name: 'English', flag: '🇬🇧', code: 'EN' },
  { name: 'Lithuanian', flag: '🇱🇹', code: 'LT' },
  { name: 'Russian', flag: '🇷🇺', code: 'RU' },
  { name: 'Hindi', flag: '🇮🇳', code: 'HI' },
]

export function SiteHeader() {
  const { count, setOpen } = useCart()
  const { user, signOut } = useAuth()
  const { lang: activeLang, setLang: setActiveLang, t } = useTranslation()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchParams = useSearchParams()
  const pathname = usePathname()

  const query = searchParams.get('q') || ''
  const originParam = searchParams.get('origin') as Origin | 'All' | null
  const origin = originParam || 'All'
  const activeCategory = searchParams.get('category') || null

  const isShopPage = pathname === '/'

  const updateFilters = (updates: { q?: string; origin?: string; category?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (updates.q !== undefined) {
      if (updates.q) params.set('q', updates.q)
      else params.delete('q')
    }
    if (updates.origin !== undefined) {
      if (updates.origin !== 'All') params.set('origin', updates.origin)
      else params.delete('origin')
    }
    if (updates.category !== undefined) {
      if (updates.category) params.set('category', updates.category)
      else params.delete('category')
    }
    router.push(`/?${params.toString()}`)
  }

  const activeLangData = LANGUAGES.find(l => l.name === activeLang) || LANGUAGES[0]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/98 backdrop-blur-xl shadow-sm">
      {/* Formal orange top accent border */}
      <div className="h-[3px] bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">

        {/* ── Top Row: Logo + Search + Actions ── */}
        <div className="flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">

          {/* Brand Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 group" aria-label="Asian Groceries home">
            <span className="flex size-9 sm:size-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-accent/40 transition-all duration-300 overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="Asian Groceries logo"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
              />
            </span>
            {/* Brand name — hidden on very small screens to save space */}
            <span className="hidden xs:block sm:block leading-none">
              <span className="block font-serif text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-accent transition-colors">
                Asian Groceries
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 mt-0.5">
                Šaltinių g. 22, Vilnius
              </span>
            </span>
          </Link>

          {/* Search bar — grows to fill remaining space */}
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-200">
              <Search className="ml-2.5 size-4 shrink-0 text-slate-400" />
              <input
                id="site-search"
                value={query}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder={t('nav.searchPlaceholder') || 'Search rice, atta, spices…'}
                className="w-full bg-transparent px-2.5 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => updateFilters({ q: '' })}
                  className="mr-2 flex size-5 items-center justify-center rounded-full bg-slate-300 text-slate-600 hover:bg-slate-400 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-1.5">

            {/* Language Selector — desktop only inline; mobile in menu */}
            <div className="relative hidden md:block" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-accent/40 hover:bg-orange-50 transition-all duration-200 shadow-sm"
                aria-label="Select Language"
              >
                <span>{activeLangData.flag}</span>
                <span className="hidden lg:inline">{activeLangData.code}</span>
                <ChevronDown className={`size-3 text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-11 z-50 w-40 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
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
              className="relative flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-accent/40 hover:text-accent hover:bg-orange-50 transition-all duration-200 shadow-sm"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline text-sm">{t('nav.basket') || 'Basket'}</span>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm">
                  {count}
                </span>
              )}
            </button>

            {/* Auth — desktop */}
            <div className="hidden md:block">
              {!user ? (
                <Button
                  href="/auth"
                  variant="outline"
                  id="btn-header-login"
                  className="flex h-9 items-center gap-1.5 px-3 text-sm"
                >
                  <User className="size-4" />
                  <span className="hidden lg:inline">{t('nav.login') || 'Log In'}</span>
                </Button>
              ) : (
                <div className="relative" ref={profileRef}>
                  <button
                    id="btn-header-profile"
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white pl-1 pr-2.5 shadow-sm hover:border-accent/40 transition-all"
                    aria-label="Account menu"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <ChevronDown className={`size-3 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-11 z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
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

        {/* ── Category Pill Row + Quick Filters (horizontal scroll) ── */}
        <div className="flex flex-col gap-1.5 pb-2.5">
          {/* Popular quick filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Flame className="size-3 text-accent" /> Hot:
            </span>
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.label}
                onClick={() => updateFilters({ q: filter.query })}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200 ${
                  query === filter.query
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-accent/50 hover:text-accent'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Category pills — always visible */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = activeCategory === pill.query
              return (
                <button
                  key={pill.label}
                  onClick={() => updateFilters({ category: isActive ? null : pill.query })}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border-accent bg-accent text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent/50 hover:text-accent'
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>

          {/* Origin filter — desktop only inline, compact */}
          {isShopPage && (
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Origin:</span>
              {ORIGINS.map((o) => (
                <button
                  key={o}
                  onClick={() => updateFilters({ origin: o })}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all duration-200 ${
                    origin === o
                      ? 'border-accent bg-accent text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-accent/50 hover:text-accent'
                  }`}
                >
                  {o !== 'All' && <span aria-hidden>{ORIGIN_FLAG[o]}</span>}
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Mobile Lang + Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-5 py-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-slate-900">Language</h3>
              <button onClick={() => setMobileMenuOpen(false)} className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.name}
                  onClick={() => { setActiveLang(lang.name); setMobileMenuOpen(false) }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    activeLang === lang.name
                      ? 'border-accent bg-orange-50 text-orange-700 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:border-accent/40'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
