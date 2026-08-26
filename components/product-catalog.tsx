'use client'

import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import {
  X, ChevronDown, Check, ArrowUpDown, Loader2, ChevronRight,
  SlidersHorizontal, Search,
} from 'lucide-react'
import {
  DIETS, STOCKS, ORIGIN_FLAG,
  type Diet, type Origin, type Stock, type Product,
} from '@/lib/products'
import { useProducts } from '@/lib/use-products'
import { ProductCard } from '@/components/product-card'

// ─── Types ───────────────────────────────────────────────────────────────────
type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name' | 'bestseller'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Featured' },
  { key: 'bestseller', label: 'Best Selling' },
  { key: 'price-asc',  label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name',       label: 'Name A–Z' },
]


// ─── Full category list (Dookan-inspired, adjusted for our inventory) ─────────
const CATEGORIES = [
  { label: 'Wheat & Chapati Flour',        icon: '🫓', match: ['Rice & Atta'] },
  { label: 'Basmati Rice',                 icon: '🌾', match: ['Rice & Grains'] },
  { label: 'Grains, Flours & Flour Mixes', icon: '🫘', match: ['Lentils & Pulses', 'Rice & Grains'] },
  { label: 'Spices & Condiments',          icon: '🌶️', match: ['Spices', 'Condiments'] },
  { label: 'Instant Food & Ready to Eat',  icon: '🍛', match: ['Ready Meals'] },
  { label: 'Sweets',                       icon: '🍬', match: ['Sweets'] },
  { label: 'Savoury Snacks',               icon: '🍿', match: ['Snacks'] },
  { label: 'Pickles & Sauces',             icon: '🫙', match: ['Condiments'] },
  { label: 'Beverages',                    icon: '🫖', match: ['Tea & Drinks'] },
  { label: 'Frozen Foods',                 icon: '❄️', match: ['Frozen Foods'] },
]

// ─── Origin options ───────────────────────────────────────────────────────────
const ORIGINS = [
  { label: 'All',       flag: '🌏' },
  { label: 'India',     flag: '🇮🇳' },
  { label: 'Pakistan',  flag: '🇵🇰' },
  { label: 'Sri Lanka', flag: '🇱🇰' },
]

// ─── Small helpers ────────────────────────────────────────────────────────────
function Pill({ active, onClick, children }: {
  active?: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
      style={{
        background:  active ? '#0F2044' : '#fff',
        color:       active ? '#fff'    : '#374151',
        borderColor: active ? '#0F2044' : '#E5E7EB',
        boxShadow:   active ? '0 2px 8px rgba(15,32,68,0.18)' : '0 1px 3px rgba(0,0,0,0.07)',
      }}
    >
      {children}
    </button>
  )
}

