'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useProducts } from '@/lib/use-products'
import { TrendingUp, Package, AlertTriangle, ShoppingCart, Users, ArrowUpRight, Clock } from 'lucide-react'
import { updateOrderStatus } from '@/lib/admin-actions'

type Order = {
  id: string
  customerEmail: string
  customerName: string
  amountTotal: number
  status: string
  createdAt: any
  itemsSummary: string
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 bg-slate-900 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${color.replace('border-', 'bg-').replace('/20', '/10')}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { products, loading: productsLoading } = useProducts()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(clientDb, 'orders'), orderBy('createdAt', 'desc'), limit(10))
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[])
      setOrdersLoading(false)
    }, () => setOrdersLoading(false))
    return () => unsub()
  }, [])

  const totalTurnover = orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.amountTotal || 0), 0)
  const activeOrders = orders.filter(o => o.status !== 'Delivered').length
  const lowStockCount = products.filter(p => p.stock === 'Low Stock' || p.stock === 'Sold Out').length
  const totalProducts = products.length

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id)
    await updateOrderStatus(id, status)
    setUpdating(null)
  }

  const statusColor = (s: string) => {
    if (s === 'Delivered') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    if (s === 'Dispatched') return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Turnover" value={`€${totalTurnover.toFixed(2)}`} sub="Delivered orders only" icon={TrendingUp} color="border-emerald-500/20 text-emerald-400" />
        <StatCard label="Active Orders" value={String(activeOrders)} sub="Processing + dispatched" icon={ShoppingCart} color="border-blue-500/20 text-blue-400" />
        <StatCard label="Products" value={String(totalProducts)} sub={`${lowStockCount} low/out of stock`} icon={Package} color="border-orange-500/20 text-orange-400" />
        <StatCard label="Stock Alerts" value={String(lowStockCount)} sub="Needs attention" icon={AlertTriangle} color="border-red-500/20 text-red-400" />
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-white/5 bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Recent Orders</h3>
          </div>
          <a href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
            View all <ArrowUpRight className="size-3" />
          </a>
        </div>

        {ordersLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No orders yet. Share your store link to start getting orders!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Order</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-3 font-mono text-[11px] text-slate-500">{order.id.slice(0, 12)}…</td>
                  <td className="px-6 py-3 text-slate-300">{order.customerEmail || 'Guest'}</td>
                  <td className="px-6 py-3 font-semibold text-white">€{Number(order.amountTotal || 0).toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <select disabled={updating === order.id} value={order.status}
                      onChange={e => handleStatus(order.id, e.target.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50 bg-transparent ${statusColor(order.status)}`}>
                      <option value="Paid - Processing">Processing</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Low Stock Alerts */}
      {lowStockCount > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-red-400" />
            <h3 className="text-sm font-bold text-red-400">Low Stock Alerts ({lowStockCount} items)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {products.filter(p => p.stock === 'Low Stock' || p.stock === 'Sold Out').map(p => (
              <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                <span className={`size-1.5 rounded-full ${p.stock === 'Sold Out' ? 'bg-red-500' : 'bg-amber-400'}`} />
                {p.name} — {p.stock}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
