'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { adminPortalDb, adminPortalAuth } from '@/lib/firebase-admin-client'
import { updateOrderStatus } from '@/lib/admin-actions'
import {
  Package, Truck, CheckCircle, Clock, Search, ChevronDown,
  ChevronUp, MapPin, Phone, Mail, ShoppingBag, ArrowRight,
  CreditCard, User, MoreVertical, Pin, PinOff, Loader2,
  Check, X, Flame, Star, Sparkles, Tag,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Order } from '@/app/lib/order-types'
import { Button } from '@/components/ui/button'
import {
  useCollectionDocs,
  type FeaturedCollectionDoc,
} from '@/lib/use-featured-collections'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUSES = ['Pending Payment', 'Accepted', 'Preparing', 'Dispatched', 'Delivered'] as const
type Status = typeof STATUSES[number]

const STATUS_CONFIG: Record<Status, { icon: any; pill: string; label: string; next?: Status }> = {
  'Pending Payment': { icon: Clock,       pill: 'text-amber-400 bg-amber-400/10 border-amber-400/30',      label: 'Pending Payment', next: 'Accepted' },
  'Accepted':        { icon: CheckCircle, pill: 'text-blue-400 bg-blue-400/10 border-blue-400/30',         label: 'Accepted',        next: 'Preparing' },
  'Preparing':       { icon: Package,     pill: 'text-purple-400 bg-purple-400/10 border-purple-400/30',   label: 'Preparing',       next: 'Dispatched' },
  'Dispatched':      { icon: Truck,       pill: 'text-orange-400 bg-orange-400/10 border-orange-400/30',   label: 'Dispatched',      next: 'Delivered' },
  'Delivered':       { icon: CheckCircle, pill: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', label: 'Delivered' },
}

const NEXT_LABEL: Partial<Record<Status, string>> = {
  'Pending Payment': 'Accept Order',
  'Accepted':        'Mark Preparing',
  'Preparing':       'Mark Dispatched',
  'Dispatched':      'Mark Delivered',
}

// ─── Category assignment popover ──────────────────────────────────────────────
function CategoryPopover({
  productId,
  productName,
  onClose,
  shopDocs,
  togglePin,
}: {
  productId: string
  productName: string
  onClose: () => void
  shopDocs: FeaturedCollectionDoc[]
  togglePin: (collectionId: string, productId: string) => Promise<void>
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [localState, setLocalState] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {}
    shopDocs.forEach(d => { s[d.id] = (d.productIds || []).includes(productId) })
    return s
  })
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  async function handleToggle(key: string) {
    setSaving(key)
    // Optimistic update
    setLocalState(prev => ({ ...prev, [key]: !prev[key] }))
    await togglePin(key, productId)
    setSaving(null)
  }

  const anyPinned = Object.values(localState).some(Boolean)

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: '240px',
        background: 'rgba(15, 23, 42, 0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Assign to Category</p>
            <p className="mt-0.5 text-[12px] font-semibold text-white truncate">{productName}</p>
          </div>
          <button onClick={onClose} className="shrink-0 size-5 flex items-center justify-center rounded-md" style={{ color: '#4B5563' }}>
            <X className="size-3.5" />
          </button>
        </div>
        {anyPinned && (
          <div
            className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1"
            style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}
          >
            <Pin className="size-3 shrink-0" style={{ color: '#F97316' }} />
            <p className="text-[10px] font-semibold" style={{ color: '#F97316' }}>
              Pinned — product appears in selected feeds
            </p>
          </div>
        )}
      </div>

      {/* Category list */}
      <div className="p-2 space-y-1">
        {shopDocs.map(def => {
          const pinned = localState[def.id]
          const isLoading = saving === def.id
          const color = def.color || '#F97316'

          return (
            <button
              key={def.id}
              onClick={() => handleToggle(def.id)}
              disabled={!!saving}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all disabled:opacity-70"
              style={{
                background: pinned ? `${color}12` : 'rgba(255,255,255,0.03)',
                border: pinned ? `1px solid ${color}30` : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!pinned) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={e => {
                if (!pinned) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
            >
              {/* Emoji / icon */}
              <span className="text-base">{def.emoji || '📦'}</span>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white">{def.title}</p>
                <p className="text-[10px] truncate" style={{ color: '#4B5563' }}>
                  {def.productIds?.length || 0} pinned
                </p>
              </div>

              {/* Checkbox / spinner */}
              {isLoading ? (
                <Loader2 className="size-4 animate-spin shrink-0" style={{ color }} />
              ) : (
                <div
                  className="shrink-0 flex size-5 items-center justify-center rounded-md transition-all"
                  style={{
                    background: pinned ? `${color}25` : 'rgba(255,255,255,0.06)',
                    border: pinned ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.12)',
                  }}
                >
                  {pinned && <Check className="size-3" style={{ color }} />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px]" style={{ color: '#374151' }}>
          Pinned products appear first in the storefront category popup. Changes are live instantly.
        </p>
      </div>
    </div>
  )
}

// ─── 3-dot menu button for an order item ─────────────────────────────────────
function ItemCategoryButton({
  productId,
  productName,
  shopDocs,
  togglePin,
}: {
  productId: string
  productName: string
  shopDocs: FeaturedCollectionDoc[]
  togglePin: (collectionId: string, productId: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  // Count how many categories this product is pinned to
  const pinCount = shopDocs.filter(d =>
    (d.productIds || []).includes(productId)
  ).length

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="flex size-7 items-center justify-center rounded-lg transition-all"
        style={{
          background: pinCount > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
          border: pinCount > 0 ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: pinCount > 0 ? '#F97316' : '#4B5563',
        }}
        title={pinCount > 0 ? `Pinned to ${pinCount} categor${pinCount === 1 ? 'y' : 'ies'}` : 'Assign to category feed'}
      >
        {pinCount > 0 ? <Pin className="size-3.5" /> : <MoreVertical className="size-3.5" />}
      </button>

      {open && (
        <CategoryPopover
          productId={productId}
          productName={productName}
          onClose={() => setOpen(false)}
          shopDocs={shopDocs}
          togglePin={togglePin}
        />
      )}
    </div>
  )
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  onStatus,
  shopDocs,
  togglePin,
}: {
  order: Order
  onStatus: (id: string, s: string, dpd?: string) => void
  shopDocs: FeaturedCollectionDoc[]
  togglePin: (collectionId: string, productId: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dpdId, setDpdId] = useState(order.dpdParcelNumber || '')
  const cfg = STATUS_CONFIG[order.status as Status] ?? STATUS_CONFIG['Pending Payment']
  const Icon = cfg.icon
  const nextStatus = cfg.next

  let date = '—'
  if (order.createdAt) {
    if (typeof (order.createdAt as any).toDate === 'function') {
      date = (order.createdAt as any).toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } else if (typeof order.createdAt === 'string') {
      date = new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  async function advance() {
    if (!nextStatus) return
    setLoading(true)
    await onStatus(order.id, nextStatus, dpdId)
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900 overflow-hidden transition-all">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${cfg.pill}`}>
          <Icon className="size-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{order.customerName || 'Guest'}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.pill}`}>
              <Icon className="size-2.5" />{cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-mono">{order.ticketNumber || order.id.slice(0, 14)}</span>
            <span className="text-[11px] text-slate-500">{date}</span>
            <span className="text-[11px] text-slate-400 font-semibold">€{Number(order.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {nextStatus && (
            <Button onClick={advance} disabled={loading} variant="default" size="sm" className="rounded-xl gap-1.5">
              {loading
                ? <span className="size-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : <ArrowRight className="size-3" />
              }
              <span className="hidden sm:inline">{NEXT_LABEL[order.status as Status]}</span>
            </Button>
          )}
          <Button onClick={() => setOpen(v => !v)} variant="glass-dark" size="icon" className="rounded-xl">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-5">
          {/* Customer + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</p>
                {order.customerEmail && (
                  <Link
                    href={`/admin/customers?search=${encodeURIComponent(order.customerEmail)}`}
                    className="flex items-center gap-1 text-[10px] font-bold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-1.5 py-0.5 rounded transition-all"
                  >
                    <User className="size-3" /> View Profile
                  </Link>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail className="size-3.5 text-slate-500 shrink-0" />
                  {order.customerEmail || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone className="size-3.5 text-slate-500 shrink-0" />
                  {order.customerPhone || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="size-3.5 text-slate-500 shrink-0" />
                  {order.transitHub || '—'}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment</p>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CreditCard className="size-3.5 text-slate-500 shrink-0" />
                {order.paymentMethod || 'Bank Transfer'}
                {' — '}
                <span className={order.paymentStatus === 'paid' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {order.paymentStatus || 'pending'}
                </span>
              </div>
              {order.orderNotes && (
                <div className="mt-2 rounded-lg border border-white/5 bg-white/3 px-3 py-2 text-xs text-slate-400 italic">
                  &ldquo;{order.orderNotes}&rdquo;
                </div>
              )}
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Truck className="size-3" /> Shipping (DPD)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={dpdId}
                    onChange={e => setDpdId(e.target.value)}
                    placeholder="DPD Parcel Number"
                    className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-full outline-none focus:border-orange-500"
                  />
                  <Button
                    size="sm"
                    variant="glass-light"
                    disabled={loading || dpdId === (order.dpdParcelNumber || '')}
                    onClick={async () => { setLoading(true); await onStatus(order.id, order.status, dpdId); setLoading(false) }}
                    className="h-[34px]"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Items table with 3-dot category buttons */}
          {order.items && order.items.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Items ({order.items.length})
                </p>
                <div
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                  style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}
                >
                  <Pin className="size-3" style={{ color: '#F97316' }} />
                  <p className="text-[10px] font-semibold" style={{ color: '#F97316' }}>
                    Click ⋮ on any item to pin it to category feeds
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-2 text-left text-slate-500 font-semibold">Product</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-semibold">Qty</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-semibold">Price</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-semibold">Total</th>
                      <th className="px-4 py-2 text-center text-slate-500 font-semibold" title="Assign to category feed">Feed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items.map((item, i) => {
                      // Count how many categories this product is pinned to (for indicator)
                      const pinCount = item.productId
                        ? shopDocs.filter(d =>
                            (d.productIds || []).includes(item.productId)
                          ).length
                        : 0

                      return (
                        <tr key={i} className={pinCount > 0 ? 'bg-orange-500/3' : ''}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-300">
                                {item.productName}
                                {item.variantLabel && <span className="text-slate-500 ml-1">({item.variantLabel})</span>}
                              </span>
                              {/* Pin indicators — show which categories this product is in */}
                              {pinCount > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {shopDocs.filter(d =>
                                    (d.productIds || []).includes(item.productId)
                                  ).map(d => {
                                    const color = d.color || '#F97316'
                                    return (
                                      <span
                                        key={d.id}
                                        className="text-[8px] rounded-full px-1.5 py-0.5 font-bold"
                                        style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
                                      >
                                        {d.emoji || '📦'}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-400">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400">€{item.price.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-white">€{item.lineTotal.toFixed(2)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex justify-center">
                              {item.productId ? (
                                <ItemCategoryButton
                                  productId={item.productId}
                                  productName={item.productName}
                                  shopDocs={shopDocs}
                                  togglePin={togglePin}
                                />
                              ) : (
                                <span className="text-slate-700 text-[10px]">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="bg-white/3">
                      <td colSpan={3} className="px-4 py-2.5 text-right text-slate-400 font-bold">Grand Total</td>
                      <td className="px-4 py-2.5 text-right font-bold text-orange-400">€{Number(order.grandTotal || 0).toFixed(2)}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <ShoppingBag className="size-4" />
              {order.itemsSummary || 'No item details stored'}
            </div>
          )}

          {/* Status pipeline */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Pipeline</p>
            <div className="flex items-center gap-1 flex-wrap">
              {STATUSES.map((s, i) => {
                const isCurrent = order.status === s
                const isPast    = STATUSES.indexOf(order.status as Status) > i
                const scfg      = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    disabled={loading || s === order.status}
                    onClick={async () => { setLoading(true); await onStatus(order.id, s, dpdId); setLoading(false) }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-default
                      ${isCurrent ? scfg.pill + ' ring-2 ring-offset-1 ring-offset-slate-900 ring-current/30 scale-105' : ''}
                      ${isPast ? 'border-white/5 text-slate-600 bg-transparent' : ''}
                      ${!isCurrent && !isPast ? 'border-white/10 text-slate-500 bg-white/3 hover:bg-white/8 hover:text-white' : ''}
                    `}
                  >
                    <scfg.icon className="size-3" />
                    {scfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────
import { Suspense } from 'react'

function AdminOrdersContent() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  // Shop categories hook (for real-time pin state)
  const { docs: shopDocs, togglePin } = useCollectionDocs()

  const fetchOrders = useCallback(async () => {
    try {
      const currentUser = adminPortalAuth.currentUser
      if (!currentUser) return
      const token = await currentUser.getIdToken()
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { orders: data } = await res.json()
      setOrders((data ?? []) as Order[])
    } catch (err) {
      console.error('[AdminOrdersPage] Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const id = setInterval(fetchOrders, 30_000)
    return () => clearInterval(id)
  }, [fetchOrders])

  async function handleStatus(id: string, status: string, dpd?: string) {
    await updateOrderStatus(id, status, dpd)
    setTimeout(fetchOrders, 500)
  }

  const filtered = orders.filter(o => {
    const matchFilter   = filter === 'all' || o.status === filter
    const searchLower   = search.toLowerCase()
    const matchSearch   = !search
      || (o.ticketNumber || '').toLowerCase().includes(searchLower)
      || (o.customerEmail || '').toLowerCase().includes(searchLower)
      || (o.customerName || '').toLowerCase().includes(searchLower)
      || (o.customerPhone || '').toLowerCase().includes(searchLower)
    return matchFilter && matchSearch
  })

  const counts: Record<string, number> = {
    all: orders.length,
    ...Object.fromEntries(STATUSES.map(s => [s, orders.filter(o => o.status === s).length])),
  }

  // Count total pinned items across all orders currently visible
  const totalPinned = (shopDocs || []).reduce((sum, d) => sum + (d.productIds?.length ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Order Management</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {orders.length} total orders — click any card to expand and update status
          </p>
        </div>
        <div className="flex items-start gap-4">
          {totalPinned > 0 && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              <Pin className="size-3.5" style={{ color: '#F97316' }} />
              <span className="text-[12px] font-semibold" style={{ color: '#F97316' }}>
                {totalPinned} products pinned to feeds
              </span>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-slate-500">Revenue (Delivered)</p>
            <p className="text-xl font-bold text-emerald-400">
              €{orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.grandTotal || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
          {[{ key: 'all', label: 'All', count: counts.all },
            ...STATUSES.map(s => ({ key: s, label: STATUS_CONFIG[s as Status].label, count: counts[s] }))
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === tab.key ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 flex-1 sm:max-w-sm">
          <Search className="size-4 shrink-0 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, ticket..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Hint for the 3-dot menu */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-2.5"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}
      >
        <MoreVertical className="size-4 shrink-0" style={{ color: '#60A5FA' }} />
        <p className="text-[12px]" style={{ color: '#93C5FD' }}>
          <strong>New:</strong> Expand any order and click the <strong>⋮ Feed</strong> button on an item to instantly pin that product to storefront category feeds (Top Picks, Bestsellers, etc.). Changes go live immediately.
        </p>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900 p-12 text-center">
          <Package className="mx-auto mb-3 size-10 text-slate-600" />
          <p className="text-sm text-slate-500">
            {orders.length === 0
              ? 'No orders yet. Share your storefront link to start receiving orders!'
              : 'No orders match your current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatus={handleStatus}
              shopDocs={shopDocs || []}
              togglePin={togglePin}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading orders...</div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}
