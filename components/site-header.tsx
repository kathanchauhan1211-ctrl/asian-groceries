'use client'

import { ShoppingBag, User, LogOut, ChevronDown, Sun, Moon, Globe, MapPin } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/translation-context'
import { useTheme } from '@/lib/theme-context'
import Link from 'next/link'
import { LogoSVG } from '@/components/logo-svg'
import { Switch } from '@/components/ui/switch-button'
import { useActiveOrder } from '@/lib/use-active-order'
import { Button } from '@/components/ui/button'
import { LiquidGlassBox } from '@/components/ui/liquid-glass-box'

export type Tab = 'shop' | 'checkout' | 'track' | 'dashboard' | 'community'

const LANGUAGES = [
  { name: 'English',    flag: '🇬🇧', code: 'EN' },
  { name: 'Lithuanian', flag: '🇱🇹', code: 'LT' },
  { name: 'Russian',    flag: '🇷🇺', code: 'RU' },
  { name: 'Hindi',      flag: '🇮🇳', code: 'HI' },
]

const ANNOUNCEMENTS = [
  '🚚  Free delivery on orders over €25',
  '📱  Order via WhatsApp: +370 616 76111',
  '📧  eshop@asiangroceries.lt  |  Mon–Sat 10:00–20:00',
  '🌿  Fresh Indian & Asian groceries in Vilnius',
]

// ── Announcement ticker ───────────────────────────────────────────────────────

function HeaderTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % ANNOUNCEMENTS.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden px-2">
      <span
        className="text-[11px] sm:text-xs font-semibold tracking-wide text-white/90 whitespace-nowrap select-none"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
        {ANNOUNCEMENTS[idx]}
      </span>
    </div>
  )
}

// ── Main header ───────────────────────────────────────────────────────────────

