'use client'

/**
 * app/admin/daily-fresh/page.tsx
 *
 * Admin page to manage the "Daily Fresh" homepage section.
 * Two fixed rows: Vegetables and Fruits.
 * Admin can search products and add/remove them from each row.
 * Writes to Firestore `dailyFresh/{vegetables|fruits}`.
 */

import { useState, useEffect, useMemo } from 'react'
import {
  doc, collection, onSnapshot, setDoc,
} from 'firebase/firestore'
import { adminPortalDb } from '@/lib/firebase-admin-client'
import {
  Search, X, Loader2, Save, Check, Leaf, AlertCircle, Plus,
  Eye, EyeOff, GripVertical,
} from 'lucide-react'

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      '#080C14',
  surface: '#0D1117',
  card:    '#111827',
  border:  'rgba(255,255,255,0.07)',
  muted:   '#4B5563',
  subtle:  '#1F2937',
  orange:  '#F97316',
  green:   '#16a34a',
  red:     '#dc2626',
}

type AdminProduct = { id: string; name: string; image?: string; price?: number; category?: string; brand?: string }

type FreshRow = {
  id: 'vegetables' | 'fruits'
  title: string
  emoji: string
  productIds: string[]
  enabled: boolean
}

const DEFAULT_ROWS: FreshRow[] = [
  { id: 'vegetables', title: 'Fresh Vegetables', emoji: '🥦', productIds: [], enabled: true },
  { id: 'fruits',     title: 'Fresh Fruits',     emoji: '🍎', productIds: [], enabled: true },
]

// ── Product search box ─────────────────────────────────────────────────────────
function ProductSearch({
  allProducts,
  selected,
  onAdd,
}: {
  allProducts: AdminProduct[]
  selected: string[]
  onAdd: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    if (!q.trim()) return []
    const lq = q.toLowerCase()
    return allProducts
      .filter(p => !selected.includes(p.id))
      .filter(p =>
        p.name?.toLowerCase().includes(lq) ||
        p.category?.toLowerCase().includes(lq) ||
        p.brand?.toLowerCase().includes(lq),
      )
      .slice(0, 12)
  }, [q, allProducts, selected])

  return (
    <div className="relative">
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
        style={{ background: C.subtle, borderColor: C.border }}
      >
        <Search className="size-4 shrink-0" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search products by name, category, brand…"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
        />
        {q && (
          <button onClick={() => { setQ(''); setOpen(false) }}>
            <X className="size-4" style={{ color: C.muted }} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: C.card, border: `1px solid ${C.border}`, maxHeight: 320, overflowY: 'auto' }}
        >
          {results.map(p => (
            <button
              key={p.id}
              onMouseDown={() => { onAdd(p.id); setQ(''); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-orange-500/10"
            >
              {p.image ? (
                <img src={p.image} alt="" className="size-8 rounded-lg object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="size-8 rounded-lg shrink-0 flex items-center justify-center text-gray-600 border border-white/10" style={{ background: C.subtle }}>📦</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{p.name}</p>
                <p className="text-[11px] truncate" style={{ color: C.muted }}>{p.category}{p.brand ? ` · ${p.brand}` : ''}</p>
              </div>
              {p.price !== undefined && (
                <span className="shrink-0 text-[12px] font-bold" style={{ color: C.orange }}>€{Number(p.price).toFixed(2)}</span>
              )}
              <Plus className="size-4 shrink-0" style={{ color: C.green }} />
            </button>
          ))}
        </div>
      )}

      {open && q && results.length === 0 && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl px-4 py-6 text-center text-sm shadow-2xl"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}
        >
          No matching products found
        </div>
      )}
    </div>
  )
}

