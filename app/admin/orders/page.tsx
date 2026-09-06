'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { updateOrderStatus } from '@/lib/admin-actions'
import {
  Package, Truck, CheckCircle, Clock, Search, ChevronDown,
  ChevronUp, MapPin, Phone, Mail, ShoppingBag, ArrowRight,
  CreditCard,
} from 'lucide-react'
import type { Order } from '@/app/lib/order-types'

const STATUSES = ['Pending Payment', 'Accepted', 'Preparing', 'Dispatched', 'Delivered'] as const

type Status = typeof STATUSES[number]

const STATUS_CONFIG: Record<Status, { icon: any; pill: string; label: string; next?: Status }> = {
  'Pending Payment': { icon: Clock,       pill: 'text-amber-400 bg-amber-400/10 border-amber-400/30',   label: 'Pending Payment', next: 'Accepted' },
  'Accepted':        { icon: CheckCircle, pill: 'text-blue-400 bg-blue-400/10 border-blue-400/30',     label: 'Accepted',        next: 'Preparing' },
  'Preparing':       { icon: Package,     pill: 'text-purple-400 bg-purple-400/10 border-purple-400/30', label: 'Preparing',     next: 'Dispatched' },
  'Dispatched':      { icon: Truck,       pill: 'text-orange-400 bg-orange-400/10 border-orange-400/30', label: 'Dispatched',    next: 'Delivered' },
  'Delivered':       { icon: CheckCircle, pill: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', label: 'Delivered' },
}

const NEXT_LABEL: Partial<Record<Status, string>> = {
  'Pending Payment': 'Accept Order',
  'Accepted':        'Mark Preparing',
  'Preparing':       'Mark Dispatched',
  'Dispatched':      'Mark Delivered',
}

const NEXT_COLOR: Partial<Record<Status, string>> = {
  'Pending Payment': 'bg-blue-500 hover:bg-blue-400',
  'Accepted':        'bg-purple-500 hover:bg-purple-400',
  'Preparing':       'bg-orange-500 hover:bg-orange-400',
  'Dispatched':      'bg-emerald-500 hover:bg-emerald-400',
}

function OrderCard({ order, onStatus }: { order: Order; onStatus: (id: string, s: string) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg = STATUS_CONFIG[order.status as Status] ?? STATUS_CONFIG['Pending Payment']
  const Icon = cfg.icon
  const nextStatus = cfg.next
  const date = order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  async function advance() {
    if (!nextStatus) return
    setLoading(true)
    await onStatus(order.id, nextStatus)
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900 overflow-hidden transition-all">
      {/* Card header — always visible */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Status icon */}
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${cfg.pill}`}>
          <Icon className="size-5" />
        </div>

        {/* Customer + order info */}
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

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {nextStatus && (
            <button
              onClick={advance}
              disabled={loading}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white transition-all disabled:opacity-50 ${NEXT_COLOR[order.status as Status]}`}
            >
              {loading ? (
                <span className="size-3 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="size-3" />
              )}
              <span className="hidden sm:inline">{NEXT_LABEL[order.status as Status]}</span>
            </button>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 transition-all"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expandable detail panel */}
      {open && (
        <div className="border-t border-white/5 px-5 py-4 space-y-5">
          {/* Customer details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</p>
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
            </div>
          </div>

          {/* Items */}
          {order.items && order.items.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Items ({order.items.length})</p>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-2 text-left text-slate-500 font-semibold">Product</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-semibold">Qty</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-semibold">Price</th>
                      <th className="px-4 py-2 text-right text-slate-500 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-slate-300">
                          {item.productName}
                          {item.variantLabel && <span className="text-slate-500 ml-1">({item.variantLabel})</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">€{item.price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-white">€{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-white/3">
                      <td colSpan={3} className="px-4 py-2.5 text-right text-slate-400 font-bold">Grand Total</td>
                      <td className="px-4 py-2.5 text-right font-bold text-orange-400">€{Number(order.grandTotal || 0).toFixed(2)}</td>
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

          {/* Status pipeline buttons */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Pipeline</p>
            <div className="flex items-center gap-1 flex-wrap">
              {STATUSES.map((s, i) => {
                const isCurrent = order.status === s
                const isPast = STATUSES.indexOf(order.status as Status) > i
                const scfg = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    disabled={loading || s === order.status}
                    onClick={async () => { setLoading(true); await onStatus(order.id, s); setLoading(false) }}
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const q = query(collection(clientDb, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[])
        setLoading(false)
      },
      (err) => {
        console.error('Orders snapshot error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  async function handleStatus(id: string, status: string) {
    await updateOrderStatus(id, status)
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const searchLower = search.toLowerCase()
    const matchSearch = !search
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Order Management</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {orders.length} total orders — click any card to expand and update status
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Revenue (Delivered)</p>
          <p className="text-xl font-bold text-emerald-400">
            €{orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.grandTotal || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
          {[{ key: 'all', label: 'All', count: counts.all },
            ...STATUSES.map(s => ({ key: s, label: STATUS_CONFIG[s as Status].label, count: counts[s] }))
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
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

      {/* Order cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
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
            <OrderCard key={order.id} order={order} onStatus={handleStatus} />
          ))}
        </div>
      )}
    </div>
  )
}
