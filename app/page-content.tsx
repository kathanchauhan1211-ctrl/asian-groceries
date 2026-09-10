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

    const random = [...allProducts].sort(() => 0.5 - Math.random())
    const row1 = { title: 'Recommended for You', items: random.slice(0, 12) }
    const row2 = { title: 'Trending Now', items: random.slice(12, 24) }
    const row3 = { title: 'Weekly Deals', items: [...allProducts].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 12) }
    
    return { row1, row2, row3 }
  }, [allProducts, hasActiveFilter])

  // Derive products for the popup category
  const popupData = useMemo(() => {
    if (!activeCategory || !allProducts.length) return null

    let title = ''
    let items: typeof allProducts = []

    if (activeCategory === 'new-arrivals') {
      title = 'New Arrivals'
      items = [...allProducts].reverse().slice(0, 12)
    } else if (activeCategory === 'sale') {
      title = 'Sale'
      items = [...allProducts].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 12)
    } else if (activeCategory === 'best-offer') {
      title = "Today's Best Offer"
      items = [...allProducts].filter(p => p.price < 5).slice(0, 12)
    } else if (activeCategory === 'bestsellers') {
      title = 'Bestsellers'
      items = [...allProducts].filter(p => p.bestseller).slice(0, 12)
    }

    if (items.length === 0) items = [...allProducts].slice(0, 12)

    return { title, items }
  }, [allProducts, activeCategory])

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

      {/* ═══ Full product catalog (Search & Grid) ═══ */}
      {/* Placed here so Search is below Swipeable Categories but above Recommended rows */}
      <ProductCatalog hideGridWhenUnfiltered={!hasActiveFilter} />

      {/* ═══ 3 Separate Recommended Rows ═══ */}
      {!hasActiveFilter && activeRowData && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 mb-8 flex flex-col gap-2">
          <HorizontalRow
            title={activeRowData.row1.title}
            items={activeRowData.row1.items}
            viewAllHref="/?sort=default"
          />
          <HorizontalRow
            title={activeRowData.row2.title}
            items={activeRowData.row2.items}
            viewAllHref="/?sort=bestseller"
          />
          <HorizontalRow
            title={activeRowData.row3.title}
            items={activeRowData.row3.items}
            viewAllHref="/?sort=price-asc"
          />
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
