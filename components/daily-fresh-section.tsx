'use client'

/**
 * components/daily-fresh-section.tsx
 *
 * Homepage "Daily Fresh" section.
 * Reads from Firestore `dailyFresh` collection (curated by admin).
 * Resolves product details from the allProducts array passed in from page-content.tsx.
 */

import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useDailyFresh } from '@/lib/use-daily-fresh'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'

// ─── Single row ────────────────────────────────────────────────────────────────

function FreshRow({
  title,
  emoji,
  accentColor,
  bgColor,
  products,
  viewAllId,
}: {
  title: string
  emoji: string
  accentColor: string
  bgColor: string
  products: Product[]
  viewAllId: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })

  if (products.length === 0) return null

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm"
            style={{ background: bgColor }}
          >
            {emoji}
          </div>
          <div>
            <h3
              className="text-lg font-black leading-tight tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              {title}
            </h3>
            <p className="text-[12px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {products.length} item{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex size-8 items-center justify-center rounded-full border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="size-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex size-8 items-center justify-center rounded-full border transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="size-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <Link
            href={`/shop`}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition-all hover:opacity-85 active:scale-95"
            style={{ background: accentColor, color: '#fff' }}
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Swipeable carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[47vw] min-w-[47vw] sm:w-[33vw] sm:min-w-[33vw] md:w-[220px] md:min-w-[220px] lg:w-[240px] lg:min-w-[240px]"
          >
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FreshRowSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="size-10 rounded-2xl animate-pulse" style={{ background: 'var(--secondary)' }} />
        <div className="space-y-1.5">
          <div className="h-4 w-40 rounded-md animate-pulse" style={{ background: 'var(--secondary)' }} />
          <div className="h-3 w-24 rounded-md animate-pulse" style={{ background: 'var(--secondary)' }} />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-[47vw] sm:w-[33vw] md:w-[220px] rounded-2xl overflow-hidden animate-pulse"
            style={{ background: 'var(--secondary)' }}
          >
            <div className="aspect-square" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-3/4 rounded" style={{ background: 'var(--border)' }} />
              <div className="h-3 w-1/2 rounded" style={{ background: 'var(--border)' }} />
              <div className="h-8 w-full rounded-lg mt-1" style={{ background: 'var(--border)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Row config (colour per row id) ──────────────────────────────────────────

const ROW_STYLE: Record<string, { accentColor: string; bgColor: string; emoji: string }> = {
  vegetables: {
    accentColor: '#16a34a',
    bgColor: 'color-mix(in srgb, #16a34a 18%, var(--secondary))',
    emoji: '🥦',
  },
  fruits: {
    accentColor: '#dc2626',
    bgColor: 'color-mix(in srgb, #dc2626 15%, var(--secondary))',
    emoji: '🍎',
  },
}

const DEFAULT_STYLE = {
  accentColor: '#F97316',
  bgColor: 'color-mix(in srgb, #F97316 15%, var(--secondary))',
  emoji: '🌿',
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function DailyFreshSection({
  allProducts,
  productsLoading,
}: {
  allProducts: Product[]
  productsLoading: boolean
}) {
  const { rows, loading: freshLoading } = useDailyFresh()

  // Build a fast lookup map
  const productMap = useMemo(
    () => new Map(allProducts.map(p => [p.id, p])),
    [allProducts],
  )

  // Resolve products for each row
  const resolvedRows = useMemo(
    () =>
      rows.map(row => ({
        ...row,
        products: (row.productIds ?? [])
          .map(id => productMap.get(id))
          .filter(Boolean) as Product[],
      })),
    [rows, productMap],
  )

  const isLoading  = productsLoading || freshLoading
  const hasContent = resolvedRows.some(r => r.products.length > 0)

  // Show while loading (skeleton) OR when Firestore docs exist (even with no products pinned yet)
  // Only hide if fully settled AND no rows exist in Firestore at all
  const hasDocs    = rows.length > 0
  const everShown  = useRef(false)
  if (hasDocs || hasContent) everShown.current = true
  if (!isLoading && !everShown.current) return null

  return (
    <section className="w-full py-8 md:py-10" id="daily-fresh">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Heading */}
        <div className="mb-8">
          <h2
            className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Daily Fresh 🌿
          </h2>
        </div>

        {/* Rows */}
        <div className="space-y-10">
          {isLoading ? (
            <>
              <FreshRowSkeleton />
              <FreshRowSkeleton />
            </>
          ) : (
            resolvedRows.map(row => {
              const style = ROW_STYLE[row.id] ?? DEFAULT_STYLE
              return (
                <FreshRow
                  key={row.id}
                  title={row.title}
                  emoji={row.emoji || style.emoji}
                  accentColor={style.accentColor}
                  bgColor={style.bgColor}
                  products={row.products}
                  viewAllId={row.id}
                />
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
