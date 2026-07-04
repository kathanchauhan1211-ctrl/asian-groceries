'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import {
  CATEGORIES,
  DIETS,
  PRODUCTS,
  STOCKS,
  type Category,
  type Diet,
  type Origin,
  type Stock,
} from '@/lib/products'
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
  const [categories, setCategories] = useState<Category[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [diets, setDiets] = useState<Diet[]>([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  function toggle<T>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRODUCTS.filter((p) => {
      if (origin !== 'All' && p.origin !== origin) return false
      if (activeCategory && p.category !== activeCategory) return false
      if (categories.length && !categories.includes(p.category)) return false
      if (stocks.length && !stocks.includes(p.stock)) return false
      if (diets.length && !diets.every((d) => p.diet.includes(d))) return false
      if (q) {
        const haystack = `${p.name} ${p.tagline} ${p.category} ${p.origin}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [query, origin, activeCategory, categories, stocks, diets])

  const activeCount = categories.length + stocks.length + diets.length

  function clearAll() {
    setCategories([])
    setStocks([])
    setDiets([])
  }

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Category</h3>
        </div>
        {CATEGORIES.map((c) => (
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

        {/* Grid */}
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
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
