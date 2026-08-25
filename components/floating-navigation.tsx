'use client'

import { ShoppingBag, Bus, User, MessageSquare, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

type NavItem = {
  id: string
  href: string
  label: string
  icon: any
}

const NAV_ITEMS: NavItem[] = [
  { id: 'shop',      href: '/',          label: 'Shop',    icon: Home },
  { id: 'track',     href: '/track',     label: 'Track',   icon: Bus },
  { id: 'dashboard', href: '/dashboard', label: 'Account', icon: User },
  { id: 'group',     href: '/community', label: 'Group',   icon: MessageSquare },
]

export function FloatingNavigation() {
  const pathname       = usePathname()
  const { count, setOpen } = useCart()

  const isActive = (item: NavItem) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

  // Shared item render
  function NavBtn({
    icon: Icon, label, active, onClick, badge,
  }: {
    icon: any; label: string; active?: boolean; onClick?: () => void; badge?: number
  }) {
    return (
      <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center gap-[3px] transition-all duration-150 select-none"
        style={{ minWidth: 52, minHeight: 52 }}
        aria-label={label}
      >
        {/* Active indicator bar — top on desktop, bottom on mobile (handled by parent rotation) */}
        {active && (
          <span
            className="absolute inset-x-2 top-0 h-[3px] rounded-b-full lg:top-auto lg:bottom-0 lg:rounded-t-full lg:rounded-b-none"
            style={{ background: '#F97316' }}
          />
        )}
        <span className="relative flex items-center justify-center">
          <Icon
            className="size-[22px]"
            strokeWidth={active ? 2.5 : 1.7}
            style={{ color: active ? '#F97316' : 'rgba(255,255,255,0.5)' }}
          />
          {badge !== undefined && badge > 0 && (
            <span
              className="absolute -right-2.5 -top-2 flex size-[18px] items-center justify-center rounded-full text-[9px] font-black"
              style={{ background: '#F97316', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
            >
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        <span
          className="text-[10px] font-semibold leading-none tracking-tight"
          style={{ color: active ? '#F97316' : 'rgba(255,255,255,0.4)' }}
        >
          {label}
        </span>
      </button>
    )
  }

  const containerStyle: React.CSSProperties = {
    background:    'rgba(13,21,37,0.97)',
    backdropFilter: 'blur(20px)',
    border:        '1px solid rgba(255,255,255,0.08)',
    boxShadow:     '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  }

  return (
    <>
      {/* ── Mobile bottom bar ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe">
        <nav
          className="flex items-center justify-around px-2 py-1"
          style={{
            ...containerStyle,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            borderBottom: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '16px 16px 0 0',
          }}
        >
          {NAV_ITEMS.map(item => (
            <Link key={item.id} href={item.href} className="contents">
              <NavBtn
                icon={item.icon}
                label={item.label}
                active={isActive(item)}
              />
            </Link>
          ))}

          {/* Divider */}
          <div className="h-9 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Cart */}
          <NavBtn
            icon={ShoppingBag}
            label="Cart"
            active={count > 0}
            badge={count}
            onClick={() => setOpen(true)}
          />
        </nav>
      </div>

      {/* ── Desktop left-side vertical island ─────────────── */}
      <div
        className="fixed left-5 top-1/2 z-40 -translate-y-1/2 hidden lg:flex flex-col items-center py-3 gap-1 rounded-2xl"
        style={containerStyle}
      >
        {NAV_ITEMS.map((item, i) => (
          <Link key={item.id} href={item.href} className="contents">
            <NavBtn
              icon={item.icon}
              label={item.label}
              active={isActive(item)}
            />
          </Link>
        ))}

        <div className="my-1 h-px w-8" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <NavBtn
          icon={ShoppingBag}
          label="Cart"
          active={count > 0}
          badge={count}
          onClick={() => setOpen(true)}
        />
      </div>
    </>
  )
}
