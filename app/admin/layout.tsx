'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Package, ShoppingCart, Settings,
  LogOut, ShieldCheck, ExternalLink, BarChart3
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/admin/login')
      } else if (user.email !== 'indianmarket@test.com') {
        router.push('/')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Loading portal...</p>
        </div>
      </div>
    )
  }

  if (!user || user.email !== 'indianmarket@test.com') return null

  const isActive = (item: typeof NAV_ITEMS[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: '#020617' }}>
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-white/5" style={{ background: '#0f172a' }}>
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/20">
            <ShieldCheck className="size-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">IndianMarket</p>
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">God-Mode Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-orange-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user + sign out */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <Link href="/" target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all border border-transparent">
            <ExternalLink className="size-4" />
            View Storefront
          </Link>
          <button onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent">
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-white/5 bg-slate-900/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {NAV_ITEMS.find(n => isActive(n))?.label ?? 'Admin Portal'}
              </h2>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white">Admin</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
