'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { PromoSlider } from '@/components/promo-slider'
import { CollectionCards } from '@/components/collection-cards'
import { ProductCatalog } from '@/components/product-catalog'
import { HorizontalRow } from '@/components/HorizontalRow'
import { SwipeableCategoryBar } from '@/components/swipeable-category-bar'
import { useProducts } from '@/lib/use-products'
import { Filter } from 'lucide-react'
import HomepageStatus from '@/components/homepage-status'
import { useFeaturedCollections } from '@/lib/use-featured-collections'

export default function PageContent() {
  const searchParams = useSearchParams()
  const { products: allProducts } = useProducts()

  // Fetch dynamic collections (formerly feeds) from Firestore
  const { collections } = useFeaturedCollections(allProducts)

  // Track which collection popup is open (by ID)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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

  // ─── Active popup feed ────────────────────────────────────────────────────
  const popupData = useMemo(() => {
    if (!activeCategory) return null
    return collections.find(c => c.id === activeCategory) || null
  }, [activeCategory, collections])

  return (
    <>
      {/* ═══ Promo sections (always visible) ═══ */}
      <HomepageStatus />
      <PromoSlider />

      {/* ═══ Collection Cards (Dynamic) ═══ */}
      {!hasActiveFilter && (
        <CollectionCards
          collections={collections}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>

            <div className="overflow-y-auto px-4 py-6 md:px-8">
              <HorizontalRow
                title={popupData.title}
                items={popupData.items}
                viewAllHref={popupData.viewAllHref}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
