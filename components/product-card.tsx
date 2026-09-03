'use client'

import { memo, useState, useEffect } from 'react'
import { Check, Minus, Plus, ShoppingBag, Star, X, ChevronDown, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { ORIGIN_FLAG, type Product } from '@/lib/products'

const STOCK_STYLES: Record<Product['stock'], { pill: string; label: React.ReactNode }> = {
  'In Stock':     { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'In Stock' },
  'Low Stock':    { pill: 'bg-amber-50  text-amber-700  border border-amber-200',  label: <span className="flex items-center gap-0.5"><AlertTriangle className="size-2.5" />Low Stock</span> },
  'Out of Stock': { pill: 'bg-rose-50   text-rose-700   border border-rose-200',   label: 'Sold Out' },
}

// Tiny base64 grey blur placeholder — prevents CLS while real image loads
const BLUR_DATA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f8fafc' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='64' fill='%23cbd5e1'%3E%F0%9F%93%A6%3C/text%3E%3C/svg%3E`

// ─── Product Detail Modal (Bolt Food style) ───────────────────────────────────
function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCart()
  const { td } = useTranslation()
  const [variantIndex, setVariantIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const variant = product.variants?.[variantIndex] ?? product.variants?.[0]
  const soldOut = product.stock === 'Out of Stock'
  const stockStyle = STOCK_STYLES[product.stock] ?? STOCK_STYLES['In Stock']
  const stockLabel = product.stock === 'Low Stock' && typeof product.stockCount === 'number' 
    ? <span className="flex items-center gap-0.5 animate-pulse"><AlertTriangle className="size-2.5" />Only {product.stockCount} left!</span>
    : stockStyle.label

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleAdd() {
    if (soldOut || !variant) return
    addItem(product, variant, qty)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 900)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal — centered on all devices */}
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--card)', maxHeight: '92dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image — full width, fixed height */}
        <div className="relative w-full bg-slate-100" style={{ aspectRatio: '4/3' }}>
          <Image
            src={product.image || PLACEHOLDER}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 560px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA}
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
            priority={false}
          />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
          {/* Origin badge */}
          <span className="absolute left-3 bottom-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
            {ORIGIN_FLAG[product.origin] ?? '🌍'} {td(product.origin)}
          </span>
          {product.bestseller && (
            <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm uppercase">
              <Star className="size-3 fill-current" /> Bestseller
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Stock + diet tags */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${stockStyle.pill}`}>
              {stockLabel}
            </span>
            {product.diet?.map(d => (
              <span key={d} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {td(d)}
              </span>
            ))}
          </div>

          {/* Name */}
          <h2 className="font-sans text-xl font-bold leading-snug text-slate-900" style={{ color: 'var(--foreground)' }}>
            {td(product.name)}
          </h2>
          {product.brand && (
            <p className="mt-0.5 text-sm font-medium text-orange-500">{product.brand}</p>
          )}
          <p className="mt-2 text-sm leading-relaxed text-slate-500" style={{ color: 'var(--muted-foreground)' }}>
            {td(product.tagline)}
          </p>

          {/* Variant selector */}
          {(product.variants?.length ?? 0) > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Choose Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants!.map((v, i) => (
                  <button
                    key={v.label}
                    onClick={() => setVariantIndex(i)}
                    className="rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      background: variantIndex === i ? 'var(--primary)' : 'var(--card)',
                      color: variantIndex === i ? '#fff' : 'var(--foreground)',
                      borderColor: variantIndex === i ? 'var(--primary)' : 'var(--border)',
                    }}
                  >
                    {td(v.label)} — €{v.price.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price + qty + add */}
          <div className="mt-5 flex items-center gap-3">
            {/* Qty */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={soldOut}
                className="flex size-10 items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-40"
                aria-label="Decrease quantity">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} disabled={soldOut}
                className="flex size-10 items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-40"
                aria-label="Increase quantity">
                <Plus className="size-4" />
              </button>
            </div>

            {/* Add to cart — fills remaining space */}
            <button
              onClick={handleAdd}
              disabled={soldOut}
              className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: added ? '#10B981' : soldOut ? '#94A3B8' : 'var(--primary)' }}
            >
              {soldOut ? 'Sold Out'
                : added ? <><Check className="size-4" /> Added to Basket!</>
                : <><ShoppingBag className="size-4" /> Add to Basket — €{(variant?.price ?? 0) * qty > 0 ? ((variant?.price ?? 0) * qty).toFixed(2) : '0.00'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
export const ProductCard = memo(function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem, lines } = useCart()
  const { td } = useTranslation()
  const [variantIndex, setVariantIndex] = useState(0)
  const [qty] = useState(1)
  const [added, setAdded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const variant = product.variants?.[variantIndex] ?? product.variants?.[0]
  const soldOut = product.stock === 'Out of Stock'
  const stockStyle = STOCK_STYLES[product.stock] ?? STOCK_STYLES['In Stock']
  const stockLabel = product.stock === 'Low Stock' && typeof product.stockCount === 'number' 
    ? <span className="flex items-center gap-0.5 animate-pulse"><AlertTriangle className="size-2.5" />Only {product.stockCount} left!</span>
    : stockStyle.label

  // How many of this variant are already in the cart?
  const cartQty = lines
    .filter(l => l.product.id === product.id && l.variant.label === variant?.label)
    .reduce((sum, l) => sum + l.quantity, 0)
  const inCart = cartQty > 0

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (soldOut || !variant) return
    addItem(product, variant, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const animClass = index < 12
    ? `card-enter card-enter-${Math.min((index % 6) + 1, 6)}`
    : ''

  return (
    <>
      {/* ── Card ── */}
      <article
        onClick={() => setModalOpen(true)}
        className={`group flex flex-col h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${animClass}`}
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {/* Image — fixed 1:1 ratio, always same height */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1', background: 'var(--secondary)' }}>
          <Image
            src={product.image || PLACEHOLDER}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            placeholder="blur"
            blurDataURL={BLUR_DATA}
            loading="lazy"
          />
          {/* Origin badge */}
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur-sm">
            {ORIGIN_FLAG[product.origin] ?? '🌍'} {td(product.origin)}
          </span>
          {product.bestseller && (
            <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              <Star className="size-2.5 fill-current" /> Best
            </span>
          )}
        </div>

        {/* Body — fixed flex-col, price+CTA always at bottom */}
        <div className="flex flex-1 flex-col p-3">
          {/* Stock + diet row */}
          <div className="mb-2 flex items-start justify-between gap-1">
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${stockStyle.pill}`}>
              {stockLabel}
            </span>
            <div className="flex flex-wrap justify-end gap-0.5">
              {(product.diet ?? []).slice(0, 2).map(d => (
                <span key={d} className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-semibold text-slate-500">
                  {td(d)}
                </span>
              ))}
            </div>
          </div>

          {/* Name — clamped to 2 lines always */}
          <h3 className="text-sm font-bold leading-snug line-clamp-2 min-h-[2.5rem]"
            style={{ color: 'var(--foreground)' }}>
            {td(product.name)}
          </h3>

          {/* Tagline — clamped to 1 line */}
          <p className="mt-0.5 text-xs line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>
            {td(product.tagline)}
          </p>

          {/* Spacer pushes price+CTA to bottom */}
          <div className="flex-1" />

          {/* Variant + price */}
          <div className="mt-2 flex items-center justify-between gap-1">
            <div className="relative" onClick={e => e.stopPropagation()}>
              <select
                value={variantIndex}
                onChange={e => setVariantIndex(Number(e.target.value))}
                className="appearance-none cursor-pointer rounded-md border pl-2 pr-6 py-1 text-[10px] font-semibold outline-none transition-all"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--secondary)',
                  color: 'var(--foreground)',
                  height: 28,
                  lineHeight: '1',
                }}
              >
                {(product.variants ?? []).map((v, i) => (
                  <option key={v.label + i} value={i}>{td(v.label)}</option>
                ))}
              </select>
              {/* Custom chevron — absolutely positioned, pointer-events-none so clicks pass through to select */}
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center" style={{ zIndex: 1 }}>
                <ChevronDown className="size-3" style={{ color: 'var(--muted-foreground)' }} />
              </span>
            </div>
            <span className="font-serif text-base font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
              €{(variant?.price ?? product.price ?? 0).toFixed(2)}
            </span>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold text-white transition-all duration-200 disabled:opacity-50 hover:opacity-90 active:scale-95"
            style={{
              background: added ? '#10B981'
                : soldOut ? '#94A3B8'
                : inCart ? '#0F2044'
                : 'var(--primary)',
            }}
          >
            {soldOut ? 'Sold Out'
              : added ? <><Check className="size-3" /> Added!</>
              : inCart ? <><Check className="size-3" /> In Cart ({cartQty})</>
              : <><ShoppingBag className="size-3" /> Add &middot; €{(variant?.price ?? product.price ?? 0).toFixed(2)}</>}
          </button>
        </div>
      </article>

      {/* ── Detail Modal ── */}
      {modalOpen && (
        <ProductModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
})
