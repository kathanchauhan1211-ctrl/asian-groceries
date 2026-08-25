'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Package, ShoppingCart, Settings,
  LogOut, ExternalLink, BarChart3, ChevronRight,
  Bell, Search, Menu, X
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const PAGE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Orders',
  '/admin/products': 'Products',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/admin/login')
      else if (user.email !== 'indianmarket@test.com') router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080C14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-10">
            <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Loading workspace…</p>
        </div>
      </div>
    )
  }

  if (!user || user.email !== 'indianmarket@test.com') return null

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const currentLabel = PAGE_LABELS[pathname] ?? 'Portal'

  const Sidebar = () => (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-screen"
      style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* ── Brand ── */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-base"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 0 12px rgba(249,115,22,0.35)' }}
          >
            🌶️
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-tight text-white tracking-tight">IndianMarket</p>
            <span
              className="mt-0.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              Owner
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#374151' }}>
          Main
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150 mb-0.5 group"
              style={{
                color: active ? '#F97316' : '#6B7280',
                background: active ? 'rgba(249,115,22,0.08)' : 'transparent',
              }}
            >
              {/* Active left accent bar */}
              {active && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                  style={{ background: '#F97316' }}
                />
              )}
              <Icon className="size-[15px] shrink-0 transition-colors" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* User info */}
        <div
          className="mb-2 flex items-center gap-2.5 rounded-md px-2.5 py-2"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
          >
            K
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-white leading-tight">Kathan Chauhan</p>
            <p className="truncate text-[10px]" style={{ color: '#4B5563' }}>Owner</p>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors mb-0.5"
          style={{ color: '#6B7280' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#D1D5DB')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          <ExternalLink className="size-[13px]" />
          View Store
        </Link>

        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all"
          style={{ color: '#EF4444' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut className="size-[13px]" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#080C14' }}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-[220px]">
            <Sidebar />
            <button
              className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-md"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#9CA3AF' }}
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Topbar ── */}
        <header
          className="flex h-[52px] shrink-0 items-center justify-between px-5"
          style={{
            background: 'rgba(8,12,20,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="flex size-8 items-center justify-center rounded-md lg:hidden"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[12px]">
              <span style={{ color: '#4B5563' }}>Portal</span>
              <ChevronRight className="size-3" style={{ color: '#374151' }} />
              <span className="font-semibold text-white">{currentLabel}</span>
            </nav>
          </div>

          {/* Right: date + avatar */}
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] md:block" style={{ color: '#4B5563' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div
              className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
            >
              K
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7" style={{ background: '#080C14' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
