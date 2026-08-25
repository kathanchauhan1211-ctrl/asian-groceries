'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { updateOrderStatus } from '@/lib/admin-actions'
import { Package, Truck, CheckCircle, Clock, Search } from 'lucide-react'

type Order = {
  id: string
  customerEmail: string
  customerName: string
  amountTotal: number
  paymentStatus: string
  status: string
  itemsSummary: string
  orderNotes: string
  createdAt: any
}

const STATUSES = ['Paid - Processing', 'Dispatched', 'Delivered']

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'Paid - Processing': { icon: Clock, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', label: 'Processing' },
  'Dispatched': { icon: Truck, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Dispatched' },
  'Delivered': { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Delivered' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const q = query(collection(clientDb, 'orders'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[])
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id)
    await updateOrderStatus(id, status)
    setUpdating(null)
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || (o.customerEmail || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    all: orders.length,
    'Paid - Processing': orders.filter(o => o.status === 'Paid - Processing').length,
    'Dispatched': orders.filter(o => o.status === 'Dispatched').length,
    'Delivered': orders.filter(o => o.status === 'Delivered').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Order Management</h2>
        <p className="mt-0.5 text-sm text-slate-400">Changing status updates customer tracking in real-time</p>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
          {[{ key: 'all', label: 'All', count: counts.all }, ...STATUSES.map(s => ({ key: s, label: STATUS_CONFIG[s].label, count: counts[s as keyof typeof counts] }))].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filter === tab.key ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 flex-1 sm:max-w-xs">
          <Search className="size-4 shrink-0 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID or email..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
        </div>
      </div>

      {/* Orders table */}
      <div className="rounded-2xl border border-white/5 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto mb-3 size-8 text-slate-600" />
            <p className="text-sm text-slate-500">{orders.length === 0 ? 'No orders yet. Share your storefront to start selling!' : 'No orders match your filter.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Order ID', 'Customer', 'Amount', 'Items', 'Status', 'Update'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['Paid - Processing']
                const Icon = cfg.icon
                return (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{order.id.slice(0, 14)}…</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{order.customerName || 'Guest'}</p>
                      <p className="text-[11px] text-slate-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">€{Number(order.amountTotal || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-xs text-slate-400 max-w-[160px]">
                      <p className="truncate">{order.itemsSummary || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                        <Icon className="size-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select disabled={updating === order.id} value={order.status}
                        onChange={e => handleStatus(order.id, e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-orange-500/50 cursor-pointer disabled:opacity-50">
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
