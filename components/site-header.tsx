'use client'

import { Search, ShoppingBag, User, LogOut, ChevronDown, X, Sun, Moon, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/translation-context'
import { useTheme } from '@/lib/theme-context'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoSVG } from '@/components/logo-svg'
import { Switch } from '@/components/ui/switch-button'
import { useActiveOrder } from '@/lib/use-active-order'

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
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const { activeOrder } = useActiveOrder(user?.email)
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-focus search input when mobile search expands
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [searchOpen])

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
      className="sticky top-0 z-40 shadow-md border-b-[3px] border-orange-500 bg-white dark:bg-[#0B1120] transition-colors duration-300"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">

          {/* Brand Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 group" aria-label="IndianMarket home">
            <span className="flex shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-110">
              <LogoSVG size={36} />
            </span>
            <span className="hidden xs:block sm:block leading-none">
              <span className="block font-serif text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                IndianMarket
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mt-0.5">
                Šaltinių g. 22, Vilnius
              </span>
            </span>
          </Link>

          {/* Search bar — hidden on mobile (toggle below), visible md+ */}
          <div className="relative flex-1 min-w-0 hidden md:block">
            <div className="flex items-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/60 shadow-inner border border-transparent focus-within:border-orange-500/50 focus-within:bg-white dark:focus-within:bg-[#0B1120] focus-within:ring-2 focus-within:ring-orange-500/20 transition-all duration-200">
              <Search className="ml-3 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
              <input
                id="site-search"
                value={query}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder={t('nav.searchPlaceholder') || 'Search rice, atta, spices…'}
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {query && (
                <button
                  onClick={() => updateSearch('')}
                  className="mr-2 flex size-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">

            {/* Mobile search toggle — hidden on md+ */}
            <button
              className="flex md:hidden size-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Search"
            >
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </button>

            {/* Dark mode toggle */}
            {isMounted ? (
              <Switch
                value={theme === 'dark'}
                onToggle={toggleTheme}
                iconOn={<Moon className="size-3.5 text-orange-300" />}
                iconOff={<Sun className="size-3.5 text-orange-400" />}
              />
            ) : (
              <div className="w-12 h-6" /> // Placeholder to prevent layout shift
            )}

            {/* Language selector — visible on ALL devices */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                aria-label="Select Language"
              >
                <Globe className="size-4" />
                <span className="hidden sm:inline">{activeLangData.code}</span>
                <ChevronDown className={`size-3 text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.name}
                      onClick={() => { setActiveLang(lang.name); setLangOpen(false) }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        activeLang === lang.name
                          ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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

            {/* Active Order Tracking Pill */}
            {activeOrder && (
              <Link
                href={`/track?ticket=${activeOrder.ticketNum}`}
                className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/10 pl-2 pr-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all duration-300 mx-1"
              >
                <span className="text-sm leading-none">🚌</span>
                <span>{activeOrder.ticketNum}: <span className="opacity-80">{activeOrder.status}</span></span>
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={() => setOpen(true)}
              style={{ backgroundColor: (isMounted && count > 0) ? 'var(--im-orange, #F97316)' : undefined, color: (isMounted && count > 0) ? '#fff' : undefined }}
              className={`relative flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold transition-all duration-200 shadow-sm ${
                (isMounted && count > 0)
                  ? 'hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              aria-label={`Open cart, ${isMounted ? count : 0} items`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline text-sm">{t('nav.basket') || 'Basket'}</span>
              {isMounted && count > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white ring-1 ring-white/20">
                  {count}
                </span>
              )}
            </button>

            {/* Auth — visible on all screen sizes */}
            <div>
              {!user ? (
                <Link
                  href="/auth"
                  id="btn-header-login"
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 px-3 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white hover:border-orange-500 transition-all duration-200"
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
                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 pl-1.5 pr-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                    aria-label="Account menu"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--im-orange, #F97316)' }}>
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <ChevronDown className={`size-3 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-11 z-50 min-w-[190px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Signed in as</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          <User className="size-4" /> My Account
                        </Link>
                        <button
                          id="btn-sign-out"
                          type="button"
                          onClick={() => { signOut(); setProfileOpen(false) }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

      {/* Mobile expandable search bar \u2014 slides down when searchOpen */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out bg-white dark:bg-[#0B1120] ${searchOpen ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-3 pb-2.5">
          <div className="flex items-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/60 shadow-inner border border-transparent focus-within:border-orange-500/50 focus-within:bg-white dark:focus-within:bg-[#0B1120] focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
            <Search className="ml-3 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              id="site-search-mobile"
              value={query}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder={t('nav.searchPlaceholder') || 'Search rice, atta, spices…'}
              className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {query && (
              <button
                onClick={() => updateSearch('')}
                className="mr-2 flex size-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