// ── Row editor card ────────────────────────────────────────────────────────────
function RowCard({
  row,
  allProducts,
  saving,
  onSave,
}: {
  row: FreshRow
  allProducts: AdminProduct[]
  saving: boolean
  onSave: (updated: FreshRow) => Promise<void>
}) {
  const [local, setLocal] = useState<FreshRow>(row)
  const [dirty, setDirty] = useState(false)
  const [localSaving, setLocalSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Sync when row changes from Firestore
  useEffect(() => {
    setLocal(row)
    setDirty(false)
  }, [row])

  function update(patch: Partial<FreshRow>) {
    setLocal(prev => ({ ...prev, ...patch }))
    setDirty(true)
  }

  function addProduct(id: string) {
    if (local.productIds.includes(id)) return
    update({ productIds: [...local.productIds, id] })
  }

  function removeProduct(id: string) {
    update({ productIds: local.productIds.filter(x => x !== id) })
  }

  function moveProduct(idx: number, dir: -1 | 1) {
    const next = [...local.productIds]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    update({ productIds: next })
  }

  async function handleSave() {
    setLocalSaving(true)
    try {
      await onSave(local)
      setDirty(false)
      setToast('Saved!')
      setTimeout(() => setToast(null), 2500)
    } finally {
      setLocalSaving(false)
    }
  }

  const productMap = useMemo(
    () => new Map(allProducts.map(p => [p.id, p])),
    [allProducts],
  )

  const accentColor = row.id === 'vegetables' ? C.green : C.red

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: dirty ? accentColor + '50' : C.border, background: C.surface }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: C.border, background: C.card }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{local.emoji}</span>
          <div>
            <input
              value={local.title}
              onChange={e => update({ title: e.target.value })}
              className="bg-transparent text-white font-black text-[16px] outline-none border-b border-transparent focus:border-orange-500/40 transition-colors w-48"
              placeholder="Row title"
            />
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
              {local.productIds.length} product{local.productIds.length !== 1 ? 's' : ''} pinned
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {toast && (
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400">
              <Check className="size-3.5" /> {toast}
            </span>
          )}

          {/* Toggle enabled */}
          <button
            onClick={() => update({ enabled: !local.enabled })}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold border transition-all"
            style={{
              borderColor: local.enabled ? C.green + '40' : C.border,
              background: local.enabled ? C.green + '15' : 'transparent',
              color: local.enabled ? '#4ade80' : C.muted,
            }}
          >
            {local.enabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            {local.enabled ? 'Visible' : 'Hidden'}
          </button>

          <button
            onClick={handleSave}
            disabled={!dirty || localSaving}
            className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-bold text-white transition-all disabled:opacity-40"
            style={{ background: dirty ? accentColor : C.subtle }}
          >
            {localSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Product search */}
      <div className="px-5 pt-4 pb-3">
        <ProductSearch
          allProducts={allProducts}
          selected={local.productIds}
          onAdd={addProduct}
        />
      </div>

      {/* Pinned products list */}
      {local.productIds.length === 0 ? (
        <div className="px-5 pb-6 text-center py-8">
          <p className="text-[13px]" style={{ color: C.muted }}>
            No products yet — search above to add some
          </p>
        </div>
      ) : (
        <div className="px-5 pb-5 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
            Pinned Products — drag to reorder
          </p>
          {local.productIds.map((pid, idx) => {
            const p = productMap.get(pid)
            return (
              <div
                key={pid}
                className="flex items-center gap-3 rounded-xl px-3 py-2 border group"
                style={{ background: C.card, borderColor: C.border }}
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveProduct(idx, -1)}
                    disabled={idx === 0}
                    className="flex size-5 items-center justify-center rounded transition-colors hover:bg-white/10 disabled:opacity-20"
                  >
                    <GripVertical className="size-3" style={{ color: C.muted }} />
                  </button>
                </div>

                {/* Image */}
                {p?.image ? (
                  <img src={p.image} alt="" className="size-9 rounded-lg object-cover shrink-0 border border-white/10" />
                ) : (
                  <div className="size-9 rounded-lg shrink-0 flex items-center justify-center text-gray-600 border border-white/10" style={{ background: C.subtle }}>📦</div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">{p?.name ?? pid}</p>
                  <p className="text-[11px] truncate" style={{ color: C.muted }}>
                    {p?.category ?? '—'}{p?.brand ? ` · ${p.brand}` : ''}
                  </p>
                </div>

                {p?.price !== undefined && (
                  <span className="shrink-0 text-[12px] font-bold" style={{ color: C.orange }}>€{Number(p.price).toFixed(2)}</span>
                )}

                {/* Remove */}
                <button
                  onClick={() => removeProduct(pid)}
                  className="shrink-0 flex size-7 items-center justify-center rounded-lg transition-all hover:bg-red-500/15 opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <X className="size-3.5 text-red-400" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DailyFreshAdmin() {
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([])
  const [rows, setRows] = useState<FreshRow[]>(DEFAULT_ROWS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load products
  useEffect(() => {
    const unsub = onSnapshot(collection(adminPortalDb, 'products'), snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminProduct)))
    })
    return () => unsub()
  }, [])

  // Load Daily Fresh rows from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(adminPortalDb, 'dailyFresh'), snap => {
      if (snap.empty) {
        // First time: seed defaults
        setRows(DEFAULT_ROWS)
      } else {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FreshRow))
        // Merge with defaults so both rows always exist
        const merged = DEFAULT_ROWS.map(def => {
          const found = data.find(r => r.id === def.id)
          return found ?? def
        })
        setRows(merged)
      }
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  async function saveRow(updated: FreshRow) {
    const ref = doc(adminPortalDb, 'dailyFresh', updated.id)
    await setDoc(ref, {
      title:      updated.title,
      emoji:      updated.emoji,
      productIds: updated.productIds,
      enabled:    updated.enabled,
    }, { merge: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin" style={{ color: C.orange }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] pb-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="size-5" style={{ color: C.green }} />
            <h2 className="text-[20px] font-bold text-white tracking-tight">Daily Fresh</h2>
          </div>
          <p className="text-[13px]" style={{ color: C.muted }}>
            Curate the two product rows shown on the homepage. Add products from your catalogue to each row.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold border transition-all hover:bg-white/5"
          style={{ borderColor: C.border, color: C.muted }}
        >
          Preview Homepage ↗
        </a>
      </div>

      {/* Info box */}
      <div
        className="flex items-start gap-3 rounded-xl border px-4 py-3 mb-8 text-sm"
        style={{ borderColor: C.border, background: C.card }}
      >
        <AlertCircle className="size-4 shrink-0 mt-0.5" style={{ color: C.orange }} />
        <p style={{ color: C.muted }}>
          Changes are saved per row and go <strong className="text-white">live instantly</strong> on the homepage.
          Use the <strong className="text-white">Visible / Hidden</strong> toggle to show or hide each row.
          Search and add products from your full product catalogue below.
        </p>
      </div>

      {/* Row cards */}
      <div className="space-y-6">
        {rows.map(row => (
          <RowCard
            key={row.id}
            row={row}
            allProducts={allProducts}
            saving={saving}
            onSave={saveRow}
          />
        ))}
      </div>
    </div>
  )
}
