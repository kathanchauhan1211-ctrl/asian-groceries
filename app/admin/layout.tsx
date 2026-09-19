'use client'

import { useAdminAuth, AdminAuthProvider } from '@/lib/admin-auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Package, ShoppingCart, Settings,
  LogOut, ExternalLink, BarChart3, MonitorPlay, Layers, Users,
} from 'lucide-react'
import { LogoSVG } from '@/components/logo-svg'
import { ADMIN_EMAIL } from '@/lib/admin-config'

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { href: '/admin',             label: 'Dashboard',   icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',      label: 'Orders',      icon: ShoppingCart },
  { href: '/admin/customers',   label: 'Customers',   icon: Users },
  { href: '/admin/products',    label: 'Products',    icon: Package },
  { href: '/admin/collections', label: 'Collections', icon: Layers },
  { href: '/admin/slides',      label: 'Slides',      icon: MonitorPlay },
  { href: '/admin/analytics',   label: 'Analytics',   icon: BarChart3 },
  { href: '/admin/settings',    label: 'Settings',    icon: Settings },
]

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG       = '#080C14'
const SURFACE  = '#0D1117'
const BORDER   = 'rgba(255,255,255,0.06)'
const MUTED    = '#4B5563'
const ORANGE   = '#F97316'

// ── Loading spinner ───────────────────────────────────────────────────────────
function Spinner({ msg = 'Loading…' }: { msg?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-10">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(249,115,22,0.2)' }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: ORANGE }} />
        </div>
        <p className="text-sm font-medium" style={{ color: MUTED }}>{msg}</p>
      </div>
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({ pathname, user, signOut }: { pathname: string; user: any; signOut: () => void }) {
  const isActive = (tab: typeof TABS[0]) =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)

  const activeTabRef = useRef<HTMLAnchorElement>(null)

  // Scroll active tab into view on mount / route change
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [pathname])

  return (
    <header
      className="flex h-[52px] shrink-0 items-center w-full"
      style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Left: Brand ────────────────────────────────────────────────────── */}
      <div
        className="flex h-full shrink-0 items-center gap-2.5 px-4"
        style={{ borderRight: `1px solid ${BORDER}` }}
      >
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 0 10px rgba(249,115,22,0.3)' }}
        >
          <LogoSVG size={18} />
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-[12px] font-bold text-white tracking-tight whitespace-nowrap">IndianMarket</span>
          <span
            className="text-[9px] font-semibold uppercase tracking-widest px-1 py-0.5 rounded"
            style={{ background: 'rgba(249,115,22,0.12)', color: ORANGE }}
          >
            Owner
          </span>
        </div>
      </div>

      {/* ── Centre: Tabs (horizontally scrollable) ──────────────────────────── */}
      <nav
        className="flex h-full flex-1 items-end overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
        {TABS.map((tab) => {
          const active = isActive(tab)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeTabRef : undefined}
              className="relative flex h-full shrink-0 items-center px-4 text-[13px] font-semibold transition-colors duration-100 whitespace-nowrap select-none"
              style={{
                color: active ? '#fff' : MUTED,
                borderBottom: active ? `2px solid ${ORANGE}` : '2px solid transparent',
              }}
            >
              {active && (
                <span
                  className="absolute inset-x-0 bottom-0 h-[2px] rounded-t-full"
                  style={{ background: ORANGE }}
                />
              )}
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Right: Actions ──────────────────────────────────────────────────── */}
      <div
        className="flex h-full shrink-0 items-center gap-1 px-3"
        style={{ borderLeft: `1px solid ${BORDER}` }}
      >
        {/* Date — hidden on xs */}
        <span className="hidden lg:block text-[11px] mr-2 tabular-nums" style={{ color: MUTED }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>

        {/* View Store */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-white/5"
          style={{ color: MUTED }}
          title="View Storefront"
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden md:inline">Store</span>
        </a>

        {/* Avatar + sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors hover:bg-red-500/10 hover:text-red-400"
          style={{ color: MUTED }}
          title="Sign out"
        >
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
          >
            {(user?.displayName ?? user?.email ?? 'A').charAt(0).toUpperCase()}
          </div>
          <LogOut className="size-3.5 hidden sm:block" />
        </button>
      </div>
    </header>
  )
}

// ── Inner layout ──────────────────────────────────────────────────────────────
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const redirected = useRef(false)

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    if (loading) return
    if (redirected.current) return

    if (!user) {
      redirected.current = true
      router.replace('/admin/login')
      return
    }

    if (user.email !== ADMIN_EMAIL) {
      redirected.current = true
      signOut().then(() => router.replace('/admin/login')).catch(() => router.replace('/admin/login'))
    }
  }, [user, loading, isLoginPage]) // eslint-disable-line

  useEffect(() => {
    if (!loading && user?.email === ADMIN_EMAIL) {
      redirected.current = false
    }
  }, [user, loading])

  // Login page: pass through with no chrome
  if (isLoginPage) return <>{children}</>

  if (loading) return <Spinner msg="Loading workspace…" />
  if (!user || user.email !== ADMIN_EMAIL) return <Spinner msg="Redirecting…" />

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG }}
    >
      {/* Tab bar — always on top, full width */}
      <TabBar pathname={pathname} user={user} signOut={signOut} />

      {/* Full-width content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: BG }}
      >
        <div className="p-5 md:p-7">
          {children}
        </div>
      </main>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  )
}
