'use client'

import { useAdminAuth, AdminAuthProvider } from '@/lib/admin-auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Package, ShoppingCart, Settings,
  LogOut, ExternalLink, BarChart3, MonitorPlay, Layers, Users, Tag
} from 'lucide-react'
import { LogoSVG } from '@/components/logo-svg'
import { ADMIN_EMAIL } from '@/lib/admin-config'

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/banners', label: 'Banners' },
  { href: '/admin/slides', label: 'Slides' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/settings', label: 'Settings' },
]

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = '#080C14'
const SURFACE = '#0C1118'
const BORDER = 'rgba(255,255,255,0.07)'
const MUTED = '#6B7280'
const ORANGE = '#F97316'

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

// ── Top navbar ────────────────────────────────────────────────────────────────
function TopNav({ pathname, user, signOut }: { pathname: string; user: any; signOut: () => void }) {
  const isActive = (item: typeof NAV[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <header
      style={{
        background: SURFACE,
        borderBottom: `1px solid ${BORDER}`,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Single row ───────────────────────────────────────────────────── */}
      <div className="flex h-[54px] items-center px-5 gap-6 w-full">

        {/* Logo + brand */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg,#F97316,#EA580C)',
              boxShadow: '0 0 14px rgba(249,115,22,0.35)',
            }}
          >
            <LogoSVG size={18} />
          </div>
          <div className="hidden sm:flex flex-col leading-none gap-0.5">
            <span className="text-[13px] font-bold text-white tracking-tight">IndianMarket</span>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(249,115,22,0.15)', color: ORANGE }}
            >
              Owner
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px shrink-0" style={{ background: BORDER }} />

        {/* Nav links — horizontally scrollable on mobile */}
        <nav
          className="flex flex-1 items-center gap-1 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <style>{`nav::-webkit-scrollbar{display:none}`}</style>
          {NAV.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all duration-100 whitespace-nowrap"
                style={{
                  color: active ? '#fff' : MUTED,
                  background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.color = '#D1D5DB'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.color = MUTED
                }}
              >
                {active && (
                  <span
                    className="mr-1.5 inline-block size-1.5 rounded-full align-middle"
                    style={{ background: ORANGE }}
                  />
                )}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1 ml-auto">
          {/* Date */}
          <span className="hidden xl:block text-[11px] mr-2 tabular-nums" style={{ color: MUTED }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>

          {/* View store */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={{ color: MUTED, background: 'transparent' }}
            title="View Storefront"
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden md:inline">Store</span>
          </a>

          {/* Avatar / sign out */}
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-all"
            style={{ color: MUTED }}
            title="Sign out"
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#FCA5A5'
                ; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = MUTED
                ; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
            >
              {(user?.displayName ?? user?.email ?? 'A').charAt(0).toUpperCase()}
            </div>
            <LogOut className="size-3.5 hidden sm:block" />
          </button>
        </div>
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
    if (isLoginPage || loading || redirected.current) return
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

  // Login page: no chrome
  if (isLoginPage) return <>{children}</>

  if (loading) return <Spinner msg="Loading workspace…" />
  if (!user || user.email !== ADMIN_EMAIL) return <Spinner msg="Redirecting…" />

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: BG }}
    >
      {/* Top navbar — full width, always on top */}
      <TopNav pathname={pathname} user={user} signOut={signOut} />

      {/* Full-width scrollable content */}
      <main className="flex-1 overflow-y-auto" style={{ background: BG }}>
        <div className="p-5 md:p-7 max-w-[1440px] mx-auto">
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
