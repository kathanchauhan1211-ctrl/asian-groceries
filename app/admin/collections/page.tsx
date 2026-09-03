'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useProducts } from '@/lib/use-products'
import {
  Plus, Trash2, X, Save, ChevronUp, ChevronDown,
  Loader2, Check, Eye, EyeOff, Layers, Search,
  ToggleLeft, ToggleRight, Settings2,
} from 'lucide-react'
import type { FeaturedCollectionDoc, AutoRule } from '@/lib/use-featured-collections'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#080C14',
  surface: '#0D1117',
  card:    '#111827',
  border:  'rgba(255,255,255,0.07)',
  muted:   '#374151',
  subtle:  '#1F2937',
}

// ─── Auto-rule options ────────────────────────────────────────────────────────
const AUTO_RULE_OPTIONS: { value: AutoRule | ''; label: string; description: string }[] = [
  { value: 'price_asc',   label: '🔥 Best Offers',     description: 'Cheapest in-stock products first' },
  { value: 'newest',      label: '✨ New Arrivals',      description: 'Most recently added products' },
  { value: 'bestseller',  label: '⭐ Bestsellers',       description: 'Products marked as bestseller' },
  { value: 'low_stock',   label: '⚡ Almost Gone',       description: 'Low stock products (urgency)' },
]

// ─── Default seed collections — mirrors page-content.tsx fallback carousels ──
const SEED_COLLECTIONS: Omit<FeaturedCollectionDoc, 'id'>[] = [
  {
    title:       "🔥 Today's Best Offers",
    order:       0,
    enabled:     true,
    mode:        'auto',
    autoRule:    'price_asc',
    productIds:  [],
    maxItems:    15,
    viewAllHref: '/?sort=price-asc',
  },
  {
    title:       '✨ New Arrivals',
    order:       1,
    enabled:     true,
    mode:        'auto',
    autoRule:    'newest',
    productIds:  [],
    maxItems:    15,
    viewAllHref: '/',
  },
  {
    title:       '⭐ Bestsellers',
    order:       2,
    enabled:     true,
    mode:        'auto',
    autoRule:    'bestseller',
    productIds:  [],
    maxItems:    15,
    viewAllHref: '/?sort=bestseller',
  },
]

