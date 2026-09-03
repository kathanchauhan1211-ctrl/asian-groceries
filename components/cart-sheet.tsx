'use client'

import { Minus, Plus, ShoppingBag, Trash2, X, Bus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-context'
import { ORIGIN_FLAG } from '@/lib/products'

const FREE_DELIVERY_THRESHOLD = 25
const DELIVERY_FEE = 3.99

// CartImage — shows a bg placeholder until the real image loads, then fades it in
function CartImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const fallback = `https://placehold.co/150x150/065f46/ffffff?text=${encodeURIComponent(alt.substring(0, 2))}`
  return (
    <div className="relative size-full">
      {/* Skeleton shown until loaded */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-xl" style={{ background: 'var(--muted)' }} />
      )}
      <img
        src={errored ? fallback : src}
        alt={alt}
        className="size-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => { setErrored(true); setLoaded(true) }}
      />
    </div>
  )
}

export function CartSheet({ onCheckout }: { onCheckout: () => void }) {
  const { lines, subtotal, count, totalWeight, isOpen, setOpen, setCheckoutOpen, updateQuantity, removeItem, isMounted } = useCart()
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const orderTotal = subtotal + deliveryFee
  const weightLimit = 30 // 30kg package constraint
  const isOverweight = totalWeight > weightLimit

  if (!isMounted) return null

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!isOpen}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-modal={isOpen}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-background shadow-2xl border-l border-border/40 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Your Basket</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close cart">
            <X className="size-5" />
          </Button>
        </div>

        {/* Delivery alert */}
        <div className="flex items-start gap-3 border-b border-border bg-emerald-50/50 px-5 py-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-primary">
            <Bus className="size-4 text-emerald-500" />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-emerald-400">Autobusų Stotis Delivery</p>
            <p className="text-muted-foreground">
              {remaining > 0
                ? `Add €${remaining.toFixed(2)} more for free station delivery.`
                : 'You have unlocked free bus-station delivery!'}
            </p>
          </div>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
              <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ShoppingBag className="size-7" />
              </span>
              <p className="font-medium text-foreground">Your basket is empty</p>
              <p className="max-w-[240px] text-sm text-muted-foreground">
                Add some authentic South Asian staples to get started.
              </p>
              <a
                href="/#shop"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--primary)' }}
              >
                <ShoppingBag className="size-4" />
                Browse Products
              </a>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-3 p-2.5 rounded-xl border transition-colors" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                    <CartImage
                      src={line.product.image || '/placeholder.svg'}
                      alt={line.product.name}
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span aria-hidden>{ORIGIN_FLAG[line.product.origin]}</span>{' '}
                          {line.variant.label}{(line.variant.weightKg ?? 0) > 0 ? ` • ${((line.variant.weightKg ?? 0) * line.quantity).toFixed(1)} kg` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(line.key)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Remove ${line.product.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          onClick={() => updateQuantity(line.key, line.quantity - 1)}
                          className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(line.key, line.quantity + 1)}
                          className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        €{(line.variant.price * line.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="border-t px-5 py-4 backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {/* Weight limit tracking — only shown when weightKg data exists */}
            {totalWeight > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">Order Weight</span>
                  <span className={isOverweight ? 'text-amber-500' : 'text-foreground'}>
                    {totalWeight.toFixed(1)} kg / {weightLimit} kg max
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverweight ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, (totalWeight / weightLimit) * 100)}%` }}
                  />
                </div>
                {isOverweight && (
                  <p className="mt-1 text-[11px] text-amber-500 font-semibold leading-tight">
                    Package limit of 30 kg exceeded. Please reduce items.
                  </p>
                )}
              </div>
            )}

            {/* Subtotal */}
            <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">€{subtotal.toFixed(2)}</span>
            </div>

            {/* Delivery fee */}
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span className="tabular-nums">
                {deliveryFee === 0
                  ? <span className="text-emerald-500 font-semibold">Free</span>
                  : `€${deliveryFee.toFixed(2)}`
                }
              </span>
            </div>

            {/* Divider */}
            <div className="my-2 h-px" style={{ background: 'var(--border)' }} />

            {/* Order total */}
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-serif text-xl font-bold tabular-nums text-foreground">
                €{orderTotal.toFixed(2)}
              </span>
            </div>
            <Button
              size="lg"
              disabled={isOverweight}
              onClick={() => {
                setOpen(false)
                setCheckoutOpen(true)
                onCheckout()
              }}
              className="h-12 w-full rounded-full bg-accent text-base text-accent-foreground font-semibold hover:bg-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent/20"
            >
              Checkout · Bus Delivery
            </Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Secure checkout · Autobusų Stotis courier
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
