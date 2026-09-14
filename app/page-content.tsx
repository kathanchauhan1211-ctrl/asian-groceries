'use client'

import { useState, useMemo, useCallback } from 'react'
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

// ─── Merged feed hook: pinned products FIRST, then auto-rule products ─────────
// Uses stable callback refs to avoid stale closures breaking memoization
function useCategoryFeed(
  key: ShopCategoryKey,
  allProducts: ReturnType<typeof useProducts>['products'],
  autoRule: 'price-asc-under5' | 'bestseller' | 'newest' | 'price-asc',
) {
  const catDoc = useShopCategoryDoc(key, clientDb)

  return useMemo(() => {
    if (!allProducts.length) return []
    const maxItems = catDoc?.maxItems ?? 15
    const pinnedIds: string[] = catDoc?.pinnedProductIds ?? []

    // Pinned products — preserve order the admin set
    const pinnedMap = new Map(allProducts.map(p => [p.id, p]))
    const pinned = pinnedIds.map(id => pinnedMap.get(id)).filter(Boolean) as typeof allProducts

    // Auto products — exclude already-pinned
    const pinnedSet = new Set(pinnedIds)
    let auto: typeof allProducts = []
    if (autoRule === 'price-asc-under5') {
      auto = [...allProducts].filter(p => (p.price ?? 0) < 5).sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    } else if (autoRule === 'bestseller') {
      auto = allProducts.filter(p => p.bestseller)
    } else if (autoRule === 'newest') {
      auto = [...allProducts].reverse()
    } else if (autoRule === 'price-asc') {
      auto = [...allProducts].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    }
    auto = auto.filter(p => !pinnedSet.has(p.id))

    return [...pinned, ...auto].slice(0, maxItems)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catDoc, allProducts, autoRule])
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

  // ─── Category feeds — real-time via Firestore onSnapshot ─────────────────
  const bestOfferFeed   = useCategoryFeed('best-offer',   allProducts, 'price-asc-under5')
  const bestsellerFeed  = useCategoryFeed('bestsellers',  allProducts, 'bestseller')
  const newArrivalsFeed = useCategoryFeed('new-arrivals', allProducts, 'newest')
  const saleFeed        = useCategoryFeed('sale',         allProducts, 'price-asc')

  // ─── Recommended rows ────────────────────────────────────────────────────
  const activeRowData = useMemo(() => {
    if (hasActiveFilter || !allProducts.length) return null
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random())
    return {
      row1: { title: 'Recommended for You', items: shuffled.slice(0, 12) },
      row2: { title: 'Trending Now',        items: shuffled.slice(12, 24) },
      row3: { title: 'Weekly Deals',        items: [...allProducts].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 12) },
    }
  }, [allProducts, hasActiveFilter])

  // ─── Active popup feed ────────────────────────────────────────────────────
  const popupData = useMemo(() => {
    if (!activeCategory) return null
    const feedMap: Record<CollectionCategory, { title: string; items: typeof allProducts }> = {
      'best-offer':   { title: "Today's Best Offer", items: bestOfferFeed },
      'bestsellers':  { title: 'Bestsellers',         items: bestsellerFeed },
      'new-arrivals': { title: 'New Arrivals',        items: newArrivalsFeed },
      'sale':         { title: 'Sale',                items: saleFeed },
    }
    const entry = feedMap[activeCategory]
    if (!entry) return null
    // Fallback: if feed is totally empty, show all products
    return { title: entry.title, items: entry.items.length > 0 ? entry.items : allProducts.slice(0, 12) }
  }, [activeCategory, bestOfferFeed, bestsellerFeed, newArrivalsFeed, saleFeed, allProducts])

  return (
    <>
      {/* ═══ Promo sections (always visible) ═══ */}
      <HomepageStatus />
      <PromoSlider />

      {/* ═══ Collection Cards ═══ */}
      {!hasActiveFilter && (
        <CollectionCards
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      )}

      {/* ═══ Swipeable Category Bar ═══ */}
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

      {/* ═══ Recommended Rows ═══ */}
      {!hasActiveFilter && activeRowData && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mb-8 flex flex-col gap-2">
          <HorizontalRow title={activeRowData.row1.title} items={activeRowData.row1.items} viewAllHref="/?sort=default" />
          <HorizontalRow title={activeRowData.row2.title} items={activeRowData.row2.items} viewAllHref="/?sort=bestseller" />
          <HorizontalRow title={activeRowData.row3.title} items={activeRowData.row3.items} viewAllHref="/?sort=price-asc" />
        </div>
      )}

      {/* ═══ Category Popup Modal ═══ */}
      {activeCategory && popupData && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveCategory(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            {/* Close button */}
            <button
              onClick={() => setActiveCategory(null)}
              className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="overflow-y-auto px-4 py-6 md:px-8">
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
