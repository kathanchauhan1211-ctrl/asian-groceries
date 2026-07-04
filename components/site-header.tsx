'use client'

import { Search, ShoppingBag, Flame, User, LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
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
  { label: 'Spices', query: 'Spices' },
  { label: 'Rice & Grains', query: 'Rice & Grains' },
  { label: 'Frozen Foods', query: 'Frozen Foods' },
  { label: 'Tea & Drinks', query: 'Tea & Drinks' },
  { label: 'Sweets', query: 'Sweets' },
]

export function SiteHeader() {
  const { count, setOpen } = useCart()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      {/* Formal orange top accent border */}
      <div className="h-[4px] bg-accent" />

      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 text-left group"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-accent/40 transition-all duration-300 overflow-hidden">
              <img
                src="/logo.png"
                alt="Asian Groceries logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block font-serif text-lg font-bold tracking-tight text-slate-900 group-hover:text-accent transition-colors">
                Asian Groceries
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 mt-0.5">
                Šaltinių g. 22, Vilnius
              </span>
            </span>
          </Link>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xl">
            <div className="flex items-center overflow-hidden rounded-md border border-slate-300 bg-slate-50 shadow-inner focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50 focus-within:shadow-md transition-all duration-300">
              <Search className="ml-3 size-4 shrink-0 text-slate-500" />
              <input
                id="site-search"
                value={query}
                onChange={(e) => updateFilters({ q: e.target.value })}
                placeholder="Search rice, atta, spices, lentils…"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500"
              />
              {query && (
                <button
                  onClick={() => updateFilters({ q: '' })}
                  className="mr-3 text-xs text-slate-500 hover:text-slate-900 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Cart + Auth triggers */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOpen(true)}
              className="relative h-10 shrink-0 rounded-md px-4 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-all duration-300 hover:border-accent hover:text-accent shadow-sm"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden md:inline font-medium">Basket</span>
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm animate-in zoom-in-50">
                  {count}
                </span>
              )}
            </Button>

            {/* Auth: logged-out → Login button | logged-in → avatar dropdown */}
            {!user ? (
              <Link
                href="/auth"
                id="btn-header-login"
                className="flex h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-accent hover:text-accent transition-all duration-200"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">Log In</span>
              </Link>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  id="btn-header-profile"
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white pl-1 pr-2.5 shadow-sm hover:border-accent/50 transition-all duration-200"
                  aria-label="Account menu"
                >
                  {/* Avatar circle */}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:block max-w-[100px] truncate text-sm font-medium text-slate-700">
                    {user.displayName ?? user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
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

        {/* Quick filters row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mt-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0">
            <Flame className="size-3.5 text-accent" /> Popular:
          </span>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.label}
              onClick={() => updateFilters({ q: filter.query })}
              className="rounded-md bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:text-accent hover:border-accent/40 hover:bg-white transition-all duration-200 shrink-0 shadow-sm"
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Category Pill row & Origin Filter row */}
        {isShopPage && (
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-200 mt-1">
            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_PILLS.map((pill) => {
                const isActive = activeCategory === pill.query
                return (
                  <button
                    key={pill.label}
                    onClick={() => updateFilters({ category: isActive ? null : pill.query })}
                    className={`flex items-center gap-1 rounded-md border px-4 py-1.5 text-sm font-semibold transition-all duration-200 shrink-0 shadow-sm ${
                      isActive
                        ? 'border-accent bg-accent text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-accent/50 hover:text-accent'
                    }`}
                  >
                    {pill.label}
                  </button>
                )
              })}
            </div>

            {/* Origin buttons */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Origin:
              </span>
              {ORIGINS.map((o) => (
                <button
                  key={o}
                  onClick={() => updateFilters({ origin: o })}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-all duration-200 shadow-sm ${
                    origin === o
                      ? 'border-accent bg-accent/10 text-accent font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {o !== 'All' && <span aria-hidden>{ORIGIN_FLAG[o]}</span>}
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
