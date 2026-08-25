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
  const pathname  = usePathname()
  const { count, setOpen } = useCart()

  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 md:hidden">
      {/* Pill bar — clean, no glow, no seamless pattern */}
      <nav
        className="flex items-center gap-1 rounded-2xl px-2 py-2"
        style={{
          background: 'rgba(15,32,68,0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon    = item.icon
          const active  = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-3.5 py-2 transition-all duration-150"
              style={{
                background: active ? '#F97316' : 'transparent',
                color:      active ? '#fff'    : 'rgba(255,255,255,0.5)',
                minWidth: '52px',
              }}
            >
              <Icon className="size-5 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ letterSpacing: '0.02em' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Separator */}
        <div className="mx-1 h-8 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Cart */}
        <button
          onClick={() => setOpen(true)}
          className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3.5 py-2 transition-all duration-150"
          style={{
            background: count > 0 ? '#F97316' : 'transparent',
            color:      count > 0 ? '#fff'    : 'rgba(255,255,255,0.5)',
            minWidth: '52px',
          }}
          aria-label="Open cart"
        >
          <span className="relative">
            <ShoppingBag className="size-5 shrink-0" strokeWidth={count > 0 ? 2.2 : 1.8} />
            {count > 0 && (
              <span
                className="absolute -right-2.5 -top-2 flex size-4 items-center justify-center rounded-full text-[9px] font-black"
                style={{ background: '#fff', color: '#F97316' }}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </span>
          <span className="text-[10px] font-semibold leading-none" style={{ letterSpacing: '0.02em' }}>
            Cart
          </span>
        </button>
      </nav>
    </div>
  )
}