// ─── Default form ─────────────────────────────────────────────────────────────
function defaultForm(): Omit<FeaturedCollectionDoc, 'id'> {
  return {
    title:       '',
    order:       999,
    enabled:     true,
    mode:        'auto',
    autoRule:    'price_asc',
    productIds:  [],
    maxItems:    12,
    viewAllHref: '/',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function inputStyle(focused: boolean) {
  return focused
    ? { border: '1px solid rgba(249,115,22,0.45)', boxShadow: '0 0 0 3px rgba(249,115,22,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white' }
    : { border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', color: 'white' }
}

function FInput({ value, onChange, placeholder, type = 'text', step }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string
}) {
  const [f, setF] = useState(false)
  return (
    <input
      type={type} step={step} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className="w-full rounded-md px-2.5 py-1.5 text-[13px] outline-none placeholder:text-gray-600"
      style={inputStyle(f)}
    />
  )
}

// ─── Product picker (manual mode) ─────────────────────────────────────────────
function ProductPicker({
  allProducts, selected, onToggle,
}: {
  allProducts: { id: string; name: string; brand?: string; category: string; image?: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const lq = q.toLowerCase()
    return allProducts.filter(p =>
      !q || p.name.toLowerCase().includes(lq) || (p.brand ?? '').toLowerCase().includes(lq)
    ).slice(0, 40)
  }, [allProducts, q])

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <Search className="size-3.5 shrink-0" style={{ color: '#4B5563' }} />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search products to add…"
          className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-600"
        />
      </div>

      {/* Selected count */}
      <p className="text-[11px]" style={{ color: '#4B5563' }}>
        {selected.length} product{selected.length !== 1 ? 's' : ''} selected
      </p>

      {/* Product list */}
      <div
        className="max-h-52 overflow-y-auto rounded-lg space-y-0.5"
        style={{ border: `1px solid ${C.border}` }}
      >
        {filtered.map(p => {
          const active = selected.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
              style={{
                background: active ? 'rgba(249,115,22,0.06)' : 'transparent',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {p.image ? (
                <img src={p.image} alt="" className="size-7 rounded object-cover shrink-0" />
              ) : (
                <div className="size-7 rounded shrink-0 flex items-center justify-center" style={{ background: C.subtle }}>
                  <Layers className="size-3.5" style={{ color: '#374151' }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white">{p.name}</p>
                <p className="truncate text-[10px]" style={{ color: '#4B5563' }}>{p.brand || p.category}</p>
              </div>
              <div
                className="size-4 rounded shrink-0 flex items-center justify-center"
                style={{
                  background: active ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.05)',
                  border: active ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {active && <Check className="size-2.5" style={{ color: '#F97316' }} />}
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[12px]" style={{ color: '#4B5563' }}>No products found</p>
        )}
      </div>
    </div>
  )
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────
function CollectionDrawer({
  initial, allProducts, onSave, onClose, allCategories, allOrigins,
}: {
  initial: Omit<FeaturedCollectionDoc, 'id'> & { id?: string }
  allProducts: { id: string; name: string; brand?: string; category: string; image?: string }[]
  onSave: (data: Omit<FeaturedCollectionDoc, 'id'>, id?: string) => Promise<void>
  onClose: () => void
  allCategories: string[]
  allOrigins: string[]
}) {
  const [form, setForm] = useState<Omit<FeaturedCollectionDoc, 'id'>>({
    title:       initial.title,
    order:       initial.order,
    enabled:     initial.enabled,
    mode:        initial.mode,
    autoRule:    initial.autoRule,
    productIds:  initial.productIds ?? [],
    maxItems:    initial.maxItems ?? 12,
    viewAllHref: initial.viewAllHref ?? '/',
  })
  const [saving, setSaving] = useState(false)

  // Extended auto-rule options including dynamic categories and origins
  const extendedRules = useMemo(() => [
    ...AUTO_RULE_OPTIONS,
    ...allCategories.map(c => ({
      value: `category:${c}` as AutoRule,
      label: `📦 ${c}`,
      description: `All products in category "${c}"`,
    })),
    ...allOrigins.map(o => ({
      value: `origin:${o}` as AutoRule,
      label: `🌍 From ${o}`,
      description: `All products from "${o}"`,
    })),
  ], [allCategories, allOrigins])

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form, initial.id)
    setSaving(false)
    onClose()
  }

  function toggleProductId(id: string) {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter(x => x !== id)
        : [...f.productIds, id],
    }))
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex" style={{ width: '460px' }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="relative ml-auto flex h-full w-full flex-col overflow-hidden"
        style={{ background: C.surface, borderLeft: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div>
            <p className="text-[14px] font-semibold text-white">
              {initial.id ? 'Edit Collection' : 'New Collection'}
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: '#4B5563' }}>
              Changes appear on the storefront instantly
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
              Title <span style={{ color: '#F97316' }}>*</span>
            </label>
            <FInput
              value={form.title}
              onChange={v => setForm(f => ({ ...f, title: v }))}
              placeholder="e.g. 🔥 Hot Picks"
            />
          </div>

          {/* Mode toggle */}
          <div>
            <label className="block mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
              Mode
            </label>
            <div className="flex gap-2">
              {(['auto', 'manual'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: m }))}
                  className="flex-1 rounded-lg py-2 text-[13px] font-semibold transition-all"
                  style={{
                    background: form.mode === m ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.04)',
                    border: form.mode === m ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.09)',
                    color: form.mode === m ? '#F97316' : '#6B7280',
                  }}
                >
                  {m === 'auto' ? '⚡ Auto Rule' : '✋ Manual Pick'}
                </button>
              ))}
            </div>
          </div>

          {/* Auto rule picker */}
          {form.mode === 'auto' && (
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                Rule
              </label>
              <select
                value={form.autoRule}
                onChange={e => setForm(f => ({ ...f, autoRule: e.target.value as AutoRule }))}
                className="w-full cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] outline-none appearance-none"
                style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                {extendedRules.map(r => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </select>
            </div>
          )}

          {/* Manual product picker */}
          {form.mode === 'manual' && (
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                Pick Products
              </label>
              <ProductPicker
                allProducts={allProducts}
                selected={form.productIds}
                onToggle={toggleProductId}
              />
            </div>
          )}

          {/* Max items */}
          <div>
            <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
              Max Items: <span className="text-white font-bold">{form.maxItems}</span>
            </label>
            <input
              type="range" min={4} max={20} value={form.maxItems}
              onChange={e => setForm(f => ({ ...f, maxItems: Number(e.target.value) }))}
              className="w-full cursor-pointer"
              style={{ accentColor: '#F97316' }}
            />
          </div>

          {/* View All href */}
          <div>
            <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
              "View All" Link
            </label>
            <FInput
              value={form.viewAllHref}
              onChange={v => setForm(f => ({ ...f, viewAllHref: v }))}
              placeholder="/?sort=price-asc"
            />
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[13px] font-semibold text-white">Enabled</p>
              <p className="text-[11px]" style={{ color: '#4B5563' }}>Show this carousel on the storefront</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
              className="transition-transform active:scale-95"
            >
              {form.enabled
                ? <ToggleRight className="size-8" style={{ color: '#F97316' }} />
                : <ToggleLeft className="size-8" style={{ color: '#374151' }} />
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 shrink-0 flex gap-3"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <button
            onClick={onClose}
            className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${C.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 4px 14px rgba(249,115,22,0.25)' }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving…' : (initial.id ? 'Save Changes' : 'Create Collection')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Collection Row ───────────────────────────────────────────────────────────
function CollectionRow({
  col, onEdit, onDelete, onToggle, onMoveUp, onMoveDown, isFirst, isLast, productCount,
}: {
  col: FeaturedCollectionDoc
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  productCount: number
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete collection "${col.title}"?`)) return
    setDeleting(true)
    onDelete()
  }

  const modeLabel = col.mode === 'manual'
    ? `Manual · ${col.productIds?.length ?? 0} items`
    : `Auto · ${col.autoRule || '—'}`

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      style={{
        background: deleting ? 'rgba(239,68,68,0.04)' : 'transparent',
        borderBottom: `1px solid ${C.border}`,
        opacity: deleting ? 0.4 : 1,
      }}
    >
      {/* Reorder buttons */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp} disabled={isFirst}
          className="flex size-5 items-center justify-center rounded transition-all disabled:opacity-20"
          style={{ color: '#6B7280' }}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          onClick={onMoveDown} disabled={isLast}
          className="flex size-5 items-center justify-center rounded transition-all disabled:opacity-20"
          style={{ color: '#6B7280' }}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white truncate">{col.title}</p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: '#4B5563' }}>
          {modeLabel} · {productCount} product{productCount !== 1 ? 's' : ''} shown
        </p>
      </div>

      {/* Enabled toggle */}
      <button onClick={onToggle} className="transition-transform active:scale-95 shrink-0" title={col.enabled ? 'Visible — click to hide' : 'Hidden — click to show'}>
        {col.enabled
          ? <Eye className="size-4" style={{ color: '#10B981' }} />
          : <EyeOff className="size-4" style={{ color: '#374151' }} />
        }
      </button>

      {/* Edit */}
      <button
        onClick={onEdit}
        className="flex size-7 items-center justify-center rounded-md transition-all"
        style={{ color: '#6B7280', background: 'transparent', border: '1px solid transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#F9FAFB' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280' }}
      >
        <Settings2 className="size-3.5" />
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="flex size-7 items-center justify-center rounded-md transition-all"
        style={{ color: '#EF4444', background: 'transparent', border: '1px solid transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCollectionsPage() {
  const { products: allProducts } = useProducts()

  const [cols, setCols]       = useState<FeaturedCollectionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerData, setDrawerData] = useState<(Omit<FeaturedCollectionDoc, 'id'> & { id?: string }) | null>(null)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // Real-time listener
  useEffect(() => {
    const q = query(collection(clientDb, 'collections'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setCols(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedCollectionDoc)))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  // Derived data for the product picker
  const allCategories = useMemo(() => [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort(), [allProducts])
  const allOrigins    = useMemo(() => [...new Set(allProducts.map(p => p.origin).filter(Boolean))].sort(), [allProducts])

  // Resolve how many products each collection would show right now
  function resolveCount(col: FeaturedCollectionDoc): number {
    if (col.mode === 'manual') return (col.productIds ?? []).length
    const max = col.maxItems || 12
    const rule = col.autoRule
    let pool = [...allProducts]
    if (rule === 'price_asc')           pool = pool.filter(p => p.stock !== 'Out of Stock').sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    else if (rule === 'newest')         pool = pool.slice().reverse()
    else if (rule === 'bestseller')     pool = pool.filter(p => p.bestseller)
    else if (rule === 'low_stock')      pool = pool.filter(p => p.stock === 'Low Stock')
    else if (rule?.startsWith('category:')) pool = pool.filter(p => p.category?.toLowerCase() === rule.slice(9).toLowerCase())
    else if (rule?.startsWith('origin:'))   pool = pool.filter(p => p.origin?.toLowerCase() === rule.slice(7).toLowerCase())
    return Math.min(pool.length, max)
  }

  // Save (create or update)
  async function handleSave(data: Omit<FeaturedCollectionDoc, 'id'>, id?: string) {
    try {
      if (id) {
        await updateDoc(doc(clientDb, 'collections', id), { ...data })
        showToast('Collection updated')
      } else {
        const nextOrder = cols.length > 0 ? Math.max(...cols.map(c => c.order)) + 1 : 0
        await addDoc(collection(clientDb, 'collections'), { ...data, order: nextOrder })
        showToast('Collection created — live on storefront!')
      }
    } catch (e: any) {
      showToast(e.message ?? 'Save failed', false)
    }
  }

  // Toggle enabled
  async function handleToggle(col: FeaturedCollectionDoc) {
    await updateDoc(doc(clientDb, 'collections', col.id), { enabled: !col.enabled })
  }

  // Delete
  async function handleDelete(col: FeaturedCollectionDoc) {
    await deleteDoc(doc(clientDb, 'collections', col.id))
    showToast('Collection deleted')
  }

  // Reorder
  async function move(col: FeaturedCollectionDoc, dir: -1 | 1) {
    const sorted = [...cols].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(c => c.id === col.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    await Promise.all([
      updateDoc(doc(clientDb, 'collections', a.id), { order: b.order }),
      updateDoc(doc(clientDb, 'collections', b.id), { order: a.order }),
    ])
  }

  const sorted = [...cols].sort((a, b) => a.order - b.order)

  return (
    <div className="mx-auto max-w-[860px] space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-bold text-white">Featured Collections</h1>
          <p className="mt-0.5 text-[13px]" style={{ color: '#4B5563' }}>
            Manage homepage carousels — changes go live instantly on the storefront
          </p>
        </div>
        <button
          onClick={() => setDrawerData(defaultForm())}
          className="flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.2)' }}
        >
          <Plus className="size-4" />
          New Collection
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-medium"
          style={{
            background: toast.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: toast.ok ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
            color: toast.ok ? '#10B981' : '#EF4444',
          }}
        >
          {toast.ok ? <Check className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Hint banner */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <Layers className="size-4 mt-0.5 shrink-0" style={{ color: '#60A5FA' }} />
        <p className="text-[12px]" style={{ color: '#93C5FD' }}>
          <strong>Auto collections</strong> are built from your product catalog in real-time.
          {' '}<strong>Manual collections</strong> let you hand-pick specific products and set their display order.
          {' '}Use the eye icon to instantly show or hide any carousel.
        </p>
      </div>

      {/* Collections list */}
      {loading ? (
        <div
          className="flex items-center justify-center gap-3 rounded-xl py-20"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <Loader2 className="size-5 animate-spin" style={{ color: '#F97316' }} />
          <span className="text-[13px]" style={{ color: '#4B5563' }}>Loading collections…</span>
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-xl py-20"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <div className="flex size-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(249,115,22,0.08)' }}>
            <Layers className="size-7" style={{ color: '#F97316' }} />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-white">No collections yet</p>
            <p className="mt-1 text-[12px]" style={{ color: '#4B5563' }}>
              The storefront shows 3 built-in carousels until you create one here.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDrawerData(defaultForm())}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
            >
              <Plus className="size-4" /> Create collection
            </button>
            <button
              onClick={async () => {
                try {
                  for (const col of SEED_COLLECTIONS) {
                    await addDoc(collection(clientDb, 'collections'), col)
                  }
                  showToast('3 default collections loaded — live on storefront!')
                } catch (e: any) {
                  showToast(e.message ?? 'Seed failed', false)
                }
              }}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#9CA3AF', border: `1px solid ${C.border}` }}
            >
              ✨ Load default collections
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          {sorted.map((col, i) => (
            <CollectionRow
              key={col.id}
              col={col}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
              productCount={resolveCount(col)}
              onEdit={() => setDrawerData({ ...col })}
              onDelete={() => handleDelete(col)}
              onToggle={() => handleToggle(col)}
              onMoveUp={() => move(col, -1)}
              onMoveDown={() => move(col, 1)}
            />
          ))}
        </div>
      )}

      {/* Edit / Create Drawer */}
      {drawerData && (
        <CollectionDrawer
          initial={drawerData}
          allProducts={allProducts}
          allCategories={allCategories}
          allOrigins={allOrigins}
          onSave={handleSave}
          onClose={() => setDrawerData(null)}
        />
      )}
    </div>
  )
}
