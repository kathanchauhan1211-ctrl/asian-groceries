'use client'

import { useState, useMemo } from 'react'
import { PromoSlider } from '@/components/promo-slider'
import { CollectionCards } from '@/components/collection-cards'
import { BannerModule } from '@/components/banner-module'
import { BrandCatalog } from '@/components/brand-catalog'
import { HorizontalRow } from '@/components/HorizontalRow'
import { DailyFreshSection } from '@/components/daily-fresh-section'
import { useProducts } from '@/lib/use-products'
import HomepageStatus from '@/components/homepage-status'
import { useFeaturedCollections } from '@/lib/use-featured-collections'

export default function PageContent() {
  const { products: allProducts, loading: productsLoading } = useProducts()

  // Fetch dynamic collections (formerly feeds) from Firestore
  const { collections } = useFeaturedCollections(allProducts)

  // Track which collection popup is open (by ID)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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

      {/* ═══ Daily Fresh — curated rows from admin ═══ */}
      <DailyFreshSection allProducts={allProducts} productsLoading={productsLoading} />

      {/* ═══ Collection Cards (Dynamic) ═══ */}
      <CollectionCards
        collections={collections}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* ═══ Banners (Dynamic) ═══ */}
      <BannerModule />

      {/* ═══ Brand Catalog ═══ */}
      <BrandCatalog />

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
