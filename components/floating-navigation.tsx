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

// ─── Island CSS injected once ─────────────────────────────────────────────────
const ISLAND_CSS = `
  @keyframes island-breathe {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-3px); }
  }
  @keyframes island-breathe-x {
    0%, 100% { transform: translateX(0px); }
    50%       { transform: translateX(-3px); }
  }
  @keyframes badge-spring {
    0%   { transform: scale(0);    opacity: 0; }
    60%  { transform: scale(1.35); opacity: 1; }
    80%  { transform: scale(0.9);  }
    100% { transform: scale(1);    }
  }
  @keyframes cart-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.7); }
    70%  { box-shadow: 0 0 0 10px rgba(249,115,22,0); }
    100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
  }
  @keyframes icon-glow-in {
    from { filter: drop-shadow(0 0 0px rgba(249,115,22,0)); }
    to   { filter: drop-shadow(0 0 6px rgba(249,115,22,0.7)); }
  }
  .island-nav-item {
    transition: transform 0.18s cubic-bezier(0.34,1.4,0.64,1);
  }
  .island-nav-item:hover {
    transform: scale(1.12);
  }
  .island-nav-item:active {
    transform: scale(0.92);
  }
  .island-active-icon {
    animation: icon-glow-in 0.25s ease forwards;
    filter: drop-shadow(0 0 6px rgba(249,115,22,0.65));
  }
  .island-badge {
    animation: badge-spring 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  .island-cart-pulse {
    animation: cart-pulse 0.6s ease-out;
  }
`

function IslandItem({
  href, icon: Icon, label, active, onClick, badge, cartPulse,
}: {
  href?: string; icon: any; label: string; active?: boolean
  onClick?: () => void; badge?: number; cartPulse?: boolean
}) {
  const inner = (
    <span
      className="island-nav-item relative flex flex-col items-center justify-center gap-[3px] rounded-xl px-2.5 py-2 cursor-pointer"
      style={{
        minWidth: 52,
        background: active
          ? 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(234,88,12,0.12))'
          : 'transparent',
        border: active
          ? '1px solid rgba(249,115,22,0.3)'
          : '1px solid transparent',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(249,115,22,0.15), 0 2px 8px rgba(249,115,22,0.12)'
          : 'none',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Icon */}
      <span className="relative flex items-center justify-center">
        <Icon
          className={active ? 'island-active-icon size-[22px]' : 'size-[22px]'}
          strokeWidth={active ? 2.2 : 1.6}
          style={{
            color: active ? '#F97316' : 'rgba(255,255,255,0.45)',
            transition: 'color 0.2s',
          }}
        />
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span
            key={badge}
            className="island-badge absolute -right-2.5 -top-2 flex items-center justify-center rounded-full text-[9px] font-black text-white"
            style={{
              minWidth: 18,
              height: 18,
              padding: '0 4px',
              background: 'linear-gradient(135deg,#F97316,#EA580C)',
              boxShadow: '0 2px 6px rgba(249,115,22,0.5)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {/* Label */}
      <span
        className="text-[9px] font-bold uppercase tracking-wider leading-none"
        style={{
          color: active ? '#F97316' : 'rgba(255,255,255,0.35)',
          transition: 'color 0.2s',
        }}
      >
        {label}
      </span>

      {/* Active dot indicator */}
      {active && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: 4, height: 4, background: '#F97316', boxShadow: '0 0 6px #F97316' }}
        />
      )}
    </span>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className="contents"
        style={cartPulse ? { animation: 'cart-pulse 0.6s ease-out' } : {}}
      >
        {inner}
      </button>
    )
  }

  return (
    <Link href={href!} aria-label={label} className="contents">
      {inner}
    </Link>
  )
}

export function FloatingNavigation() {
  const pathname        = usePathname()
  const { count, setOpen } = useCart()
  const prevCount       = useRef(count)
  const [cartPulse, setCartPulse] = useState(false)

  // Trigger pulse animation when cart count increases
  useEffect(() => {
    if (count > prevCount.current) {
      setCartPulse(true)
      setTimeout(() => setCartPulse(false), 650)
    }
    prevCount.current = count
  }, [count])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const islandStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, rgba(12,18,35,0.97) 0%, rgba(8,14,28,0.97) 100%)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: [
      '0 24px 64px rgba(0,0,0,0.55)',
      '0 4px 20px rgba(0,0,0,0.4)',
      'inset 0 1px 0 rgba(255,255,255,0.07)',
      'inset 0 -1px 0 rgba(0,0,0,0.3)',
    ].join(','),
  }

  return (
    <>
      {/* CSS keyframes */}
      <style dangerouslySetInnerHTML={{ __html: ISLAND_CSS }} />

      {/* ── Mobile: floating bottom island ──────────────────── */}
      <div
        className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 lg:hidden"
        style={{ animation: 'island-breathe 5s ease-in-out infinite' }}
      >
        <nav
          className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-[22px]"
          style={islandStyle}
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

          {/* Divider */}
          <span
            className="mx-0.5 rounded-full"
            style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }}
          />

          {/* Cart */}
          <IslandItem
            icon={ShoppingBag}
            label="Cart"
            active={count > 0}
            badge={count > 0 ? count : undefined}
            onClick={() => setOpen(true)}
            cartPulse={cartPulse}
          />
        </nav>
      </div>

      {/* ── Desktop: left-side vertical island ──────────────── */}
      <div
        className="fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 lg:flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-[22px]"
        style={{
          ...islandStyle,
          animation: 'island-breathe-x 6s ease-in-out infinite',
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
          className="rounded-full"
          style={{ height: 1, width: 32, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }}
        />

        <IslandItem
          icon={ShoppingBag}
          label="Cart"
          active={count > 0}
          badge={count > 0 ? count : undefined}
          onClick={() => setOpen(true)}
          cartPulse={cartPulse}
        />
      </div>
    </>
  )
}
