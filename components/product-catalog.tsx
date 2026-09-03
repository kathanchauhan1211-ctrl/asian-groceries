'use client'

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  X, ChevronDown, Check, ArrowUpDown, Loader2,
  SlidersHorizontal, PackageSearch, AlertTriangle, Globe, Filter,
} from 'lucide-react'
import {
  DIETS, STOCKS, ORIGINS, CATEGORY_GROUPS,
  type Diet, type Stock, type Product,
} from '@/lib/products'
import { useProducts } from '@/lib/use-products'
import { useTranslation } from '@/lib/translation-context'
import { ProductCard } from '@/components/product-card'

// ─── Types ────────────────────────────────────────────────────────────────────
type SortKey = 'default' | 'price-asc' | 'price-desc' | 'name' | 'bestseller'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default',    label: 'Featured' },
  { key: 'bestseller', label: 'Best Selling' },
  { key: 'price-asc',  label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'name',       label: 'Name A–Z' },
]

// ─── Flag icon helper ────────────────────────────────────────────────────────
function FlagIcon({ code }: { code: string }) {
  if (code === 'GLOBAL') return <Globe className="size-3.5" />
  const flag = code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
  return <span className="text-sm leading-none" aria-hidden>{flag}</span>
}

// ─── Checkbox dropdown (dookan-style) ────────────────────────────────────────
function CheckDropdown({ label, options, selected, onToggle, onClear, renderOption }: {
  label: string
  options: { value: string; display: string; count?: number }[]
  selected: string[]
  onToggle: (v: string) => void
  onClear: () => void
  renderOption?: (opt: { value: string; display: string }) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<string[]>(selected)
  const ref = useRef<HTMLDivElement>(null)
  const has = selected.length > 0

  // Sync pending state when dropdown opens
  useEffect(() => { if (open) setPending(selected) }, [open, selected])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  function handleApply() {
    // Diff pending vs selected and call toggle for each change
    const toAdd = pending.filter(v => !selected.includes(v))
    const toRemove = selected.filter(v => !pending.includes(v))
    toAdd.forEach(v => onToggle(v))
    toRemove.forEach(v => onToggle(v))
    setOpen(false)
  }

  function handleClear() {
    setPending([])
    onClear()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all whitespace-nowrap hover:border-orange-400 hover:text-orange-600"
        style={{
          background:  has ? 'var(--primary)' : 'var(--card)',
          color:       has ? '#fff'           : 'var(--foreground)',
          borderColor: has ? 'var(--primary)' : 'var(--border)',
          boxShadow:   has ? '0 2px 8px rgba(249,115,22,0.25)' : '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {label}
        {has && <span className="flex size-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">{selected.length}</span>}
        <ChevronDown className="size-3.5 ml-0.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 rounded-xl shadow-xl overflow-hidden"
          style={{ background: 'var(--popover)', border: '1px solid var(--border)', minWidth: 220, maxHeight: 340 }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {options.map(opt => {
              const checked = pending.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => setPending(p => p.includes(opt.value) ? p.filter(x => x !== opt.value) : [...p, opt.value])}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/10"
                  style={{ color: checked ? 'var(--primary)' : 'var(--foreground)' }}
                >
                  <span
                    className="flex size-4 shrink-0 items-center justify-center rounded border transition-colors"
                    style={{
                      borderColor: checked ? 'var(--primary)' : 'var(--border)',
                      background: checked ? 'var(--primary)' : 'transparent',
                    }}
                  >
                    {checked && <Check className="size-2.5 text-white" />}
                  </span>
                  <span className="flex-1 text-left">
                    {renderOption ? renderOption(opt) : opt.display}
                  </span>
                  {opt.count !== undefined && (
                    <span className="text-[11px] font-medium opacity-50">({opt.count})</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 border-t px-3 py-2.5" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handleApply}
              className="flex-1 rounded-lg py-2 text-[12px] font-bold text-white transition-all"
              style={{ background: 'var(--primary)' }}
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all hover:bg-red-50"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              Clear
            </button>
          </div>
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
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all whitespace-nowrap hover:border-orange-400"
        style={{
          background:  value !== 'default' ? 'var(--primary)' : 'var(--card)',
          color:       value !== 'default' ? '#fff'            : 'var(--foreground)',
          borderColor: value !== 'default' ? 'var(--primary)' : 'var(--border)',
        }}
      >
        <ArrowUpDown className="size-3.5" />
        Sort: {cur.label}
        <ChevronDown className="size-3.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 rounded-xl py-1.5 shadow-xl" style={{ background: 'var(--popover)', border: '1px solid var(--border)', minWidth: 200 }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false) }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/10"
              style={{
                fontWeight: value === opt.key ? 700 : 400,
                color: value === opt.key ? 'var(--primary)' : 'var(--foreground)',
              }}
            >
              {opt.label}
              {value === opt.key && <Check className="size-3.5" style={{ color: 'var(--primary)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Price range slider inside a dropdown ─────────────────────────────────────
function PriceDropdown({ min, max, value, onChange }: {
  min: number; max: number; value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<[number, number]>(value)
  const ref = useRef<HTMLDivElement>(null)
  const active = value[0] !== min || value[1] !== max

  useEffect(() => { if (open) setLocal(value) }, [open])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const pct = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-all whitespace-nowrap hover:border-orange-400"
        style={{
          background:  active ? 'var(--primary)' : 'var(--card)',
          color:       active ? '#fff'            : 'var(--foreground)',
          borderColor: active ? 'var(--primary)' : 'var(--border)',
        }}
      >
        Price
        {active && <span className="text-[11px] font-bold opacity-80">€{value[0]}–€{value[1]}</span>}
        <ChevronDown className="size-3.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 rounded-xl p-4 shadow-xl" style={{ background: 'var(--popover)', border: '1px solid var(--border)', minWidth: 280 }}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Price Range</p>

          {/* Min/Max inputs */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
              <span className="text-xs opacity-50">€</span>
              <input type="number" min={min} max={local[1]} value={local[0]}
                onChange={e => setLocal([Math.min(Number(e.target.value), local[1]), local[1]])}
                className="w-full bg-transparent outline-none" style={{ color: 'var(--foreground)' }} />
            </div>
            <div className="h-px w-4 shrink-0" style={{ background: 'var(--border)' }} />
            <div className="flex flex-1 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
              <span className="text-xs opacity-50">€</span>
              <input type="number" min={local[0]} max={max} value={local[1]}
                onChange={e => setLocal([local[0], Math.max(Number(e.target.value), local[0])])}
                className="w-full bg-transparent outline-none" style={{ color: 'var(--foreground)' }} />
            </div>
          </div>

          {/* Range track */}
          <div className="relative mb-4 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="absolute h-full rounded-full" style={{ background: 'var(--primary)', left: `${pct(local[0])}%`, right: `${100 - pct(local[1])}%` }} />
            <input type="range" min={min} max={max} value={local[0]}
              onChange={e => setLocal([Math.min(Number(e.target.value), local[1]), local[1]])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <input type="range" min={min} max={max} value={local[1]}
              onChange={e => setLocal([local[0], Math.max(Number(e.target.value), local[0])])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => { onChange(local); setOpen(false) }}
              className="flex-1 rounded-lg py-2 text-[12px] font-bold text-white" style={{ background: 'var(--primary)' }}>
              Apply
            </button>
            <button onClick={() => { onChange([min, max]); setLocal([min, max]); setOpen(false) }}
              className="rounded-lg border px-3 py-2 text-[12px] font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Active Filter Chip ───────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1.5 py-1 text-[12px] font-semibold transition-all"
      style={{ background: 'color-mix(in srgb, var(--primary) 10%, transparent)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
      {label}
      <button onClick={onRemove} className="flex size-4 items-center justify-center rounded-full hover:bg-orange-500 hover:text-white transition-colors" aria-label={`Remove ${label} filter`}>
        <X className="size-2.5" />
      </button>
    </span>
  )
}

// ─── Mobile filter drawer ─────────────────────────────────────────────────────
function MobileFilterDrawer({
  open, onClose,
  // filter state
  categories, selectedCategories, onToggleCategory,
  brands, selectedBrands, onToggleBrand,
  origins, selectedOrigin, onSelectOrigin,
  diets, selectedDiets, onToggleDiet,
  stocks, selectedStocks, onToggleStock,
  priceMin, priceMax, priceRange, onPriceChange,
  sort, onSortChange,
  filteredCount,
  onClearAll,
}: {
  open: boolean; onClose: () => void
  categories: { value: string; display: string; count: number }[]
  selectedCategories: string[]; onToggleCategory: (v: string) => void
  brands: { value: string; display: string; count: number }[]
  selectedBrands: string[]; onToggleBrand: (v: string) => void
  origins: typeof ORIGINS; selectedOrigin: string; onSelectOrigin: (v: string) => void
  diets: string[]; selectedDiets: string[]; onToggleDiet: (v: string) => void
  stocks: string[]; selectedStocks: string[]; onToggleStock: (v: string) => void
  priceMin: number; priceMax: number; priceRange: [number, number]; onPriceChange: (v: [number, number]) => void
  sort: SortKey; onSortChange: (v: SortKey) => void
  filteredCount: number; onClearAll: () => void
}) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
        style={{ background: 'var(--card)', maxHeight: '90dvh', borderTop: '1px solid var(--border)' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full opacity-30" style={{ background: 'var(--muted-foreground)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>Filters & Sort</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full" style={{ background: 'var(--secondary)' }}>
            <X className="size-4" style={{ color: 'var(--foreground)' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Sort */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Sort By</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => onSortChange(opt.key)}
                  className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                  style={{
                    background: sort === opt.key ? 'var(--primary)' : 'var(--secondary)',
                    color: sort === opt.key ? '#fff' : 'var(--foreground)',
                    borderColor: sort === opt.key ? 'var(--primary)' : 'var(--border)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const active = selectedCategories.some(sc => CATEGORY_GROUPS.find(g => g.label === cat.display)?.match.includes(sc) || sc === cat.value)
                return (
                  <button key={cat.value} onClick={() => onToggleCategory(cat.value)}
                    className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--secondary)',
                      color: active ? '#fff' : 'var(--foreground)',
                      borderColor: active ? 'var(--primary)' : 'var(--border)',
                    }}>
                    {cat.display}
                    <span className="opacity-50 text-[10px]">({cat.count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Brand */}
          {brands.length > 0 && (
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Brand</p>
              <div className="flex flex-wrap gap-2">
                {brands.map(brand => {
                  const active = selectedBrands.includes(brand.value)
                  return (
                    <button key={brand.value} onClick={() => onToggleBrand(brand.value)}
                      className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all"
                      style={{
                        background: active ? 'var(--primary)' : 'var(--secondary)',
                        color: active ? '#fff' : 'var(--foreground)',
                        borderColor: active ? 'var(--primary)' : 'var(--border)',
                      }}>
                      {brand.display}
                      <span className="opacity-50 text-[10px]">({brand.count})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Origin */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Origin</p>
            <div className="flex flex-wrap gap-2">
              {origins.map(o => (
                <button key={o.label} onClick={() => onSelectOrigin(o.label)}
                  className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                  style={{
                    background: selectedOrigin === o.label ? '#F97316' : 'var(--secondary)',
                    color: selectedOrigin === o.label ? '#fff' : 'var(--foreground)',
                    borderColor: selectedOrigin === o.label ? '#F97316' : 'var(--border)',
                  }}>
                  <FlagIcon code={o.code} /> {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Availability</p>
            <div className="flex flex-wrap gap-2">
              {stocks.map(s => {
                const active = selectedStocks.includes(s)
                return (
                  <button key={s} onClick={() => onToggleStock(s)}
                    className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--secondary)',
                      color: active ? '#fff' : 'var(--foreground)',
                      borderColor: active ? 'var(--primary)' : 'var(--border)',
                    }}>
                    {active && <Check className="size-3.5" />} {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dietary */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Dietary</p>
            <div className="flex flex-wrap gap-2">
              {diets.map(d => {
                const active = selectedDiets.includes(d)
                return (
                  <button key={d} onClick={() => onToggleDiet(d)}
                    className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--secondary)',
                      color: active ? '#fff' : 'var(--foreground)',
                      borderColor: active ? 'var(--primary)' : 'var(--border)',
                    }}>
                    {active && <Check className="size-3.5" />} {d}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Price Range</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-1 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--secondary)', color: 'var(--foreground)' }}>
                <span className="text-xs opacity-50">€</span>
                <input type="number" min={priceMin} max={priceRange[1]} value={priceRange[0]}
                  onChange={e => onPriceChange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                  className="w-full bg-transparent outline-none" />
              </div>
              <div className="h-px w-4 shrink-0" style={{ background: 'var(--border)' }} />
              <div className="flex flex-1 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--secondary)', color: 'var(--foreground)' }}>
                <span className="text-xs opacity-50">€</span>
                <input type="number" min={priceRange[0]} max={priceMax} value={priceRange[1]}
                  onChange={e => onPriceChange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                  className="w-full bg-transparent outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 px-5 py-4 border-t" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <button onClick={() => { onClearAll(); onClose() }}
            className="flex-1 rounded-full border py-3 text-sm font-bold transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--secondary)' }}>
            Clear All
          </button>
          <button onClick={onClose}
            className="flex-1 rounded-full py-3 text-sm font-bold text-white transition-all"
            style={{ background: 'var(--primary)' }}>
            Show {filteredCount} Products
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main ProductCatalog ──────────────────────────────────────────────────────
export function ProductCatalog({
  externalFilterOpen, onCloseExternalFilter, hideGridWhenUnfiltered,
}: {
  externalFilterOpen?: boolean
  onCloseExternalFilter?: () => void
  hideGridWhenUnfiltered?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { products: allProducts, loading, loadingMore, hasMore, loadMore, errorMessage } = useProducts()
  const { td } = useTranslation()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // ── Read all filter state from URL params (single source of truth) ──────────
  const query          = searchParams.get('q') || ''
  const categoryParam  = searchParams.get('category') || ''  // comma-separated group match values
  const brandParam     = searchParams.get('brand') || ''     // comma-separated
  const originParam    = searchParams.get('origin') || 'All'
  const dietParam      = searchParams.get('diet') || ''      // comma-separated
  const stockParam     = searchParams.get('stock') || ''     // comma-separated
  const priceMinParam  = searchParams.get('priceMin')
  const priceMaxParam  = searchParams.get('priceMax')
  const sortParam      = (searchParams.get('sort') || 'default') as SortKey

  const selectedCategories = categoryParam ? categoryParam.split(',').filter(Boolean) : []
  const selectedBrands     = brandParam ? brandParam.split(',').filter(Boolean) : []
  const selectedDiets      = dietParam ? dietParam.split(',').filter(Boolean) : []
  const selectedStocks     = stockParam ? stockParam.split(',').filter(Boolean) : []

  // ── Computed price bounds from products ───────────────────────────────────
  const [pMin, pMax] = useMemo(() => {
    const prices = allProducts.flatMap(p => p.variants?.map(v => v.price) ?? (p.price ? [p.price] : []))
    if (!prices.length) return [0, 100]
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [allProducts])

  const priceRange: [number, number] = [
    priceMinParam !== null ? Number(priceMinParam) : pMin,
    priceMaxParam !== null ? Number(priceMaxParam) : pMax,
  ]

  // ── URL param writer — all filter changes go through here ─────────────────
  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') params.delete(key)
    else params.set(key, value)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const toggleListParam = useCallback((key: string, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter(x => x !== value) : [...current, value]
    setParam(key, next.join(',') || null)
  }, [setParam])

  function clearAll() {
    router.replace('/', { scroll: false })
  }

  // ── Dynamic options from loaded products ──────────────────────────────────
  const categoryOptions = useMemo(() =>
    CATEGORY_GROUPS.map(grp => ({
      value:   grp.match[0],
      display: grp.label,
      count:   allProducts.filter(p => grp.match.includes(p.category)).length,
    })).filter(o => o.count > 0),
  [allProducts])

  const brandOptions = useMemo(() => {
    const map = new Map<string, number>()
    allProducts.forEach(p => {
      if (p.brand) map.set(p.brand, (map.get(p.brand) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ value: brand, display: brand, count }))
  }, [allProducts])

  const stockOptions = STOCKS.map(s => ({ value: s, display: s, count: allProducts.filter(p => p.stock === s).length }))
  const dietOptions  = DIETS.map(d => ({ value: d, display: d, count: allProducts.filter(p => p.diet?.includes(d)).length }))

  // ── Filtered + sorted products ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = allProducts.filter(p => {
      // Origin
      if (originParam !== 'All' && p.origin !== originParam) return false

      // Category — selectedCategories holds raw match values (e.g. 'Rice & Atta')
      if (selectedCategories.length > 0) {
        // For each selected category value, find its group and check if product belongs
        const productMatchedAny = selectedCategories.some(sc => {
          const grp = CATEGORY_GROUPS.find(g => g.match.includes(sc))
          return grp ? grp.match.includes(p.category) : p.category === sc
        })
        if (!productMatchedAny) return false
      }

      // Brand
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand ?? '')) return false

      // Stock
      if (selectedStocks.length > 0 && !selectedStocks.includes(p.stock)) return false

      // Diet
      if (selectedDiets.length > 0 && !selectedDiets.every(d => (p.diet ?? []).includes(d))) return false

      // Price
      const price = p.price ?? p.variants?.[0]?.price ?? 0
      if (price < priceRange[0] || price > priceRange[1]) return false

      // Text search
      if (q) {
        const hay = `${p.name} ${p.tagline} ${p.category} ${p.origin} ${p.brand ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      return true
    })

    if (sortParam === 'price-asc')  result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sortParam === 'price-desc') result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sortParam === 'name')       result = [...result].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    if (sortParam === 'bestseller') result = [...result].sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0))
    return result
  }, [query, originParam, selectedCategories, selectedBrands, selectedStocks, selectedDiets, sortParam, priceRange, allProducts])

  // ── Active filter chips data ───────────────────────────────────────────────
  const activeChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = []
    if (query) chips.push({ label: `"${query}"`, onRemove: () => setParam('q', null) })
    if (originParam !== 'All') chips.push({ label: `Origin: ${originParam}`, onRemove: () => setParam('origin', null) })
    selectedCategories.forEach(sc => {
      const grp = CATEGORY_GROUPS.find(g => g.match.includes(sc))
      chips.push({ label: grp?.label ?? sc, onRemove: () => toggleListParam('category', selectedCategories, sc) })
    })
    selectedBrands.forEach(b => chips.push({ label: b, onRemove: () => toggleListParam('brand', selectedBrands, b) }))
    selectedDiets.forEach(d => chips.push({ label: d, onRemove: () => toggleListParam('diet', selectedDiets, d) }))
    selectedStocks.forEach(s => chips.push({ label: s, onRemove: () => toggleListParam('stock', selectedStocks, s) }))
    if (priceMinParam || priceMaxParam) chips.push({ label: `€${priceRange[0]}–€${priceRange[1]}`, onRemove: () => { setParam('priceMin', null); setParam('priceMax', null) } })
    if (sortParam !== 'default') chips.push({ label: `Sort: ${SORT_OPTIONS.find(o => o.key === sortParam)?.label}`, onRemove: () => setParam('sort', null) })
    return chips
  }, [query, originParam, selectedCategories, selectedBrands, selectedDiets, selectedStocks, priceMinParam, priceMaxParam, sortParam])

  const totalActiveFilters = activeChips.length
  const isDrawerOpen = mobileFilterOpen || externalFilterOpen

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 md:px-6">
        <div className="mb-4 h-12 rounded-xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
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
          <AlertTriangle className="mb-4 size-10 text-red-400" />
          <p className="font-serif text-xl font-semibold text-red-700 mb-2">Cannot load products</p>
          <p className="max-w-lg text-sm text-red-600">{errorMessage}</p>
        </div>
      </section>
    )
  }

  return (
    <section id="shop" className="scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">

        {/* ══ Filter Bar ══ */}
        <div id="shop-grid" className="scroll-mt-24 mb-4 relative z-40">

          {/* ── MOBILE: Filter & Sort button ── */}
          <div className="flex items-center gap-2 md:hidden mb-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border py-2.5 text-sm font-bold transition-all"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <Filter className="size-4" style={{ color: 'var(--primary)' }} />
              Filters & Sort
              {totalActiveFilters > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }}>
                  {totalActiveFilters}
                </span>
              )}
            </button>
            <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>
              {filtered.length} items
            </span>
          </div>

          {/* ── DESKTOP: Dookan-style filter bar ── */}
          <div className="hidden md:flex items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            {/* Left: filters */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <SlidersHorizontal className="size-4 shrink-0 opacity-40" />

              {/* Category */}
              <CheckDropdown
                label="Category"
                options={categoryOptions}
                selected={selectedCategories}
                onToggle={v => toggleListParam('category', selectedCategories, v)}
                onClear={() => setParam('category', null)}
              />

              {/* Brand — only shown if products have brands */}
              {brandOptions.length > 0 && (
                <CheckDropdown
                  label="Brand"
                  options={brandOptions}
                  selected={selectedBrands}
                  onToggle={v => toggleListParam('brand', selectedBrands, v)}
                  onClear={() => setParam('brand', null)}
                />
              )}

              {/* Origin */}
              <CheckDropdown
                label="Origin"
                options={ORIGINS.filter(o => o.label !== 'All').map(o => ({ value: o.label, display: o.label }))}
                selected={originParam !== 'All' ? [originParam] : []}
                onToggle={v => setParam('origin', originParam === v ? null : v)}
                onClear={() => setParam('origin', null)}
                renderOption={opt => {
                  const o = ORIGINS.find(x => x.label === opt.display)
                  return <span className="flex items-center gap-1.5"><FlagIcon code={o?.code ?? 'GLOBAL'} />{opt.display}</span>
                }}
              />

              {/* Dietary */}
              <CheckDropdown
                label="Dietary"
                options={dietOptions}
                selected={selectedDiets}
                onToggle={v => toggleListParam('diet', selectedDiets, v)}
                onClear={() => setParam('diet', null)}
              />

              {/* Price */}
              <PriceDropdown
                min={pMin} max={pMax} value={priceRange}
                onChange={([lo, hi]) => {
                  setParam('priceMin', lo !== pMin ? String(lo) : null)
                  setParam('priceMax', hi !== pMax ? String(hi) : null)
                }}
              />

              {/* Clear all */}
              {totalActiveFilters > 0 && (
                <button onClick={clearAll}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all shrink-0"
                  style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}>
                  <X className="size-3.5" /> Clear {totalActiveFilters}
                </button>
              )}
            </div>

            {/* Right: result count + sort */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12px] whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{filtered.length} products</span>
              <SortDropdown value={sortParam} onChange={v => setParam('sort', v === 'default' ? null : v)} />
            </div>
          </div>

          {/* ── Active filter chips row ── */}
          {activeChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeChips.map((chip, i) => (
                <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />
              ))}
              {activeChips.length > 1 && (
                <button onClick={clearAll}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
                  style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Mobile filter drawer ── */}
        <MobileFilterDrawer
          open={!!isDrawerOpen}
          onClose={() => { setMobileFilterOpen(false); onCloseExternalFilter?.() }}
          categories={categoryOptions}
          selectedCategories={selectedCategories}
          onToggleCategory={v => toggleListParam('category', selectedCategories, v)}
          brands={brandOptions}
          selectedBrands={selectedBrands}
          onToggleBrand={v => toggleListParam('brand', selectedBrands, v)}
          origins={ORIGINS}
          selectedOrigin={originParam}
          onSelectOrigin={v => setParam('origin', v === 'All' ? null : v)}
          diets={DIETS}
          selectedDiets={selectedDiets}
          onToggleDiet={v => toggleListParam('diet', selectedDiets, v)}
          stocks={STOCKS}
          selectedStocks={selectedStocks}
          onToggleStock={v => toggleListParam('stock', selectedStocks, v)}
          priceMin={pMin}
          priceMax={pMax}
          priceRange={priceRange}
          onPriceChange={([lo, hi]) => {
            setParam('priceMin', lo !== pMin ? String(lo) : null)
            setParam('priceMax', hi !== pMax ? String(hi) : null)
          }}
          sort={sortParam}
          onSortChange={v => setParam('sort', v === 'default' ? null : v)}
          filteredCount={filtered.length}
          onClearAll={clearAll}
        />

        {/* ══ Product grid ══ */}
        {!hideGridWhenUnfiltered && (
          filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
            <PackageSearch className="mb-4 size-10" style={{ color: 'var(--muted-foreground)' }} />
            <p className="font-serif text-xl font-semibold" style={{ color: 'var(--foreground)' }}>No products found</p>
            <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--muted-foreground)' }}>Try adjusting your search or filters.</p>
            {totalActiveFilters > 0 && (
              <button onClick={clearAll} className="mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: 'var(--primary)' }}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )
        )}

        {/* ══ Load more ══ */}
        {!hideGridWhenUnfiltered && hasMore && !loading && filtered.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button onClick={loadMore} disabled={loadingMore}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all disabled:opacity-60">
              {loadingMore ? <><Loader2 className="size-4 animate-spin text-orange-500" />Loading…</> : 'Load more products'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
