'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { adminPortalDb as clientDb } from '@/lib/firebase-admin-client'
import {
  Loader2, ChevronLeft, ChevronRight, Package, Sparkles,
  Star, Tag, Flame, ShoppingBag, Pin, PinOff, TrendingUp, X,
} from 'lucide-react'
import {
  useShopCategories,
  SHOP_CATEGORY_DEFS,
  type ShopCategoryDef,
} from '@/lib/use-shop-categories'

// ─── Glass design token (iOS / storefront style) ──────────────────────────────
const GLASS = {
  surface:     'rgba(255,255,255,0.06)',
  border:      'rgba(255,255,255,0.12)',
  filter:      'blur(20px) saturate(180%)',
  innerSurface:'rgba(255,255,255,0.04)',
  innerBorder: 'rgba(255,255,255,0.08)',
}

// ─── Tiny product chip for the swipeable feed strip ───────────────────────────
function ProductChip({
  product, accent, pinned,
}: {
  product: any
  accent: string
  pinned: boolean
}) {
  return (
    <div
      className="relative flex-shrink-0 rounded-xl overflow-hidden"
      style={{
        width: '90px',
        background: GLASS.surface,
        backdropFilter: GLASS.filter,
        border: pinned ? `1.5px solid ${accent}60` : `1px solid ${GLASS.border}`,
        boxShadow: pinned ? `0 0 12px ${accent}25` : '0 2px 8px rgba(0,0,0,0.25)',
      }}
    >
      {/* Image */}
      <div className="relative h-[72px] w-full overflow-hidden">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Package className="size-5" style={{ color: '#374151' }} />
          </div>
        )}
        {/* Pin badge */}
        {pinned && (
          <div
            className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}80` }}
          >
            <Pin className="size-2.5 text-white" />
          </div>
        )}
      </div>
      {/* Name */}
      <div className="px-1.5 py-1.5">
        <p className="text-[9px] font-semibold text-white line-clamp-2 leading-tight">{product.name}</p>
        <p className="text-[8px] mt-0.5 font-bold" style={{ color: accent }}>€{Number(product.price || 0).toFixed(2)}</p>
      </div>
    </div>
  )
}

// ─── Shop Category Panel ──────────────────────────────────────────────────────
function ShopCategoryPanel({
  def,
  catDoc,
  allProducts,
}: {
  def: ShopCategoryDef
  catDoc: { pinnedProductIds: string[]; maxItems: number }
  allProducts: any[]
}) {
  const stripRef = useRef<HTMLDivElement>(null)

  const pinnedIds = catDoc.pinnedProductIds ?? []
  const pinnedProducts = useMemo(() => {
    const map = new Map(allProducts.map(p => [p.id, p]))
    return pinnedIds.map(id => map.get(id)).filter(Boolean)
  }, [allProducts, pinnedIds])

  const autoProducts = useMemo(() => {
    let pool = [...allProducts]
    if (def.key === 'best-offer')   pool = pool.filter(p => (p.price ?? 0) < 5).sort((a, b) => (a.price || 0) - (b.price || 0))
    if (def.key === 'bestsellers')  pool = pool.filter(p => p.bestseller)
    if (def.key === 'new-arrivals') pool = [...pool].reverse()
    if (def.key === 'sale')         pool = pool.sort((a, b) => (a.price || 0) - (b.price || 0))
    const pinnedSet = new Set(pinnedIds)
    return pool.filter(p => !pinnedSet.has(p.id)).slice(0, catDoc.maxItems || 15)
  }, [allProducts, def.key, pinnedIds, catDoc.maxItems])

  const feedProducts = [...pinnedProducts, ...autoProducts].slice(0, catDoc.maxItems || 15)

  function scrollStrip(dir: -1 | 1) {
    stripRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: GLASS.surface,
        backdropFilter: GLASS.filter,
        border: `1px solid ${GLASS.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{
            background: `${def.color}18`,
            border: `1px solid ${def.color}35`,
            boxShadow: `0 0 20px ${def.color}15`,
          }}
        >
          {def.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-white">{def.label}</h3>
            {pinnedIds.length > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: `${def.color}18`,
                  color: def.color,
                  border: `1px solid ${def.color}30`,
                }}
              >
                <Pin className="size-2.5" />
                {pinnedIds.length} pinned
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: GLASS.innerSurface, color: '#9CA3AF', border: `1px solid ${GLASS.innerBorder}` }}
            >
              <ShoppingBag className="size-2.5" />
              {feedProducts.length} in feed
            </span>
          </div>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#6B7280' }}>
            {def.description}
          </p>
        </div>

        {/* Scroll controls */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => scrollStrip(-1)}
            className="flex size-7 items-center justify-center rounded-xl transition-all"
            style={{ background: GLASS.innerSurface, border: `1px solid ${GLASS.innerBorder}`, color: '#6B7280' }}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollStrip(1)}
            className="flex size-7 items-center justify-center rounded-xl transition-all"
            style={{ background: GLASS.innerSurface, border: `1px solid ${GLASS.innerBorder}`, color: '#6B7280' }}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Live feed strip */}
      {feedProducts.length > 0 ? (
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
              Live Feed Preview · {feedProducts.length} products
            </p>
            <p className="text-[10px]" style={{ color: '#374151' }}>
              Manage pins from <span style={{ color: def.color }}>Products</span> page (⋮ button)
            </p>
          </div>
          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {feedProducts.map((p, i) => (
              <ProductChip
                key={p.id}
                product={p}
                accent={def.color}
                pinned={pinnedIds.includes(p.id)}
              />
            ))}
          </div>
          {pinnedIds.length > 0 && (
            <p className="mt-2 text-[10px]" style={{ color: '#374151' }}>
              📌 Pinned products (glowing border) appear first in the storefront popup. Pin/unpin from the <strong>Products</strong> or <strong>Orders</strong> page.
            </p>
          )}
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div
            className="flex flex-col items-center gap-2 rounded-xl py-8"
            style={{ background: GLASS.innerSurface, border: `1px solid ${GLASS.innerBorder}` }}
          >
            <span className="text-2xl">{def.emoji}</span>
            <p className="text-[12px] font-semibold text-white">No products in this feed yet</p>
            <p className="text-[11px] text-center" style={{ color: '#4B5563' }}>
              Go to the <strong>Products</strong> page, find a product, and click ⋮ to pin it here.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCollectionsPage() {
  const { docs: shopDocs, loading } = useShopCategories(clientDb)
  const [clearing, setClearing] = useState(false)

  // We still need allProducts for the feed preview
  const [allProducts, setAllProducts] = useState<any[]>([])
  useEffect(() => {
    const unsub = onSnapshot(
      collection(clientDb, 'products'),
      (snap: any) => setAllProducts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  async function handleClearAll() {
    if (!confirm('Are you sure you want to clear all pinned products from all feeds? Auto-products will still show.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/admin/clear-feeds', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clear feeds')
      // Optional: show toast here
    } catch (err) {
      console.error(err)
      alert('Error clearing feeds')
    } finally {
      setClearing(false)
    }
  }

  const totalPinned = Object.values(shopDocs).reduce(
    (sum, d) => sum + (d.pinnedProductIds?.length ?? 0), 0
  )

  return (
    <div className="mx-auto max-w-[860px] space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Shop Category Feeds</h1>
          <p className="mt-0.5 text-[13px]" style={{ color: '#4B5563' }}>
            Each category card on the storefront opens a popup — these feeds control what products appear in them
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: totalPinned > 0 ? 'rgba(249,115,22,0.08)' : GLASS.innerSurface,
              border: totalPinned > 0 ? '1px solid rgba(249,115,22,0.2)' : `1px solid ${GLASS.innerBorder}`,
            }}
          >
            <Pin className="size-3.5" style={{ color: totalPinned > 0 ? '#F97316' : '#4B5563' }} />
            <span className="text-[12px] font-semibold" style={{ color: totalPinned > 0 ? '#F97316' : '#4B5563' }}>
              {totalPinned} pinned
            </span>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: GLASS.innerSurface, border: `1px solid ${GLASS.innerBorder}` }}
          >
            <TrendingUp className="size-3.5" style={{ color: '#10B981' }} />
            <span className="text-[12px] font-semibold" style={{ color: '#10B981' }}>{allProducts.length} products</span>
          </div>
          <button
            onClick={handleClearAll}
            disabled={clearing || totalPinned === 0}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all disabled:opacity-50 hover:bg-red-500/10 hover:text-red-400"
            style={{ background: GLASS.innerSurface, border: `1px solid ${GLASS.innerBorder}`, color: '#EF4444' }}
          >
            {clearing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            Clear All
          </button>
        </div>
      </div>

      {/* How-to hint */}
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5"
        style={{
          background: GLASS.surface,
          backdropFilter: GLASS.filter,
          border: `1px solid ${GLASS.border}`,
        }}
      >
        <Pin className="size-4 mt-0.5 shrink-0" style={{ color: '#F97316' }} />
        <div>
          <p className="text-[12px] font-semibold text-white">How to manage feeds</p>
          <p className="mt-0.5 text-[11px]" style={{ color: '#6B7280' }}>
            Go to <strong className="text-white">Products</strong> → click the <strong className="text-white">⋮ Feed</strong> button on any product row → select categories. 
            Or go to <strong className="text-white">Orders</strong> → expand an order → click ⋮ on any item to pin it. Pinned products appear first in the storefront popup carousel. Auto products fill the remaining slots.
          </p>
        </div>
      </div>

      {/* Category panels */}
      {loading ? (
        <div
          className="flex items-center justify-center gap-3 rounded-2xl py-20"
          style={{ background: GLASS.surface, backdropFilter: GLASS.filter, border: `1px solid ${GLASS.border}` }}
        >
          <Loader2 className="size-5 animate-spin" style={{ color: '#F97316' }} />
          <span className="text-[13px]" style={{ color: '#4B5563' }}>Loading feeds…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {SHOP_CATEGORY_DEFS.map(def => (
            <ShopCategoryPanel
              key={def.key}
              def={def}
              catDoc={shopDocs[def.key]}
              allProducts={allProducts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
