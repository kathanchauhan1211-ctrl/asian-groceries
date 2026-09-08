'use client'

import { ShoppingBag, Bus, User, MessageSquare, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { useEffect, useRef, useState } from 'react'

const NAV_ITEMS = [
  { id: 'shop', href: '/', label: 'Shop', icon: Home },
  { id: 'track', href: '/track', label: 'Track', icon: Bus },
  { id: 'dashboard', href: '/dashboard', label: 'Account', icon: User },
  { id: 'group', href: '/community', label: 'Group', icon: MessageSquare },
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
    0%   { box-shadow: 0 0 0 0 rgba(249,115,22,0.8), 0 12px 40px rgba(0,0,0,0.4); }
    60%  { box-shadow: 0 0 0 14px rgba(249,115,22,0), 0 12px 40px rgba(0,0,0,0.4); }
    100% { box-shadow: 0 0 0 0 rgba(249,115,22,0), 0 12px 40px rgba(0,0,0,0.4); }
  }
  .island-wrap {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    transition: box-shadow 0.3s ease;
  }
  .island-wrap.cart-has-items {
    box-shadow: 0 12px 40px rgba(249,115,22,0.25);
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
      className="nav-item-btn relative flex flex-col items-center justify-center gap-[5px] px-3"
      style={{ minWidth: 64, minHeight: 64 }}
    >
      {/* Active orange pill background (Glassy iOS style) */}
      {active && (
        <span
          className="absolute inset-1 rounded-full overflow-hidden"
          style={{
            animation: 'active-pill-in 0.22s cubic-bezier(0.34,1.4,0.64,1) both',
          }}
        >
          {/* Base Orange Background */}
          <span className="absolute inset-0 bg-gradient-to-b from-[#ff8c00] to-[#e64d00]" />
          {/* Top White Gel Reflection */}
          <span className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/60 to-white/0" />
          {/* Inner 3D Shadow */}
          <span className="absolute inset-0 rounded-full shadow-[inset_0_2px_1px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(0,0,0,0.3)] pointer-events-none" />
        </span>
      )}

      {/* Icon */}
      <span className="relative z-10 flex items-center justify-center">
        <Icon
          className="size-[22px]"
          strokeWidth={active ? 2.3 : 1.7}
          style={{ color: '#fff', opacity: active ? 1 : 0.5, filter: active ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none' }}
        />
        {badge !== undefined && badge > 0 && (
          <span
            key={badge}
            className="island-badge absolute -right-3 -top-2.5 flex items-center justify-center rounded-full font-black text-white"
            style={{
              minWidth: 18, height: 18, padding: '0 4px',
              fontSize: 9,
              background: 'linear-gradient(to bottom, #ff8c00, #e64d00)',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 2px 6px rgba(0,0,0,0.3)',
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

// Dark Blue Glassy iOS style base
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
      {/* Dark blue glassy gradient body */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#1c2c4d] to-[#0c162c]"
      />
      {/* iOS style strong top white gradient shine for the island */}
      <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      {/* Inner shadow for sharp 3D gel effect on the island */}
      <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_1px_rgba(255,255,255,0.15),inset_0_-3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />
      
      <div className="relative z-10 flex items-center">
        {children}
      </div>
    </div>
  )
}

export function FloatingNavigation() {
  const pathname = usePathname()
  const { td } = useTranslation()
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
        className="fixed left-1/2 z-40 lg:hidden"
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          animation: 'island-float 6s ease-in-out infinite',
        }}
      >
        <IslandShell
          className={`${baseClass} flex-row px-2 py-2 rounded-full`}
          style={{ display: 'flex', flexDirection: 'row' }}
          cartHasItems={count > 0}
        >
          {NAV_ITEMS.map(item => (
            <Item
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={td(item.label)}
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
            label={td("Cart")}
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
          className={`${baseClass} relative overflow-hidden rounded-full`}
        >
          {/* Dark blue glassy gradient body */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c2c4d] to-[#0c162c]" />
          <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_1px_rgba(255,255,255,0.15),inset_0_-3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />
          
          <nav className="relative z-10 flex flex-col items-center gap-0 px-2 py-3">
            {NAV_ITEMS.map(item => (
              <Item
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={td(item.label)}
                active={isActive(item.href)}
              />
            ))}

            <span
              className="my-1 rounded-full"
              style={{ height: 1.5, width: 32, background: 'rgba(249,115,22,0.25)' }}
            />

            <Item
              icon={ShoppingBag}
              label={td("Cart")}
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
