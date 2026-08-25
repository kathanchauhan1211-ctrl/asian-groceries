'use client'

import { ShoppingBag, Bus, User, MessageSquare, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useEffect, useRef, useState } from 'react'

const NAV_ITEMS = [
  { id: 'shop',      href: '/',          label: 'Shop',    icon: Home },
  { id: 'track',     href: '/track',     label: 'Track',   icon: Bus },
  { id: 'dashboard', href: '/dashboard', label: 'Account', icon: User },
  { id: 'group',     href: '/community', label: 'Group',   icon: MessageSquare },
]

const CSS = `
  @keyframes island-float {
    0%, 100% { transform: translateX(-50%) translateY(0px); }
    50%       { transform: translateX(-50%) translateY(-4px); }
  }
  @keyframes island-float-v {
    0%, 100% { transform: translateY(-50%) translateX(0px); }
    50%       { transform: translateY(-50%) translateX(-3px); }
  }
  @keyframes badge-pop {
    0%   { transform: scale(0); opacity: 0; }
    55%  { transform: scale(1.4); opacity: 1; }
    75%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
  @keyframes cart-ring {
    0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.6); }
    70%  { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
  }
  @keyframes active-in {
    from { opacity:0; transform: scale(0.85); }
    to   { opacity:1; transform: scale(1); }
  }
  .nav-island-item {
    transition: transform 0.2s cubic-bezier(0.34,1.5,0.64,1);
    -webkit-tap-highlight-color: transparent;
  }
  .nav-island-item:hover  { transform: scale(1.1); }
  .nav-island-item:active { transform: scale(0.9); }
  .island-badge { animation: badge-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
  .cart-ring    { animation: cart-ring 0.65s ease-out; }
`

// Subtle Indian-style dot mandala pattern as SVG data URI
const DECOR_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3Ccircle cx='4' cy='4' r='1.2'/%3E%3Ccircle cx='36' cy='4' r='1.2'/%3E%3Ccircle cx='4' cy='36' r='1.2'/%3E%3Ccircle cx='36' cy='36' r='1.2'/%3E%3Ccircle cx='20' cy='4' r='0.8'/%3E%3Ccircle cx='20' cy='36' r='0.8'/%3E%3Ccircle cx='4' cy='20' r='0.8'/%3E%3Ccircle cx='36' cy='20' r='0.8'/%3E%3Cpath d='M20 14 L22 18 L18 18 Z' fill-opacity='0.06'/%3E%3Cpath d='M20 26 L22 22 L18 22 Z' fill-opacity='0.06'/%3E%3C/g%3E%3C/svg%3E")`

function IslandItem({
  href, icon: Icon, label, active, onClick, badge, pulseCart,
}: {
  href?: string
  icon: any
  label: string
  active?: boolean
  onClick?: () => void
  badge?: number
  pulseCart?: boolean
}) {
  const content = (
    <span
      className="nav-island-item relative flex flex-col items-center justify-center gap-[4px]"
      style={{ minWidth: 58, minHeight: 58 }}
    >
      {/* Active highlight pill */}
      {active && (
        <span
          className="absolute inset-1 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.35)',
            backdropFilter: 'blur(4px)',
            animation: 'active-in 0.25s ease both',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        />
      )}

      {/* Icon + badge wrapper */}
      <span className="relative z-10 flex items-center justify-center">
        <Icon
          className="size-[24px]"
          strokeWidth={active ? 2.4 : 1.8}
          style={{ color: active ? '#fff' : 'rgba(255,255,255,0.72)' }}
        />
        {badge !== undefined && badge > 0 && (
          <span
            key={badge}
            className="island-badge absolute -right-3 -top-2.5 flex items-center justify-center rounded-full text-[9px] font-black text-orange-600"
            style={{
              minWidth: 18, height: 18, padding: '0 4px',
              background: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        className="relative z-10 text-[10px] font-bold uppercase tracking-widest leading-none"
        style={{ color: active ? '#fff' : 'rgba(255,255,255,0.65)' }}
      >
        {label}
      </span>
    </span>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className={pulseCart ? 'cart-ring rounded-2xl' : ''}
      >
        {content}
      </button>
    )
  }
  return <Link href={href!} aria-label={label}>{content}</Link>
}

const ISLAND_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)',
  backgroundImage: `${DECOR_PATTERN}, linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)`,
  boxShadow: [
    '0 8px 32px rgba(249,115,22,0.55)',
    '0 20px 60px rgba(194,65,12,0.35)',
    '0 2px 8px rgba(0,0,0,0.2)',
    'inset 0 1px 0 rgba(255,255,255,0.25)',
    'inset 0 -2px 0 rgba(0,0,0,0.15)',
  ].join(','),
  border: '1.5px solid rgba(255,255,255,0.2)',
}

export function FloatingNavigation() {
  const pathname = usePathname()
  const { count, setOpen } = useCart()
  const prevCount = useRef(count)
  const [cartPulse, setCartPulse] = useState(false)

  useEffect(() => {
    if (count > prevCount.current) {
      setCartPulse(true)
      setTimeout(() => setCartPulse(false), 700)
    }
    prevCount.current = count
  }, [count])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Mobile: floating bottom ─────────────── */}
      <div
        className="fixed bottom-6 left-1/2 z-40 lg:hidden"
        style={{ animation: 'island-float 6s ease-in-out infinite' }}
      >
        <nav
          className="flex items-center gap-0 px-3 py-2 rounded-[28px]"
          style={{
            ...ISLAND_STYLE,
            minWidth: 340,
          }}
        >
          {NAV_ITEMS.map((item, i) => (
            <IslandItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}

          {/* Separator */}
          <span
            className="mx-1 shrink-0 rounded-full"
            style={{ width: 1.5, height: 36, background: 'rgba(255,255,255,0.2)' }}
          />

          {/* Cart */}
          <IslandItem
            icon={ShoppingBag}
            label="Cart"
            active={count > 0}
            badge={count > 0 ? count : undefined}
            onClick={() => setOpen(true)}
            pulseCart={cartPulse}
          />
        </nav>
      </div>

      {/* ── Desktop: left vertical island ──────── */}
      <div
        className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 lg:flex flex-col items-center gap-0 px-2 py-3 rounded-[28px]"
        style={{
          ...ISLAND_STYLE,
          animation: 'island-float-v 6s ease-in-out infinite',
        }}
      >
        {NAV_ITEMS.map(item => (
          <IslandItem
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
          />
        ))}

        <span
          className="my-1 rounded-full"
          style={{ height: 1.5, width: 36, background: 'rgba(255,255,255,0.2)' }}
        />

        <IslandItem
          icon={ShoppingBag}
          label="Cart"
          active={count > 0}
          badge={count > 0 ? count : undefined}
          onClick={() => setOpen(true)}
          pulseCart={cartPulse}
        />
      </div>
    </>
  )
}
