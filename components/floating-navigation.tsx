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
    50%       { transform: translateX(-50%) translateY(-5px); }
  }
  @keyframes island-float-v {
    0%, 100% { transform: translateY(-50%); }
    50%       { transform: translateY(calc(-50% - 4px)); }
  }
  @keyframes badge-pop {
    0%   { transform: scale(0); opacity: 0; }
    60%  { transform: scale(1.45); opacity: 1; }
    80%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
  @keyframes active-pill-in {
    from { opacity: 0; transform: scaleX(0.7) scaleY(0.85); }
    to   { opacity: 1; transform: scaleX(1) scaleY(1); }
  }
  @keyframes cart-ripple {
    0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.8), 0 8px 32px rgba(15,32,68,0.55); }
    60%  { box-shadow: 0 0 0 14px rgba(249,115,22,0), 0 8px 32px rgba(15,32,68,0.55); }
    100% { box-shadow: 0 0 0 0 rgba(249,115,22,0), 0 8px 32px rgba(15,32,68,0.55); }
  }
  .island-wrap {
    box-shadow:
      0 8px 32px rgba(15,32,68,0.55),
      0 20px 56px rgba(9,18,40,0.4),
      inset 0 1.5px 0 rgba(255,255,255,0.1),
      inset 0 -1px 0 rgba(0,0,0,0.25);
    transition: box-shadow 0.3s ease;
  }
  .island-wrap.cart-has-items {
    box-shadow:
      0 8px 32px rgba(249,115,22,0.3),
      0 20px 56px rgba(9,18,40,0.4),
      inset 0 1.5px 0 rgba(255,255,255,0.1),
      inset 0 -1px 0 rgba(0,0,0,0.25);
  }
  .nav-item-btn {
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.2s cubic-bezier(0.34,1.5,0.64,1);
  }
  .nav-item-btn:hover  { transform: scale(1.08); }
  .nav-item-btn:active { transform: scale(0.91); }
  .island-badge { animation: badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .cart-ripple-anim { animation: cart-ripple 0.7s ease-out; }
`

interface ItemProps {
  href?: string
  icon: any
  label: string
  active?: boolean
  badge?: number
  onClick?: () => void
  cartPulse?: boolean
}

function Item({ href, icon: Icon, label, active, badge, onClick, cartPulse }: ItemProps) {
  const inner = (
    <span
      className="nav-item-btn relative flex flex-col items-center justify-center gap-[5px]"
      style={{ minWidth: 60, minHeight: 60 }}
    >
      {/* Active orange pill background */}
      {active && (
        <span
          className="absolute inset-[5px] rounded-[18px]"
          style={{
            background: 'linear-gradient(145deg, #F97316, #EA580C)',
            boxShadow: '0 4px 14px rgba(249,115,22,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            animation: 'active-pill-in 0.22s cubic-bezier(0.34,1.4,0.64,1) both',
          }}
        />
      )}

      {/* Icon */}
      <span className="relative z-10 flex items-center justify-center">
        <Icon
          className="size-[22px]"
          strokeWidth={active ? 2.3 : 1.7}
          style={{ color: '#fff', opacity: active ? 1 : 0.5 }}
        />
        {badge !== undefined && badge > 0 && (
          <span
            key={badge}
            className="island-badge absolute -right-3 -top-2.5 flex items-center justify-center rounded-full font-black text-white"
            style={{
              minWidth: 18, height: 18, padding: '0 4px',
              fontSize: 9,
              background: 'linear-gradient(135deg,#F97316,#C2410C)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              boxShadow: '0 2px 6px rgba(249,115,22,0.55)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span
        className="relative z-10 font-bold uppercase tracking-widest leading-none"
        style={{ fontSize: 9, color: active ? '#fff' : 'rgba(255,255,255,0.45)' }}
      >
        {label}
      </span>
    </span>
  )

  if (onClick) {
    return <button onClick={onClick} aria-label={label} className={cartPulse ? 'cart-ripple-anim' : ''}>{inner}</button>
  }
  return <Link href={href!} aria-label={label}>{inner}</Link>
}

// The island background: deep navy with a hint of blue warmth
const BG: React.CSSProperties = {
  background: 'linear-gradient(160deg, #0D1E3D 0%, #0F2647 45%, #122B52 100%)',
  border: '1.5px solid rgba(249,115,22,0.35)',
  // Thin orange gradient line at top — the brand signature
  backgroundImage: [
    // Top orange accent stripe (via pseudo simulation via border)
    'linear-gradient(160deg, #0D1E3D 0%, #0F2647 45%, #122B52 100%)',
  ].join(','),
}

// Orange top-edge decorative line simulated with a wrapper
function IslandShell({ children, className, style, cartHasItems }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  cartHasItems?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={style}
    >
      {/* Orange accent stripe across top */}
      <div
        className="absolute left-4 right-4 top-0 h-[2.5px] rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, #F97316, #EA580C, transparent)' }}
      />
      {/* Blue-to-navy gradient body */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #0D1E3D 0%, #0F2647 50%, #122B52 100%)',
          opacity: 1,
        }}
      />
      {/* Subtle warm top reflection */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[40%]"
        style={{
          background: 'linear-gradient(to bottom, rgba(249,115,22,0.06) 0%, transparent 100%)',
        }}
      />
      <div className="relative z-10 flex items-center">
        {children}
      </div>
    </div>
  )
}

export function FloatingNavigation() {
  const pathname = usePathname()
  const { count, setOpen } = useCart()
  const prevCount = useRef(count)
  const [cartPulse, setCartPulse] = useState(false)

  useEffect(() => {
    if (count > prevCount.current) {
      setCartPulse(true)
      setTimeout(() => setCartPulse(false), 750)
    }
    prevCount.current = count
  }, [count])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const baseClass = `island-wrap${count > 0 ? ' cart-has-items' : ''}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Mobile: floating bottom island ─────────────── */}
      <div
        className="fixed bottom-6 left-1/2 z-40 lg:hidden"
        style={{ animation: 'island-float 6s ease-in-out infinite' }}
      >
        <IslandShell
          className={`${baseClass} flex-row px-2 py-2 rounded-[26px]`}
          style={{ display: 'flex', flexDirection: 'row' }}
          cartHasItems={count > 0}
        >
          {NAV_ITEMS.map(item => (
            <Item
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}

          {/* Orange-ish separator */}
          <span
            className="mx-1 self-center rounded-full"
            style={{ width: 1.5, height: 32, background: 'rgba(249,115,22,0.25)' }}
          />

          <Item
            icon={ShoppingBag}
            label="Cart"
            active={count > 0}
            badge={count > 0 ? count : undefined}
            onClick={() => setOpen(true)}
            cartPulse={cartPulse}
          />
        </IslandShell>
      </div>

      {/* ── Desktop: left vertical island ──────────────── */}
      <div
        className="fixed left-5 top-1/2 z-40 hidden lg:block"
        style={{ animation: 'island-float-v 7s ease-in-out infinite' }}
      >
        <div
          className={`${baseClass} relative overflow-hidden rounded-[26px]`}
          style={{ border: '1.5px solid rgba(249,115,22,0.35)' }}
        >
          {/* Orange left-edge accent line for vertical */}
          <div
            className="absolute left-0 top-6 bottom-6 w-[2.5px] rounded-full"
            style={{ background: 'linear-gradient(to bottom, transparent, #F97316, #EA580C, transparent)' }}
          />
          {/* Top warm glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, #0D1E3D 0%, #0F2647 50%, #122B52 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 h-[35%]"
            style={{ background: 'linear-gradient(to bottom, rgba(249,115,22,0.07) 0%, transparent 100%)' }}
          />
          <nav className="relative z-10 flex flex-col items-center gap-0 px-2 py-3">
            {NAV_ITEMS.map(item => (
              <Item
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}

            <span
              className="my-1 rounded-full"
              style={{ height: 1.5, width: 32, background: 'rgba(249,115,22,0.25)' }}
            />

            <Item
              icon={ShoppingBag}
              label="Cart"
              active={count > 0}
              badge={count > 0 ? count : undefined}
              onClick={() => setOpen(true)}
              cartPulse={cartPulse}
            />
          </nav>
        </div>
      </div>
    </>
  )
}
