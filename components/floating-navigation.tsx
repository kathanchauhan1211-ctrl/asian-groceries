'use client'

import { ShoppingBag, Bus, User, MessageSquare, Home, Globe } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { useState } from 'react'
import { SeamlessPattern } from './seamless-pattern'

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
      {/* Language Drawer */}
      {langDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setLangDrawerOpen(false)}
          />
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-sm rounded-3xl border-4 border-orange-500 bg-[#1A365D] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-white/50">Select Language</p>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.name}
                  onClick={() => { setActiveLang(lang.name); setLangDrawerOpen(false) }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                    activeLang === lang.name
                      ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-md shadow-orange-500/20'
                      : 'border-white/10 text-white hover:border-white/30 hover:bg-white/5'
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

      {/* Dynamic Island Navigation */}
      <div className="fixed z-40 pointer-events-none perspective-1000 bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-6 lg:translate-x-0 lg:w-auto lg:h-auto lg:px-0">
        <div className="animate-float-island relative lg:h-full flex items-center">
          
          {/* Animated Background Glow behind the island */}
          <div className="absolute -inset-1 rounded-[2.5rem] bg-orange-500/30 blur-2xl animate-pulse-glow z-0" />

          {/* Main Island Container */}
          <div 
            className="relative mx-auto flex flex-row lg:flex-col items-center justify-between lg:justify-center overflow-hidden rounded-[2rem] border-[3px] p-2 lg:p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(249,115,22,0.4)] backdrop-blur-md animate-pulse-glow lg:h-full"
            style={{ 
              backgroundColor: 'var(--im-navy, #1A365D)', 
              borderColor: 'var(--im-orange, #F97316)',
            }}
          >
            
            {/* Orange Decors embedded in the Island's background */}
            <SeamlessPattern 
              className="[&_g]:!fill-[var(--im-orange,#F97316)] transition-transform duration-1000 hover:scale-110" 
              opacity={0.15} 
            />

            <nav className="relative z-10 flex flex-row lg:flex-col w-full lg:w-auto lg:h-full items-center justify-around lg:justify-center gap-1 sm:gap-2 lg:gap-4">
              
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = item.href ? pathname === item.href : activeLangData.code !== 'EN'

                if (item.id === 'lang') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setLangDrawerOpen(true)}
                      className={`group flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-[1.5rem] transition-all duration-300 ease-out active:scale-90 relative z-10 overflow-hidden ${
                        langDrawerOpen 
                          ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)]' 
                          : 'bg-[var(--im-navy,#1A365D)] text-white/70 hover:text-white hover:bg-[var(--im-navy-mid,#1E3A8A)] hover:-translate-y-1'
                      }`}
                      aria-label="Select language"
                    >
                      <span className="text-xl leading-none transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{activeLangData.flag}</span>
                      <span className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{activeLangData.code}</span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    className={`group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-[1.5rem] transition-all duration-300 ease-out active:scale-90 z-10 overflow-hidden ${
                      isActive 
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-105' 
                        : 'bg-[var(--im-navy,#1A365D)] text-white/70 hover:text-white hover:bg-[var(--im-navy-mid,#1E3A8A)] hover:-translate-y-1'
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className={`size-5 sm:size-6 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 group-hover:-rotate-6'}`} />
                    <span className={`mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-white drop-shadow-sm' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                )
              })}

              {/* Cart Button in the Island */}
              <button
                onClick={() => setOpen(true)}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-[1.5rem] transition-all duration-300 ease-out active:scale-90 z-10 overflow-hidden ${
                  count > 0 
                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-105' 
                    : 'bg-[var(--im-navy,#1A365D)] text-white/70 hover:text-white hover:bg-[var(--im-navy-mid,#1E3A8A)] hover:-translate-y-1'
                }`}
                aria-label="Open cart"
              >
                <span className="relative">
                  <ShoppingBag className={`size-5 sm:size-6 transition-all duration-300 ${count > 0 ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 group-hover:rotate-6'}`} />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-orange-600 shadow-md animate-in zoom-in duration-300">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                <span className={`mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${count > 0 ? 'text-white drop-shadow-sm' : ''}`}>Cart</span>
              </button>
              
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}
