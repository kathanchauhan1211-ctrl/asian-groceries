'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { PromoSlider } from '@/components/promo-slider'
import { CollectionCards, type CollectionCategory } from '@/components/collection-cards'
import { ProductCatalog } from '@/components/product-catalog'
import { HorizontalRow } from '@/components/HorizontalRow'
import { SwipeableCategoryBar } from '@/components/swipeable-category-bar'
import { useProducts } from '@/lib/use-products'
import { Filter } from 'lucide-react'
import HomepageStatus from '@/components/homepage-status'

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

  // Derive products for the active collection row
  const activeRowData = useMemo(() => {
    if (hasActiveFilter) return null
    if (!allProducts.length) return null

    let title = 'Recommended for You'
    let items = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 12) // Random default

    if (activeCategory === 'new-arrivals') {
      title = 'New Arrivals'
      // Simple mock for "recent" - just reverse the list
      items = [...allProducts].reverse().slice(0, 12)
    } else if (activeCategory === 'sale') {
      title = 'Sale'
      // Mock sale items (e.g. cheapest items)
      items = [...allProducts].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 12)
    } else if (activeCategory === 'best-offer') {
      title = "Today's Best Offer"
      // Mock best offers
      items = [...allProducts].filter(p => p.price < 5).slice(0, 12)
    } else if (activeCategory === 'bestsellers') {
      title = 'Bestsellers'
      items = [...allProducts].filter(p => p.bestseller).slice(0, 12)
    }

    if (items.length === 0) items = [...allProducts].slice(0, 12) // Fallback

    return { title, items }
  }, [allProducts, activeCategory, hasActiveFilter])

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

      {/* ═══ Active Collection Row (Swipeable) ═══ */}
      {!hasActiveFilter && activeRowData && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mb-8">
          <HorizontalRow
            title={activeRowData.title}
            items={activeRowData.items}
            viewAllHref={`/?sort=${activeCategory === 'new-arrivals' ? 'newest' : 'default'}`}
          />
        </div>
      )}

      {/* ═══ Swipeable Category Bar — reads/writes URL params ═══ */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
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

      {/* ═══ Full product catalog + filter grid — filter bar is always visible, grid only when active ═══ */}
      <ProductCatalog hideGridWhenUnfiltered={!hasActiveFilter} />
    </>
  )
}
