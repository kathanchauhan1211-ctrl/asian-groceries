'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { ProductCatalog } from '@/components/product-catalog'
import { ShoppingBag } from 'lucide-react'
import { SwipeableCategoryBar } from '@/components/swipeable-category-bar'
import { HorizontalProductCarousel } from '@/components/horizontal-product-carousel'
import { useProducts } from '@/lib/use-products'
import { CATEGORY_GROUPS, type Product } from '@/lib/products'
import { useCart } from '@/lib/cart-context'

// ─── Categories to feature as carousels on the shop home page ────────────────
// Matches CATEGORY_GROUPS labels. Fallback: shows whatever products exist.
const FEATURED_CATEGORIES = [
  { label: 'Spices',        icon: '🌶️', desc: 'Authentic ground & whole spices' },
  { label: 'Rice',          icon: '🍚', desc: 'Basmati, Sona Masoori & more' },
  { label: 'Flour',         icon: '🌾', desc: 'Atta, besan & specialty flours' },
  { label: 'Snacks',        icon: '🍿', desc: 'Crunchy bites & savoury treats' },
  { label: 'Pulses',        icon: '🫘', desc: 'Dal, chana & wholesome legumes' },
  { label: 'Tea & Drinks',  icon: '🍵', desc: 'Masala chai, juices & sodas' },
  { label: 'Sweets',        icon: '🍮', desc: 'Traditional mithai & desserts' },
  { label: 'Pickles',       icon: '🥒', desc: 'Tangy mango, lime & mixed pickles' },
  { label: 'Vegetables',    icon: '🥦', desc: 'Fresh exotic & everyday vegetables' },
  { label: 'Fruits',        icon: '🍊', desc: 'Tropical & seasonal fresh fruits' },
  { label: 'Ready-to-Eat',  icon: '🍱', desc: 'Dal makhani, paneer & more' },
  { label: 'Noodles',       icon: '🍜', desc: 'Instant noodles & manchurian' },
]

// ─── Category quick-link tiles ────────────────────────────────────────────────
function CategoryTiles() {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Browse Categories</h2>
        <Link
          href="/shop?sort=default"
          className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          All products <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
        {CATEGORY_GROUPS.map(cat => (
          <Link
            key={cat.label}
            href={`/shop?category=${encodeURIComponent(cat.label)}`}
            className="group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all hover:scale-105 hover:shadow-md active:scale-95"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--card)',
            }}
          >
            <span className="text-2xl leading-none">{cat.icon}</span>
            <span className="text-[10px] font-semibold leading-tight line-clamp-2" style={{ color: 'var(--foreground)' }}>
              {cat.label.replace(' & ', '\n& ')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── The carousels section (unfiltered home) ──────────────────────────────────
function FeaturedCarousels({ products }: { products: Product[] }) {
  const byCategory = useMemo(() => {
    return FEATURED_CATEGORIES.map(cat => ({
      ...cat,
      products: products.filter((p: Product) => p.category === cat.label).slice(0, 20),
    })).filter(cat => cat.products.length > 0)
  }, [products])

  return (
    <div className="space-y-2">
      {byCategory.map(cat => (
        <div key={cat.label}>
          {/* Section header with description */}
          <div className="flex items-end gap-3 px-4 md:px-0 mb-1 mt-6">
            <span className="text-3xl leading-none">{cat.icon}</span>
            <div>
              <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
                {cat.label}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{cat.desc}</p>
            </div>
          </div>
          <HorizontalProductCarousel
            title=""
            products={cat.products}
            viewAllLink={`/shop?category=${encodeURIComponent(cat.label)}`}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PageContent() {
  const searchParams = useSearchParams()

  // Detect if ANY filter is active
  const hasActiveFilter = Boolean(
    searchParams.get('q') ||
    searchParams.get('category') ||
    searchParams.get('brand') ||
    searchParams.get('origin') ||
    searchParams.get('diet') ||
    searchParams.get('stock') ||
    searchParams.get('priceMin') ||
    searchParams.get('priceMax') ||
    searchParams.get('sort')
  )

  // Load all products for carousels (only needed when not filtered)
  const { products: allProducts, loading } = useProducts()

  const { count, setOpen } = useCart()

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pt-4 pb-28">

        {/* ═══ Swipeable Category Bar ═══ */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-2 pb-4">
          <SwipeableCategoryBar
            prependFilterButton={
              <Link
                href="/shop"
                className="snap-start shrink-0 flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-bold transition-all text-white hover:-translate-y-0.5 active:scale-95 shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--im-orange, #F97316), #ea580c)' }}
              >
                All
              </Link>
            }
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-6">

          {/* ── FILTER BAR (Always visible) ── */}
          <ProductCatalog 
            hideGridWhenUnfiltered={!hasActiveFilter} 
            hideExtraFilters={Boolean(searchParams.get('category'))}
            appendControls={
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {hasActiveFilter && (
                  <Link
                    href="/shop"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95"
                  >
                    <ChevronLeft className="size-3 text-orange-500" />
                    <span className="hidden sm:inline">Back</span>
                  </Link>
                )}
                <button
                  onClick={() => setOpen(true)}
                  className="relative flex items-center justify-center rounded-xl px-3 py-1.5 shadow-sm transition-all active:scale-95 border"
                  style={{ background: 'linear-gradient(to bottom, #f97316, #ea580c)', borderColor: '#ea580c', color: 'white' }}
                >
                  <ShoppingBag className="size-4 shrink-0" />
                  <span className="hidden lg:inline ml-1.5 text-xs font-bold">Basket</span>
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-orange-600 shadow-md border border-orange-200">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>
              </div>
            }
          />

          {!hasActiveFilter && (
            // ── UNFILTERED CONTENT (Only show when no filters are active) ──
            <div className="mt-8">
              <CategoryTiles />

              {loading ? (
                /* Skeleton carousels */
                <div className="space-y-8 mt-12">
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
                      <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3, 4].map(j => (
                          <div key={j} className="shrink-0 w-52 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse aspect-square" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-12">
                  <FeaturedCarousels products={allProducts} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
