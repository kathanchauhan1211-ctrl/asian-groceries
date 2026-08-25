'use client'

import { useMemo, useState, useRef } from 'react'
import { SlidersHorizontal, X, ChevronDown, Check, ArrowUpDown, Loader2 } from 'lucide-react'
import {
  DIETS,
  STOCKS,
  type Diet,
  type Origin,
  type Stock,
} from '@/lib/products'
import { useProducts } from '@/lib/use-products'
import { ProductCard } from '@/components/product-card'

// ─── Types ───────────────────────────────────────────────────────────────────
type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Featured' },
  { key: 'price-asc',  label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name',       label: 'Name A–Z' },
]

const DIETARY_LABELS: Record<string, string> = {
  Halal:    '🥩 Halal',
  Vegan:    '🌱 Vegan',
  Vegetarian: '🥗 Vegetarian',
  'Gluten-Free': '🌾 Gluten-Free',
}

// ─── Pill button (shared) ─────────────────────────────────────────────────────
function Pill({
  active, onClick, children, count,
}: {
  active?: boolean; onClick: () => void; children: React.ReactNode; count?: number
}) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
      style={{
        background:   active ? '#0F2044'           : '#fff',
        color:        active ? '#fff'              : '#374151',
        borderColor:  active ? '#0F2044'           : '#E5E7EB',
        boxShadow:    active ? '0 2px 8px rgba(15,32,68,0.18)' : '0 1px 3px rgba(0,0,0,0.07)',
      }}
    >
      {active && <Check className="size-3.5 shrink-0" />}
      {children}
      {count !== undefined && count > 0 && (
        <span
          className="flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: active ? 'rgba(255,255,255,0.25)' : '#F97316', color: '#fff' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Dropdown filter ──────────────────────────────────────────────────────────
function DropdownFilter({
  label, options, selected, onToggle, onClear
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const hasActive = selected.length > 0

  // Close on outside click
  useMemo(() => {
    if (typeof document === 'undefined') return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
        style={{
          background:  hasActive ? '#0F2044'           : '#fff',
          color:       hasActive ? '#fff'              : '#374151',
          borderColor: hasActive ? '#0F2044'           : '#E5E7EB',
          boxShadow:   hasActive ? '0 2px 8px rgba(15,32,68,0.18)' : '0 1px 3px rgba(0,0,0,0.07)',
        }}
      >
        {label}
        {hasActive && (
          <span
            className="flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown
          className="size-3.5 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-30 mt-2 overflow-hidden rounded-xl py-1.5"
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '180px',
          }}
        >
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors"
              style={{
                color: '#111827',
                background: selected.includes(opt) ? '#FFF7ED' : 'transparent',
                fontWeight: selected.includes(opt) ? 600 : 400,
              }}
            >
              {DIETARY_LABELS[opt] ?? opt}
              {selected.includes(opt) && <Check className="size-3.5 text-orange-500" />}
            </button>
          ))}
          {hasActive && (
            <>
              <div className="mx-3 my-1.5 h-px bg-gray-100" />
              <button
                onClick={() => { onClear(); setOpen(false) }}
                className="flex w-full items-center gap-1.5 px-4 py-2 text-[12px] text-red-500 font-medium"
              >
                <X className="size-3.5" /> Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = SORT_OPTIONS.find(o => o.key === value)!

  useMemo(() => {
    if (typeof document === 'undefined') return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
        style={{
          background: value !== 'default' ? '#0F2044' : '#fff',
          color:      value !== 'default' ? '#fff'    : '#374151',
          borderColor: value !== 'default' ? '#0F2044' : '#E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        }}
      >
        <ArrowUpDown className="size-3.5" />
        {current.label}
        <ChevronDown
          className="size-3.5 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-2 overflow-hidden rounded-xl py-1.5"
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '200px',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false) }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors"
              style={{
                color: '#111827',
                background: value === opt.key ? '#FFF7ED' : 'transparent',
                fontWeight: value === opt.key ? 600 : 400,
              }}
            >
              {opt.label}
              {value === opt.key && <Check className="size-3.5 text-orange-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ProductCatalog ──────────────────────────────────────────────────────
export function ProductCatalog({
  query, origin, activeCategory,
}: {
  query: string
  origin: Origin | 'All'
  activeCategory: string | null
}) {
  const { products: liveProducts, loading, loadingMore, hasMore, loadMore, errorMessage } = useProducts()

  const [stocks, setStocks]         = useState<Stock[]>([])
  const [diets, setDiets]           = useState<Diet[]>([])
  const [sort, setSort]             = useState<SortKey>('default')
  const [selectedCat, setSelectedCat] = useState<string | null>(activeCategory)

  // Dynamic categories from Firestore
  const dynamicCategories = useMemo(() => {
    const seen = new Set<string>()
    liveProducts.forEach(p => p.category && seen.add(p.category))
    return Array.from(seen).sort()
  }, [liveProducts])

  // Filtered + sorted products
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = liveProducts.filter((p) => {
      if (origin !== 'All' && p.origin !== origin) return false
      if (selectedCat && p.category !== selectedCat) return false
      if (stocks.length && !stocks.includes(p.stock)) return false
      if (diets.length && !diets.every((d) => (p.diet ?? []).includes(d))) return false
      if (q) {
        const haystack = `${p.name} ${p.tagline} ${p.category} ${p.origin} ${p.brand ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    if (sort === 'price-asc')  result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'price-desc') result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sort === 'name')       result = [...result].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    return result
  }, [query, origin, selectedCat, stocks, diets, sort, liveProducts])

  const activeFilterCount = stocks.length + diets.length + (selectedCat ? 1 : 0)

  function toggleStock(v: Stock)  { setStocks(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]) }
  function toggleDiet(v: Diet)    { setDiets(s  => s.includes(v) ? s.filter(x => x !== v) : [...s, v]) }
  function clearAll()             { setStocks([]); setDiets([]); setSelectedCat(null); setSort('default') }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-10 md:px-6">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-24 shrink-0 rounded-full bg-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-8 w-full bg-gray-100 rounded-lg mt-3" />
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
        </div>
      </section>
    )
  }

  return (
    <section id="shop" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-8 md:px-6">

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div
        className="mb-6 rounded-2xl p-4"
        style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
      >
        {/* Row 1: Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-gray-400 pr-1">
            Category
          </span>
          <Pill active={!selectedCat} onClick={() => setSelectedCat(null)}>
            All
          </Pill>
          {dynamicCategories.map(cat => (
            <Pill
              key={cat}
              active={selectedCat === cat}
              onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
            >
              {cat}
            </Pill>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-3 h-px" style={{ background: '#E5E7EB' }} />

        {/* Row 2: Stock + Dietary dropdowns + Sort + Clear */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownFilter
              label="Availability"
              options={STOCKS}
              selected={stocks}
              onToggle={v => toggleStock(v as Stock)}
              onClear={() => setStocks([])}
            />
            <DropdownFilter
              label="Dietary"
              options={DIETS}
              selected={diets}
              onToggle={v => toggleDiet(v as Diet)}
              onClear={() => setDiets([])}
            />

            {/* Stock quick pills (always visible) */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <div className="h-5 w-px bg-gray-200 mr-1" />
              {STOCKS.map(s => (
                <Pill key={s} active={stocks.includes(s)} onClick={() => toggleStock(s)}>
                  {s === 'In Stock' ? '✅ In Stock' : s === 'Low Stock' ? '⚠️ Low Stock' : '❌ Sold Out'}
                </Pill>
              ))}
            </div>

            {/* Active filter count badge */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}
              >
                <X className="size-3.5" />
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Sort */}
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* ── Results header ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="heading-ornament font-serif text-2xl font-semibold text-foreground md:text-3xl">
            {selectedCat ?? 'The Pantry'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {origin !== 'All' && ` · ${origin}`}
            {query && ` matching "${query}"`}
          </p>
        </div>
      </div>

      {/* ── Product grid ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <span className="mb-4 text-4xl">🪷</span>
          <p className="font-serif text-xl font-semibold text-gray-900">No products found</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ background: '#F97316' }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}

      {/* ── Load more ───────────────────────────────────────────────────────── */}
      {hasMore && !loading && filtered.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60"
          >
            {loadingMore ? (
              <><Loader2 className="size-4 animate-spin text-orange-500" /> Loading…</>
            ) : (
              'Load more products'
            )}
          </button>
        </div>
      )}
    </section>
  )
}
