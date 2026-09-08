'use client'

import { memo, useState, useEffect } from 'react'
import { Check, Minus, Plus, ShoppingBag, Star, X, ChevronDown, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { ORIGIN_FLAG, type Product } from '@/lib/products'
import { Button } from '@/components/ui/button'
import { LiquidGlassBox } from '@/components/ui/liquid-glass-box'

const STOCK_STYLES: Record<Product['stock'], { pill: string; label: React.ReactNode }> = {
  'In Stock':     { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'In Stock' },
  'Low Stock':    { pill: 'bg-amber-50  text-amber-700  border border-amber-200',  label: <span className="flex items-center gap-0.5"><AlertTriangle className="size-2.5" />Low Stock</span> },
  'Out of Stock': { pill: 'bg-rose-50   text-rose-700   border border-rose-200',   label: 'Sold Out' },
  'Sold Out':     { pill: 'bg-rose-50   text-rose-700   border border-rose-200',   label: 'Sold Out' },
}

// Tiny base64 grey blur placeholder — prevents CLS while real image loads
const BLUR_DATA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f8fafc' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='64' fill='%23cbd5e1'%3E%F0%9F%93%A6%3C/text%3E%3C/svg%3E`

// ─── Product Detail Modal ──────────────────────────────────────────────────────
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

  function handleAdd() {
    if (soldOut || !variant) return
    addItem(product, variant, qty)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 900)
  }

  return (
    <LiquidGlassBox
      modal
      size="lg"
      onBackdropClick={onClose}
      className="overflow-hidden"
      style={{ background: 'var(--card)', maxHeight: '92dvh', overflowY: 'auto' }}
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
        <Button
          onClick={onClose}
          variant="glass-dark"
          size="icon-sm"
          className="absolute top-3 right-3 rounded-full bg-black/40 backdrop-blur-sm"
          aria-label="Close"
        >
          <X className="size-4" />
        </Button>
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
        <h2 className="font-sans text-xl font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
          {td(product.name)}
        </h2>
        {product.brand && (
          <p className="mt-0.5 text-sm font-medium text-orange-500">{product.brand}</p>
        )}
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {td(product.tagline)}
        </p>

        {/* Variant selector */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Choose Size</p>
            <div className="flex flex-wrap gap-2">
              {product.variants!.map((v, i) => (
                <Button
                  key={v.label}
                  onClick={() => setVariantIndex(i)}
                  variant={variantIndex === i ? 'default' : 'glass-light'}
                  size="sm"
                  className="rounded-full"
                >
                  {td(v.label)} — €{v.price.toFixed(2)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Price + qty + add */}
        <div className="mt-5 flex items-center gap-3">
          {/* Qty stepper */}
          <div
            className="flex items-center rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}
          >
            <Button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={soldOut}
              variant="ghost"
              size="icon-sm"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-8 text-center text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>{qty}</span>
            <Button
              onClick={() => setQty(q => q + 1)}
              disabled={soldOut}
              variant="ghost"
              size="icon-sm"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Add to cart */}
          <Button
            onClick={handleAdd}
            disabled={soldOut}
            variant={added ? 'emerald' : soldOut ? 'secondary' : 'default'}
            size="xl"
            className="flex-1"
          >
            {soldOut ? 'Sold Out'
              : added ? <><Check className="size-4" /> Added to Basket!</>
              : <><ShoppingBag className="size-4" /> Add to Basket — €{((variant?.price ?? 0) * qty).toFixed(2)}</>
            }
          </Button>
        </div>
      </div>
    </LiquidGlassBox>
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
      <div className={`group relative flex flex-col h-full ${animClass}`}>
        {/* Image Container - Enforce perfect square with exact corner rounding matching the reference */}
        <div className="relative w-full aspect-square overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800">
          <Image
            src={product.image || PLACEHOLDER}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-center group-hover:opacity-75 transition-opacity"
            placeholder="blur"
            blurDataURL={BLUR_DATA}
            loading="lazy"
          />
        </div>
        
        {/* Text Details - Flex grow to push button down, truncate texts to prevent uneven heights */}
        <div className="mt-4 flex justify-between gap-4 flex-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
              <button 
                onClick={() => setModalOpen(true)}
                className="focus:outline-none text-left w-full truncate"
                title={td(product.name)}
                aria-label={`View details for ${td(product.name)}`}
              >
                <span aria-hidden="true" className="absolute inset-0 z-0" />
                {td(product.name)}
              </button>
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
              {variant?.label ? td(variant.label) : td(product.tagline)}
            </p>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white shrink-0">
            €{(variant?.price ?? product.price ?? 0).toFixed(2)}
          </p>
        </div>

        {/* Add button - Aligned cleanly at the bottom */}
        <div className="mt-4 relative z-10">
          <Button
            onClick={handleAdd}
            disabled={soldOut}
            variant={added ? 'emerald' : soldOut ? 'secondary' : inCart ? 'glass-light' : 'default'}
            size="sm"
            className="w-full rounded-md"
          >
            {soldOut ? 'Sold Out'
              : added ? <><Check className="size-3" /> Added!</>
              : inCart ? <><Check className="size-3" /> In Cart ({cartQty})</>
              : <><ShoppingBag className="size-3" /> Add</>}
          </Button>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {modalOpen && (
        <ProductModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
})
