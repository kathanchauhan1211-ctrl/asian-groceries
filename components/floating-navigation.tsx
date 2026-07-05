'use client'

import { ShoppingBag, Bus, User, MessageSquare, Home, Globe } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { useState } from 'react'

const LANGUAGES = [
  { name: 'English', flag: '🇬🇧', code: 'EN' },
  { name: 'Lithuanian', flag: '🇱🇹', code: 'LT' },
  { name: 'Russian', flag: '🇷🇺', code: 'RU' },
  { name: 'Hindi', flag: '🇮🇳', code: 'HI' },
]

type Tab = 'shop' | 'track' | 'dashboard' | 'community'

type NavItem = {
  id: Tab | 'lang'
  href?: string
  label: string
  icon: any
}

const NAV_ITEMS: NavItem[] = [
  { id: 'shop', href: '/', label: 'Shop', icon: Home },
  { id: 'track', href: '/track', label: 'Track', icon: Bus },
  { id: 'dashboard', href: '/dashboard', label: 'Account', icon: User },
  { id: 'community', href: '/community', label: 'Community', icon: MessageSquare },
  { id: 'lang', label: 'Language', icon: Globe },
]

export function FloatingNavigation() {
  const pathname = usePathname()
  const { count, setOpen } = useCart()
  const { lang: activeLang, setLang: setActiveLang } = useTranslation()
  const [langDrawerOpen, setLangDrawerOpen] = useState(false)

  const activeLangData = LANGUAGES.find(l => l.name === activeLang) || LANGUAGES[0]

  return (
    <>
      {/* Language Drawer — slides up on mobile */}
      {langDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setLangDrawerOpen(false)}
          />
          <div className="absolute bottom-20 left-4 right-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-slate-500">Select Language</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.name}
                  onClick={() => { setActiveLang(lang.name); setLangDrawerOpen(false) }}
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

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-safe lg:hidden">
        <nav className="mx-auto flex max-w-lg items-stretch">
          {/* Cart — center prominent button */}
          <button
            onClick={() => setOpen(true)}
            className="relative flex flex-1 flex-col items-center justify-center py-2.5 text-slate-500 hover:text-accent transition-colors"
            aria-label="Open cart"
          >
            <span className="relative">
              <ShoppingBag className={`size-5 ${count > 0 ? 'text-accent' : ''}`} />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </span>
            <span className={`mt-0.5 text-[10px] font-semibold ${count > 0 ? 'text-accent' : ''}`}>Cart</span>
          </button>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.href ? pathname === item.href : activeLangData.code !== 'EN'

            if (item.id === 'lang') {
              return (
                <button
                  key={item.id}
                  onClick={() => setLangDrawerOpen(true)}
                  className="flex flex-1 flex-col items-center justify-center py-2.5 text-slate-500 hover:text-accent transition-colors"
                  aria-label="Select language"
                >
                  <span className="text-base leading-none">{activeLangData.flag}</span>
                  <span className="mt-0.5 text-[10px] font-semibold text-slate-500">{activeLangData.code}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`flex flex-1 flex-col items-center justify-center py-2.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label={item.label}
              >
                <Icon className={`size-5 ${isActive ? 'text-accent' : ''}`} />
                <span className={`mt-0.5 text-[10px] font-semibold ${isActive ? 'text-accent' : ''}`}>
                  {item.label}
                </span>
                {/* Active dot */}
                {isActive && (
                  <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-accent" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
