'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import {
  DIETS,
  STOCKS,
  type Diet,
  type Origin,
  type Stock,
} from '@/lib/products'
import { useProducts } from '@/lib/use-products'
import { ProductCard } from '@/components/product-card'

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-foreground">
      <span
        className={`flex size-4 items-center justify-center rounded border transition-all duration-200 ${
          checked ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'border-border bg-card'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden>
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}

export function ProductCatalog({
  query,
  origin,
  activeCategory,
}: {
  query: string
  origin: Origin | 'All'
  activeCategory: string | null
}) {
  const { products: liveProducts, loading, loadingMore, hasMore, loadMore, errorMessage } = useProducts()

  // ── All hooks declared before any early returns (React Rules of Hooks) ─────
  const [categories, setCategories] = useState<string[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [diets, setDiets] = useState<Diet[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Dynamic category list from live Firestore products
  const dynamicCategories = useMemo(() => {
    const seen = new Set<string>()
    liveProducts.forEach(p => p.category && seen.add(p.category))
    return Array.from(seen).sort()
  }, [liveProducts])

  // Filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return liveProducts.filter((p) => {
      if (origin !== 'All' && p.origin !== origin) return false
      if (activeCategory && p.category !== activeCategory) return false
      if (categories.length && !categories.includes(p.category)) return false
      if (stocks.length && !stocks.includes(p.stock)) return false
      if (diets.length && !diets.every((d) => (p.diet ?? []).includes(d))) return false
      if (q) {
        const haystack = `${p.name} ${p.tagline} ${p.category} ${p.origin}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [query, origin, activeCategory, categories, stocks, diets, liveProducts])

  const activeCount = categories.length + stocks.length + diets.length

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  function clearAll() {
    setCategories([])
    setStocks([])
    setDiets([])
  }

  // ── Early returns AFTER all hooks ─────────────────────────────────────────

  if (loading) {
    return (
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-10 md:px-6">
        <div className="mb-8">
          <div className="h-8 w-40 rounded-xl bg-slate-100 animate-pulse mb-2" />
          <div className="h-4 w-24 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
              <div className="aspect-square bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
                <div className="h-8 w-full bg-slate-100 rounded-lg mt-3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (errorMessage) {
    return (
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-10 md:px-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-16 text-center px-6">
          <span className="mb-4 text-4xl">⚠️</span>
          <p className="font-serif text-xl font-semibold text-red-700 mb-2">Cannot load products</p>
          <p className="max-w-lg text-sm text-red-600">{errorMessage}</p>
          <p className="mt-4 text-xs text-red-400">Open browser DevTools → Console for the full error detail</p>
        </div>
      </section>
    )
  }

  // ── Filter sidebar panel (shared between desktop sidebar + mobile drawer) ──
  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Category</h3>
        </div>
        {dynamicCategories.map((c) => (
          <FilterCheckbox
            key={c}
            label={c}
            checked={categories.includes(c)}
            onChange={() => toggle(categories, c, setCategories)}
          />
        ))}
      </div>
      <div className="desi-border" />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Availability</h3>
        {STOCKS.map((s) => (
          <FilterCheckbox
            key={s}
            label={s}
            checked={stocks.includes(s)}
            onChange={() => toggle(stocks, s, setStocks)}
          />
        ))}
      </div>
      <div className="desi-border" />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Dietary</h3>
        {DIETS.map((d) => (
          <FilterCheckbox
            key={d}
            label={d}
            checked={diets.includes(d)}
            onChange={() => toggle(diets, d, setDiets)}
          />
        ))}
      </div>
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline transition-colors"
        >
          <X className="size-3.5" /> Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <section id="shop" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-10 md:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="heading-ornament font-serif text-2xl font-semibold text-foreground md:text-3xl">
            The Pantry
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {origin !== 'All' && ` from ${origin}`}
            {query && ` matching "${query}"`}
          </p>
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:shadow-md lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-40 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <h2 className="font-serif text-lg font-semibold">Filters</h2>
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
              <span className="mb-4 text-4xl">🪷</span>
              <p className="font-serif text-xl font-semibold text-foreground">No products found</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try adjusting your search or filters to discover more South Asian staples.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && filtered.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3 text-sm font-semibold text-foreground shadow-sm hover:shadow-md hover:bg-muted transition-all duration-200 disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading…
                  </>
                ) : (
                  'Load more products'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            {filterPanel}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-shimmer mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
