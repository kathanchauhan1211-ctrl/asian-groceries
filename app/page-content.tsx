'use client'

import { useSearchParams } from 'next/navigation'
import { PromoSlider } from '@/components/promo-slider'
import { OffersStrip } from '@/components/offers-strip'
import { ProductCatalog } from '@/components/product-catalog'
import { HorizontalRow } from '@/components/HorizontalRow'
import { SwipeableCategoryBar } from '@/components/swipeable-category-bar'
import { useProducts } from '@/lib/use-products'
import { useFeaturedCollections } from '@/lib/use-featured-collections'
import { Filter } from 'lucide-react'
import HomepageStatus from '@/components/homepage-status'

/**
 * PageContent — homepage shell.
 *
 * Pipeline:
 *  - SwipeableCategoryBar reads/writes ?category= URL param
 *  - ProductCatalog reads all filter params from URL
 *  - HorizontalRow carousels come from Firestore 'collections' (real-time via
 *    useFeaturedCollections). Falls back to 3 hardcoded carousels when empty.
 *  - Carousels collapse when ANY filter is active so users jump to filtered grid
 */
export default function PageContent() {
  const searchParams = useSearchParams()
  const { products: allProducts } = useProducts()

  // Live featured collections from Firestore 'collections'
  // Falls back to built-in 3 carousels when Firestore collection is empty
  const { collections } = useFeaturedCollections(allProducts)

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

  return (
    <>
      {/* ═══ Promo sections (always visible) ═══ */}
      <HomepageStatus />
      <PromoSlider />
      <OffersStrip />

      {/* ═══ Swipeable Category Bar — reads/writes URL params ═══ */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SwipeableCategoryBar
          prependFilterButton={
            <a
              href="#shop"
              className="snap-start shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold transition-all border bg-card text-foreground hover:-translate-y-0.5 active:scale-95"
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

      {/* ═══ Featured Carousels — live from Firestore, hidden when filter active ═══ */}
      {!hasActiveFilter && collections.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {collections.map(col => (
            <HorizontalRow
              key={col.id}
              title={col.title}
              items={col.items}
              viewAllHref={col.viewAllHref}
            />
          ))}
        </div>
      )}

      {/* ═══ Full product catalog + filter grid — grid only shows when a filter/search is active ═══ */}
      <ProductCatalog hideGridWhenUnfiltered={!hasActiveFilter} />
    </>
  )
}