export function SiteHeader() {
  const { count, setOpen } = useCart()
  const { user, signOut } = useAuth()
  const { lang: activeLang, setLang: setActiveLang, t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { activeOrder } = useActiveOrder(user?.email)
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeLangData = LANGUAGES.find(l => l.name === activeLang) || LANGUAGES[0]

  return (
    <header
      className="sticky top-0 z-40 shadow-xl transition-colors duration-300 backdrop-blur-xl border-b"
      style={{ backgroundColor: 'rgba(62, 15, 58, 0.85)', borderColor: 'rgba(255,255,255,0.1)' }}
    >
      {/* ── Top accent bar + announcement ticker ────────────────────────────── */}
      <div
        className="border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(0,0,0,0.25)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 sm:px-4 md:px-6 py-1.5">
          {/* Store info — left */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <MapPin className="size-3 text-orange-400 shrink-0" />
            <span className="text-[11px] font-medium text-white/50">Saltiniµ g. 22, Vilnius</span>
          </div>

          {/* Animated ticker — center */}
          <HeaderTicker />

          {/* Hours — right */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-medium text-white/50">Mon–Sat 10:00–20:00</span>
          </div>
        </div>
      </div>

      {/* ── Main header row ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-3 py-4 sm:py-5">

          {/* Brand Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3 group" aria-label="IndianMarket home">
            <span
              className="flex shrink-0 items-center justify-center rounded-xl p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
              style={{ background: 'rgba(255,255,255,0.08)', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
            >
              <LogoSVG size={42} />
            </span>
            <span className="hidden xs:block sm:block leading-none">
              <span className="block font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-orange-300 transition-colors duration-200">
                IndianMarket
              </span>
              <span className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mt-0.5">
                Asian &amp; Indian Groceries
              </span>
            </span>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Nav links — desktop only */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: '/', label: 'Shop' },
              { href: '/track', label: 'Track Order' },
              { href: '/community', label: 'Community' },
              { href: '/dashboard', label: 'My Account' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px mx-1" style={{ background: 'rgba(255,255,255,0.12)' }} />

          {/* Controls group */}
          <div className="flex items-center gap-2">

            {/* Dark mode toggle */}
            {isMounted ? (
              <Switch
                value={theme === 'dark'}
                onToggle={toggleTheme}
                iconOn={<Moon className="size-3.5 text-orange-300" />}
                iconOff={<Sun className="size-3.5 text-orange-400" />}
              />
            ) : (
              <div className="w-12 h-6" />
            )}

            {/* Language selector */}
            <div className="relative" ref={langRef}>
              <Button
                type="button"
                variant="glass-dark"
                size="default"
                onClick={() => setLangOpen(!langOpen)}
                aria-label="Select Language"
                className="gap-1.5 px-3"
              >
                <Globe className="size-4" />
                <span className="hidden sm:inline text-xs font-semibold">{activeLangData.code}</span>
                <ChevronDown className={`size-3 text-white/50 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </Button>

              {langOpen && (
                <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden">
                  <LiquidGlassBox
                    className="rounded-xl"
                    style={{ backgroundColor: 'rgba(62, 15, 58, 0.95)' }}
                  >
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.name}
                        onClick={() => { setActiveLang(lang.name); setLangOpen(false) }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          activeLang === lang.name
                            ? 'bg-orange-500/20 text-orange-300 font-semibold'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        {lang.name}
                        {activeLang === lang.name && <span className="ml-auto text-orange-400">✓</span>}
                      </button>
                    ))}
                  </LiquidGlassBox>
                </div>
              )}
            </div>

            {/* Active Order Tracking Pill */}
            {activeOrder && (
              <Button
                href={`/track?ticket=${activeOrder.ticketNumber}`}
                variant="amber"
                size="sm"
                className="hidden md:flex rounded-full pl-2.5 pr-3.5"
              >
                <span className="text-sm leading-none">🚌</span>
                <span>{activeOrder.ticketNumber}: <span className="opacity-80">{activeOrder.status}</span></span>
              </Button>
            )}

            {/* Cart */}
            <Button
              onClick={() => setOpen(true)}
              variant={isMounted && count > 0 ? 'orange' : 'glass-dark'}
              size="default"
              className="gap-2 px-4"
              aria-label={`Open cart, ${isMounted ? count : 0} items`}
            >
              <ShoppingBag className="size-5" />
              <span className="hidden sm:inline text-sm">{t('nav.basket') || 'Basket'}</span>
              {isMounted && count > 0 && (
                <span className="flex min-w-[20px] h-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white ring-1 ring-white/20">
                  {count}
                </span>
              )}
            </Button>

            {/* Auth */}
            <div>
              {!user ? (
                <Button
                  href="/auth"
                  id="btn-header-login"
                  variant="orange"
                  size="default"
                  className="gap-2 px-4"
                >
                  <User className="size-5" />
                  <span className="hidden lg:inline">{t('nav.login') || 'Log In'}</span>
                </Button>
              ) : (
                <div className="relative" ref={profileRef}>
                  <Button
                    id="btn-header-profile"
                    type="button"
                    variant="glass-dark"
                    size="default"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="pl-2 pr-3 gap-2"
                    aria-label="Account menu"
                  >
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                      style={{ background: 'linear-gradient(135deg, var(--im-orange, #F97316), #ea580c)' }}
                    >
                      {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden sm:block text-[13px] font-semibold text-white/90 max-w-[90px] truncate">
                      {user.displayName?.split(' ')[0] ?? user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`size-3.5 text-white/50 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 z-50 min-w-[210px] overflow-hidden">
                      <LiquidGlassBox
                        className="rounded-xl"
                        style={{ backgroundColor: 'rgba(62, 15, 58, 0.95)' }}
                      >
                        {/* User info */}
                        <div className="border-b border-white/10 px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                              style={{ background: 'linear-gradient(135deg, var(--im-orange, #F97316), #ea580c)' }}
                            >
                              {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              {user.displayName && (
                                <p className="text-sm font-bold text-white leading-tight truncate">{user.displayName}</p>
                              )}
                              <p className="text-xs text-white/50 truncate mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-orange-300 transition-colors"
                          >
                            <User className="size-4" /> My Account
                          </Link>
                          <button
                            id="btn-sign-out"
                            type="button"
                            onClick={() => { signOut(); setProfileOpen(false) }}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="size-4" /> Sign Out
                          </button>
                        </div>
                      </LiquidGlassBox>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Bottom accent border ─────────────────────────────────────────────── */}
      <div className="h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
    </header>
  )
}