// ─── Dropdown ────────────────────────────────────────────────────────────────
function Dropdown({ label, options, selected, onToggle, onClear }: {
  label: string; options: string[]; selected: string[]
  onToggle: (v: string) => void; onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const has = selected.length > 0
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all whitespace-nowrap"
        style={{
          background:  has ? '#0F2044' : '#fff',
          color:       has ? '#fff'    : '#374151',
          borderColor: has ? '#0F2044' : '#D1D5DB',
          boxShadow:   '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {label} {has && <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-bold">{selected.length}</span>}
        <ChevronDown className="size-3.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 rounded-xl py-1.5 shadow-xl" style={{ background: '#fff', border: '1px solid #E5E7EB', minWidth: 190 }}>
          {options.map(opt => (
            <button key={opt} onClick={() => onToggle(opt)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors"
              style={{ fontWeight: selected.includes(opt) ? 600 : 400, color: '#111827', background: selected.includes(opt) ? '#FFF7ED' : 'transparent' }}
            >
              {opt} {selected.includes(opt) && <Check className="size-3.5 text-orange-500" />}
            </button>
          ))}
          {has && <>
            <div className="mx-3 my-1 h-px bg-gray-100" />
            <button onClick={() => { onClear(); setOpen(false) }} className="flex w-full items-center gap-1.5 px-4 py-2 text-[12px] text-red-500 font-medium">
              <X className="size-3.5" /> Clear
            </button>
          </>}
        </div>
      )}
    </div>
  )
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const cur = SORT_OPTIONS.find(o => o.key === value)!
  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all whitespace-nowrap"
        style={{ background: value !== 'default' ? '#0F2044' : '#fff', color: value !== 'default' ? '#fff' : '#374151', borderColor: value !== 'default' ? '#0F2044' : '#D1D5DB' }}
      >
        <ArrowUpDown className="size-3.5" /> {cur.label}
        <ChevronDown className="size-3.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 rounded-xl py-1.5 shadow-xl" style={{ background: '#fff', border: '1px solid #E5E7EB', minWidth: 200 }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false) }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors"
              style={{ fontWeight: value === opt.key ? 600 : 400, color: '#111827', background: value === opt.key ? '#FFF7ED' : 'transparent' }}
            >
              {opt.label} {value === opt.key && <Check className="size-3.5 text-orange-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Price range slider ───────────────────────────────────────────────────────
function PriceRange({ min, max, value, onChange }: {
  min: number; max: number; value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <div className="px-1">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[13px] font-semibold text-slate-700">
          <span className="text-gray-400 text-xs">€</span>
          <input
            type="number" min={min} max={value[1]} value={value[0]}
            onChange={e => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
            className="w-14 bg-transparent outline-none"
          />
        </div>
        <div className="h-px flex-1 bg-gray-200" />
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[13px] font-semibold text-slate-700">
          <span className="text-gray-400 text-xs">€</span>
          <input
            type="number" min={value[0]} max={max} value={value[1]}
            onChange={e => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
            className="w-14 bg-transparent outline-none"
          />
        </div>
      </div>
      <div className="relative h-1.5 rounded-full bg-gray-200">
        <div
          className="absolute h-full rounded-full bg-orange-500"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />
        <input type="range" min={min} max={max} value={value[0]}
          onChange={e => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        <input type="range" min={min} max={max} value={value[1]}
          onChange={e => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
      </div>
    </div>
  )
}

// ─── Main ProductCatalog ──────────────────────────────────────────────────────
export function ProductCatalog({
  query: queryProp, origin: originProp, activeCategory,
}: {
  query: string; origin: Origin | 'All'; activeCategory: string | null
}) {
  const { products: allProducts, loading, loadingMore, hasMore, loadMore, errorMessage } = useProducts()

  const [stocks, setStocks]           = useState<Stock[]>([])
  const [diets, setDiets]             = useState<Diet[]>([])
  const [sort, setSort]               = useState<SortKey>('default')
  const [selectedCat, setSelectedCat] = useState<string | null>(activeCategory)
  const [selectedOrigin, setSelectedOrigin] = useState<string>('All')
  const [priceRange, setPriceRange]   = useState<[number, number]>([0, 100])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [query, setQuery]             = useState(queryProp)

  // Compute price bounds from products
  const [pMin, pMax] = useMemo(() => {
    const prices = allProducts.flatMap(p => p.variants?.map(v => v.price) ?? (p.price ? [p.price] : []))
    if (!prices.length) return [0, 100]
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [allProducts])

  useEffect(() => { setPriceRange([pMin, pMax]) }, [pMin, pMax])

  // ── Filtered products ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = allProducts.filter((p) => {
      if (selectedOrigin !== 'All' && p.origin !== selectedOrigin) return false
      if (selectedCat && p.category !== selectedCat) return false
      if (stocks.length && !stocks.includes(p.stock)) return false
      if (diets.length && !diets.every(d => (p.diet ?? []).includes(d))) return false
      const price = p.price ?? p.variants?.[0]?.price ?? 0
      if (price < priceRange[0] || price > priceRange[1]) return false
      if (q) {
        const hay = `${p.name} ${p.tagline} ${p.category} ${p.origin} ${p.brand ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'price-asc')  result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'price-desc') result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sort === 'name')       result = [...result].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    if (sort === 'bestseller') result = [...result].sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0))
    return result
  }, [query, selectedOrigin, selectedCat, stocks, diets, sort, priceRange, allProducts])

  const activeFilterCount = stocks.length + diets.length + (selectedCat ? 1 : 0) + (selectedOrigin !== 'All' ? 1 : 0)
  const priceFiltered = priceRange[0] !== pMin || priceRange[1] !== pMax

  function clearAll() {
    setStocks([]); setDiets([]); setSelectedCat(null); setSort('default')
    setSelectedOrigin('All'); setPriceRange([pMin, pMax]); setQuery('')
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:px-6">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-28 shrink-0 rounded-full bg-gray-100 animate-pulse" />
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
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:px-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-16 text-center px-6">
          <span className="mb-4 text-4xl">⚠️</span>
          <p className="font-serif text-xl font-semibold text-red-700 mb-2">Cannot load products</p>
          <p className="max-w-lg text-sm text-red-600">{errorMessage}</p>
        </div>
      </section>
    )
  }

  return (
    <section id="shop" className="scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

        {/* ══ Filter Bar — ALWAYS at the top of shop section ══ */}
        <div id="shop-grid" className="scroll-mt-24 mb-6 rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--border)' }}>

          {/* Row 1: Category pills (dark navy) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-3 py-2.5"
            style={{ background: '#0F2044' }}>
            <button
              onClick={() => setSelectedCat(null)}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all whitespace-nowrap"
              style={{ background: !selectedCat ? '#F97316' : 'rgba(255,255,255,0.1)', color: '#fff' }}
            >
              All
            </button>
            {CATEGORIES.map(cat => {
              const active = cat.match.includes(selectedCat ?? '')
              return (
                <button key={cat.label}
                  onClick={() => setSelectedCat(active ? null : cat.match[0])}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap"
                  style={{ background: active ? '#F97316' : 'rgba(255,255,255,0.08)', color: active ? '#fff' : 'rgba(255,255,255,0.75)' }}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              )
            })}
          </div>

          {/* Row 2: Origin filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-3 py-2.5 border-t border-gray-100"
            style={{ background: '#F9FAFB' }}>
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-gray-400 pr-1.5">Origin:</span>
            {ORIGINS.map(o => {
              const active = selectedOrigin === o.label
              return (
                <button key={o.label} onClick={() => setSelectedOrigin(o.label)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold transition-all whitespace-nowrap"
                  style={{
                    background:  active ? '#F97316' : '#fff',
                    color:       active ? '#fff'    : '#374151',
                    borderColor: active ? '#F97316' : '#E5E7EB',
                    boxShadow:   active ? '0 2px 8px rgba(249,115,22,0.25)' : '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {o.flag} {o.label}
                </button>
              )
            })}
          </div>

          {/* Row 3: Advanced filters + sort */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="size-4 text-gray-400 hidden sm:block" />

              <Dropdown label="Availability" options={STOCKS}
                selected={stocks} onToggle={v => setStocks(s => s.includes(v as Stock) ? s.filter(x => x !== v) : [...s, v as Stock])}
                onClear={() => setStocks([])}
              />
              <Dropdown label="Dietary" options={DIETS}
                selected={diets} onToggle={v => setDiets(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v])}
                onClear={() => setDiets([])}
              />

              {/* Price range dropdown */}
              <PriceRangeDropdown min={pMin} max={pMax} value={priceRange} onChange={setPriceRange} />

              {(activeFilterCount > 0 || priceFiltered) && (
                <button onClick={clearAll}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
                  style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}>
                  <X className="size-3.5" />
                  Clear {activeFilterCount + (priceFiltered ? 1 : 0)} filter{(activeFilterCount + (priceFiltered ? 1 : 0)) > 1 ? 's' : ''}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-400">{filtered.length} products</span>
              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>
        </div>

        {/* Filter bar ends */}



        {/* ══ Product grid — appears below sections (or directly if filters active) ══ */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
            <span className="mb-4 text-4xl">🪷</span>
            <p className="font-serif text-xl font-semibold text-gray-900">No products found</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Try adjusting your search or filters.</p>
            {(activeFilterCount > 0 || priceFiltered) && (
              <button onClick={clearAll} className="mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: '#F97316' }}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 sm:gap-5">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}

        {/* ── Load more ── */}
        {hasMore && !loading && filtered.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button onClick={loadMore} disabled={loadingMore}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all disabled:opacity-60">
              {loadingMore ? <><Loader2 className="size-4 animate-spin text-orange-500" /> Loading…</> : 'Load more products'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Price range as a dropdown ────────────────────────────────────────────────
function PriceRangeDropdown({ min, max, value, onChange }: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const active = value[0] !== min || value[1] !== max
  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all whitespace-nowrap"
        style={{ background: active ? '#0F2044' : '#fff', color: active ? '#fff' : '#374151', borderColor: active ? '#0F2044' : '#D1D5DB' }}>
        Price {active && <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-bold">€{value[0]}–€{value[1]}</span>}
        <ChevronDown className="size-3.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 rounded-xl p-4 shadow-xl" style={{ background: '#fff', border: '1px solid #E5E7EB', minWidth: 260 }}>
          <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-gray-400">Price Range</p>
          <PriceRange min={min} max={max} value={value} onChange={onChange} />
          <button onClick={() => setOpen(false)} className="mt-3 w-full rounded-lg py-2 text-[13px] font-semibold text-white transition-all" style={{ background: '#F97316' }}>
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
