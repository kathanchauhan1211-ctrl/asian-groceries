'use client'

import { useState } from 'react'
import { Check, Minus, Plus, ShoppingBag, Star } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { ORIGIN_FLAG, type Product } from '@/lib/products'
import { Button } from '@/components/ui/button'
import { LiquidGlassBox } from '@/components/ui/liquid-glass-box'

const STOCK_STYLES: Record<Product['stock'], string> = {
  'In Stock': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Low Stock': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Out of Stock': 'bg-rose-50 text-rose-700 border border-rose-200',
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart()
  const [variantIndex, setVariantIndex] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const variant = product.variants[variantIndex]
  const soldOut = product.stock === 'Out of Stock'

  function handleAdd() {
    if (soldOut) return
    addItem(product, variant, qty)
    setAdded(true)
    setQty(1)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-accent/50 hover:shadow-md card-enter card-enter-${Math.min((index % 6) + 1, 6)}`}
    >
      {/* Image */}
      <LiquidGlassBox className="relative aspect-square bg-slate-50 border-b border-slate-100 rounded-b-none">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            // fallback image using placehold.co
            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/F97316/ffffff?text=${encodeURIComponent(product.name.substring(0,6))}`;
          }}
        />
        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {/* Origin flag badge */}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm border border-slate-200 backdrop-blur-sm">
          <span aria-hidden>{ORIGIN_FLAG[product.origin]}</span>
          {product.origin}
        </span>
        {product.bestseller && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Star className="size-3 fill-current" />
            Bestseller
          </span>
        )}
      </LiquidGlassBox>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${STOCK_STYLES[product.stock]}`}
          >
            {product.stock === 'Low Stock' ? '⚠️ 3 Bags Left' : product.stock}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            {product.diet.map((d) => (
              <span
                key={d}
                className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <h3 className="font-sans text-sm font-bold leading-snug text-slate-900 text-balance group-hover:text-accent transition-colors duration-200">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.tagline}</p>

        {/* Variant + price */}
        <div className="mt-auto pt-3 sm:pt-4 flex items-center justify-between gap-2">
          <label className="sr-only" htmlFor={`variant-${product.id}`}>
            Choose size
          </label>
          <div className="relative">
            <select
              id={`variant-${product.id}`}
              value={variantIndex}
              onChange={(e) => setVariantIndex(Number(e.target.value))}
              className="appearance-none cursor-pointer rounded-md border border-slate-200 bg-slate-50 pl-2.5 pr-6 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-all duration-200 focus:border-accent focus:ring-0 hover:border-accent/60 hover:bg-white"
            >
              {product.variants.map((v, i) => (
                <option key={v.label} value={i}>
                  {v.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="size-3" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          <span className="font-serif text-lg font-bold tabular-nums text-slate-900">
            €{variant.price.toFixed(2)}
          </span>
        </div>

        {/* Add to cart block */}
        <div className="mt-3 flex items-stretch gap-2">
          <div className="flex items-center rounded-md border border-slate-300 bg-slate-50 shadow-sm">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={soldOut}
              className="flex size-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-xs font-bold tabular-nums text-slate-900">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              disabled={soldOut}
              className="flex size-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <Button
            onClick={handleAdd}
            disabled={soldOut}
            variant={added ? 'secondary' : 'default'}
            className="flex-1 font-bold text-xs shadow-sm h-9"
          >
            {soldOut ? (
              'Sold Out'
            ) : added ? (
              <>
                <Check className="size-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="size-3.5" /> Add
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
