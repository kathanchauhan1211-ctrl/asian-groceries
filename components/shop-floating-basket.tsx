'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { useEffect, useRef, useState } from 'react'

const CSS = `
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
  .cart-ripple-anim { animation: cart-ripple 0.7s ease-out; }
  .nav-item-btn {
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.2s cubic-bezier(0.34,1.5,0.64,1);
  }
  .nav-item-btn:hover  { transform: scale(1.08); }
  .nav-item-btn:active { transform: scale(0.91); }
`

export function ShopFloatingBasket() {
  const { count, setOpen } = useCart()
  const { td } = useTranslation()
  const prevCount = useRef(count)
  const [cartPulse, setCartPulse] = useState(false)

  useEffect(() => {
    if (count > prevCount.current) {
      setCartPulse(true)
      setTimeout(() => setCartPulse(false), 750)
    }
    prevCount.current = count
  }, [count])

  // Don't show if empty, or perhaps always show. Let's always show it on the shop page.
  const baseClass = `island-wrap${count > 0 ? ' cart-has-items' : ''}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="fixed bottom-[90px] right-4 z-40 lg:bottom-10 lg:right-10"
      >
        <div
          className={`${baseClass} relative overflow-hidden rounded-full cursor-pointer ${cartPulse ? 'cart-ripple-anim' : ''}`}
          onClick={() => setOpen(true)}
        >
          {/* Dark blue glassy gradient body */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c2c4d] to-[#0c162c]" />
          {/* iOS style strong top white gradient shine for the island */}
          <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          {/* Inner shadow for sharp 3D gel effect on the island */}
          <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_1px_rgba(255,255,255,0.15),inset_0_-3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />

          <div className="relative z-10 flex items-center justify-center p-3 sm:p-4">
            <span className="nav-item-btn relative flex flex-col items-center justify-center gap-1">
              {/* Active orange pill background if has items */}
              {count > 0 && (
                <span
                  className="absolute inset-[-8px] rounded-full overflow-hidden"
                  style={{
                    animation: 'active-pill-in 0.22s cubic-bezier(0.34,1.4,0.64,1) both',
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-b from-[#ff8c00] to-[#e64d00]" />
                  <span className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/60 to-white/0" />
                  <span className="absolute inset-0 rounded-full shadow-[inset_0_2px_1px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(0,0,0,0.3)] pointer-events-none" />
                </span>
              )}

              <span className="relative z-10 flex items-center justify-center">
                <ShoppingBag
                  className="size-6 sm:size-7"
                  strokeWidth={count > 0 ? 2.3 : 1.7}
                  style={{ color: '#fff', opacity: count > 0 ? 1 : 0.8, filter: count > 0 ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none' }}
                />
                {count > 0 && (
                  <span
                    key={count}
                    className="absolute -right-2 -top-2 flex items-center justify-center rounded-full font-black text-white bg-white/20"
                    style={{
                      minWidth: 20, height: 20, padding: '0 4px',
                      fontSize: 10,
                      border: '1px solid rgba(255,255,255,0.4)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
