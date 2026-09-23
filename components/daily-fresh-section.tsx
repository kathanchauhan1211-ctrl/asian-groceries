'use client'

/**
 * components/daily-fresh-section.tsx
 *
 * "Daily Fresh" homepage section — two swipeable product rows:
 *   Row 1 → Fresh Vegetables (category label contains "Vegetable" or "Produce")
 *   Row 2 → Fresh Fruits     (category label contains "Fruit")
 *
 * Data pipeline:
 *  - Reads live category list from useCategoryFilters() — same source as the shop
 *  - Reads all products from useProducts() — same hook the shop uses
 *  - Filters products client-side by matching category label
 *
 * Admin just needs to assign products to "Vegetables & Produce" or "Fruits"
 * categories; they'll automatically appear here with zero extra wiring.
 */

import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, Leaf } from 'lucide-react'
import Link from 'next/link'
import { useProducts } from '@/lib/use-products'
import { useCategoryFilters } from '@/lib/use-category-filters'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'

// ─── Category-matching helper ─────────────────────────────────────────────────

/** Finds the first live category label whose text contains any of the given keywords. */
function findCategoryLabel(labels: string[], keywords: string[]): string | null {
  const kw = keywords.map(k => k.toLowerCase())
  return labels.find(l => kw.some(k => l.toLowerCase().includes(k))) ?? null
}

// ─── Single horizontal-scroll row ────────────────────────────────────────────

function FreshRow({
  title,
  emoji,
  accentColor,
  bgColor,
  products,
  viewAllCategory,
}: {
  title: string
  emoji: string
  accentColor: string
  bgColor: string
  products: Product[]
  viewAllCategory: string | null
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  const viewAllHref = viewAllCategory
    ? `/shop?category=${encodeURIComponent(viewAllCategory)}`
    : '/shop'

  if (products.length === 0) return null

  return (
    <div className="relative">
      {/* Row header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm"
            style={{ background: bgColor }}
          >
            {emoji}
          </div>
          <div>
            <h3 className="text-lg font-black leading-tight tracking-tight" style={{ color: 'var(--foreground)' }}>
              {title}
            </h3>
            <p className="text-[12px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
              {products.length} item{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop arrow nav */}
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
            href={viewAllHref}
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

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function FreshRowSkeleton({ label }: { label: string }) {
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

// ─── Main exported section ────────────────────────────────────────────────────

export function DailyFreshSection() {
  const { products: allProducts, loading } = useProducts()
  const { categories, loading: catLoading } = useCategoryFilters()

  const categoryLabels = useMemo(() => categories.map(c => c.label), [categories])

  // Resolve live category labels that correspond to vegetables and fruits
  const vegLabel   = useMemo(() => findCategoryLabel(categoryLabels, ['vegetable', 'produce']), [categoryLabels])
  const fruitLabel = useMemo(() => findCategoryLabel(categoryLabels, ['fruit']), [categoryLabels])

  // Filter products accordingly
  const vegProducts = useMemo(
    () => vegLabel ? allProducts.filter(p => p.category === vegLabel) : [],
    [allProducts, vegLabel],
  )
  const fruitProducts = useMemo(
    () => fruitLabel ? allProducts.filter(p => p.category === fruitLabel) : [],
    [allProducts, fruitLabel],
  )

  const isLoading   = loading || catLoading
  const hasContent  = vegProducts.length > 0 || fruitProducts.length > 0

  // Hide entirely once loaded if there is nothing to show
  if (!isLoading && !hasContent) return null

  return (
    <section className="w-full py-8 md:py-10" id="daily-fresh">
      <div className="mx-auto max-w-7xl px-4 md:px-6">

        {/* Section header */}
        <div className="mb-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{
              background: 'color-mix(in srgb, #22c55e 12%, transparent)',
              color: '#16a34a',
              border: '1px solid color-mix(in srgb, #22c55e 25%, transparent)',
            }}
          >
            <Leaf className="size-3" />
            Farm to Door
          </span>
          <h2
            className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Daily Fresh 🌿
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Freshly stocked vegetables &amp; fruits, delivered to your door
          </p>
        </div>

        {/* Rows */}
        <div className="space-y-10">
          {isLoading ? (
            <>
              <FreshRowSkeleton label="Fresh Vegetables" />
              <FreshRowSkeleton label="Fresh Fruits" />
            </>
          ) : (
            <>
              <FreshRow
                title="Fresh Vegetables"
                emoji="🥦"
                accentColor="#16a34a"
                bgColor="color-mix(in srgb, #16a34a 15%, var(--secondary))"
                products={vegProducts}
                viewAllCategory={vegLabel}
              />
              <FreshRow
                title="Fresh Fruits"
                emoji="🍎"
                accentColor="#dc2626"
                bgColor="color-mix(in srgb, #dc2626 12%, var(--secondary))"
                products={fruitProducts}
                viewAllCategory={fruitLabel}
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
