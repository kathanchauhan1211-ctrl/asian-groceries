'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PromoSlider } from '@/components/promo-slider'
import { CollectionCards, type CollectionCategory } from '@/components/collection-cards'
import { ProductCatalog } from '@/components/product-catalog'
import { HorizontalRow } from '@/components/HorizontalRow'
import { SwipeableCategoryBar } from '@/components/swipeable-category-bar'
import { useProducts } from '@/lib/use-products'
import { Filter } from 'lucide-react'
import HomepageStatus from '@/components/homepage-status'
import { useShopCategoryDoc, type ShopCategoryKey } from '@/lib/use-shop-categories'
import { clientDb } from '@/lib/firebase-client'

// ─── Helper: merge pinned + auto products for a category popup ────────────────
function useCategoryFeed(
  key: ShopCategoryKey,
  allProducts: ReturnType<typeof useProducts>['products'],
  autoFn: (products: typeof allProducts) => typeof allProducts,
) {
  const catDoc = useShopCategoryDoc(key, clientDb)

  return useMemo(() => {
    if (!allProducts.length) return []
    const maxItems = catDoc?.maxItems ?? 15

    // Pinned products (from admin) — appear first
    const pinned = (catDoc?.pinnedProductIds ?? [])
      .map(id => allProducts.find(p => p.id === id))
      .filter(Boolean) as typeof allProducts

    // Auto-rule products, excluding already-pinned ones
    const pinnedSet = new Set(catDoc?.pinnedProductIds ?? [])
    const auto = autoFn(allProducts).filter(p => !pinnedSet.has(p.id))

    return [...pinned, ...auto].slice(0, maxItems)
  }, [catDoc, allProducts, autoFn])
}

export default function PageContent() {
  const searchParams = useSearchParams()
  const { products: allProducts } = useProducts()
  const [activeCategory, setActiveCategory] = useState<CollectionCategory | null>(null)

  // Detect if ANY filter/search is active
  const hasActiveFilter = Boolean(
    searchParams.get('q') ||
    searchParams.get('category') ||
    searchParams.get('origin') ||
    searchParams.get('brand') ||
    searchParams.get('diet') ||
    searchParams.get('stock') ||
    searchParams.get('priceMin') ||
    searchParams.get('priceMax') ||
    (searchParams.get('sort') && searchParams.get('sort') !== 'default')
  )

  // ─── Feed data per category (pinned first, then auto) ────────────────────
  const bestOfferFeed = useCategoryFeed(
    'best-offer',
    allProducts,
    ps => [...ps].filter(p => (p.price ?? 0) < 5).sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
  )
  const bestsellerFeed = useCategoryFeed(
    'bestsellers',
    allProducts,
    ps => ps.filter(p => p.bestseller),
  )
  const newArrivalsFeed = useCategoryFeed(
    'new-arrivals',
    allProducts,
    ps => [...ps].reverse(),
  )
  const saleFeed = useCategoryFeed(
    'sale',
    allProducts,
    ps => [...ps].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
  )

  // ─── Recommended rows (not category-popup related) ────────────────────────
  const activeRowData = useMemo(() => {
    if (hasActiveFilter) return null
    if (!allProducts.length) return null

    const random = [...allProducts].sort(() => 0.5 - Math.random())
    const row1 = { title: 'Recommended for You', items: random.slice(0, 12) }
    const row2 = { title: 'Trending Now', items: random.slice(12, 24) }
    const row3 = { title: 'Weekly Deals', items: [...allProducts].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 12) }

    return { row1, row2, row3 }
  }, [allProducts, hasActiveFilter])

  // ─── Popup feed for the active category ──────────────────────────────────
  const popupData = useMemo(() => {
    if (!activeCategory) return null

    const feedMap: Record<CollectionCategory, { title: string; items: typeof allProducts }> = {
      'new-arrivals': { title: 'New Arrivals', items: newArrivalsFeed },
      'sale':         { title: 'Sale',          items: saleFeed },
      'best-offer':   { title: "Today's Best Offer", items: bestOfferFeed },
      'bestsellers':  { title: 'Bestsellers',    items: bestsellerFeed },
    }

    const entry = feedMap[activeCategory]
    if (!entry) return null
    // Fallback if feed is empty
    const items = entry.items.length > 0 ? entry.items : allProducts.slice(0, 12)
    return { title: entry.title, items }
  }, [activeCategory, bestOfferFeed, bestsellerFeed, newArrivalsFeed, saleFeed, allProducts])

  return (
    <>
      {/* ═══ Promo sections (always visible) ═══ */}
      <HomepageStatus />
      <PromoSlider />

      {/* ═══ New Vertical Collection Cards ═══ */}
      {!hasActiveFilter && (
        <CollectionCards
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      )}

      {/* ═══ Swipeable Category Bar — reads/writes URL params ═══ */}
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-2 pb-2">
        <SwipeableCategoryBar
          prependFilterButton={
            <a
              href="#shop"
              className="snap-start shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold transition-all border bg-card text-foreground hover:-translate-y-0.5 active:scale-95 shadow-sm"
              style={{ borderColor: 'var(--border)' }}
              onClick={e => {
                e.preventDefault()
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Filter className="size-4" style={{ color: 'var(--primary)' }} />
              Filters
            </a>
          }
        />
      </div>

      {/* ═══ Full product catalog ═══ */}
      <ProductCatalog hideGridWhenUnfiltered={!hasActiveFilter} />

      {/* ═══ 3 Recommended Rows ═══ */}
      {!hasActiveFilter && activeRowData && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mb-8 flex flex-col gap-2">
          <HorizontalRow title={activeRowData.row1.title} items={activeRowData.row1.items} viewAllHref="/?sort=default" />
          <HorizontalRow title={activeRowData.row2.title} items={activeRowData.row2.items} viewAllHref="/?sort=bestseller" />
          <HorizontalRow title={activeRowData.row3.title} items={activeRowData.row3.items} viewAllHref="/?sort=price-asc" />
        </div>
      )}

      {/* ═══ Category Popup (Modal) ═══ */}
      {activeCategory && popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div
            className="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveCategory(null)}
              className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="px-4 py-8 md:px-8">
              <HorizontalRow
                title={popupData.title}
                items={popupData.items}
                viewAllHref={`/?sort=${activeCategory === 'new-arrivals' ? 'newest' : 'default'}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
