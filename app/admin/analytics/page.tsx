'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { adminPortalDb, adminPortalAuth } from '@/lib/firebase-admin-client'
import { TrendingUp, ShoppingCart, Package, Users, Trash2 } from 'lucide-react'
import type { Order } from '@/app/lib/order-types'

type AnalyticsOrder = Pick<Order, 'id' | 'ticketNumber' | 'grandTotal' | 'status' | 'createdAt'>

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<AnalyticsOrder[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Real-time products from adminPortalDb (admin auth context, no pagination cap)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(adminPortalDb, 'products'),
      snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  // Orders: fetched via Admin SDK API route (bypasses Firestore security rules)
  const fetchOrders = useCallback(async () => {
    try {
      const currentUser = adminPortalAuth.currentUser
      if (!currentUser) return
      const token = await currentUser.getIdToken()
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const { orders: data } = await res.json()
      setOrders((data ?? []) as AnalyticsOrder[])
    } catch {}
  }, [])

  useEffect(() => {
    fetchOrders()
    const id = setInterval(fetchOrders, 30_000)
    return () => clearInterval(id)
  }, [fetchOrders])

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) return
    
    // Optimistic update
    setOrders(prev => prev.filter(o => o.id !== orderId))
    
    try {
      const currentUser = adminPortalAuth.currentUser
      if (!currentUser) return
      const token = await currentUser.getIdToken()
      
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        throw new Error('Failed to delete')
      }
    } catch (err) {
      console.error(err)
      fetchOrders() // Revert if failed
    }
  }

  const revenue = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + (o.grandTotal || 0), 0)
  const pending = orders.filter(o => o.status !== 'Completed').length
  const delivered = orders.filter(o => o.status === 'Completed').length
  const inStock = products.filter(p => p.stock === 'In Stock').length

  const stats = [
    { label: 'Total Revenue', value: `€${revenue.toFixed(2)}`, sub: 'From completed orders', icon: TrendingUp, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Orders Completed', value: String(delivered), sub: 'Finished successfully', icon: ShoppingCart, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { label: 'Pending Orders', value: String(pending), sub: 'Processing + dispatched', icon: Package, color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { label: 'Products In Stock', value: String(inStock), sub: `Of ${products.length} total`, icon: Users, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
  ]

  // Monthly Volume Calculation based on MMYY in ticketNumber (ORDDDMMYY-XXXX)
  const monthlyVolumes = orders.reduce((acc, o) => {
    if (!o.ticketNumber) return acc
    const match = o.ticketNumber.match(/^ORD\d{2}(\d{4})-\d{4}$/)
    if (match) {
      const mmyy = match[1]
      acc[mmyy] = (acc[mmyy] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const sortedMonths = Object.keys(monthlyVolumes).sort((a, b) => {
    // Sort MMYY descending
    const ayy = a.slice(2, 4)
    const amm = a.slice(0, 2)
    const byy = b.slice(2, 4)
    const bmm = b.slice(0, 2)
    return byy === ayy ? parseInt(bmm) - parseInt(amm) : parseInt(byy) - parseInt(ayy)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Analytics & Business Intelligence</h2>
        <p className="mt-0.5 text-sm text-slate-400">Live metrics from your Firestore database</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
              <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</p>
                <Icon className="size-4 opacity-60" />
              </div>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <div className="rounded-2xl border border-white/5 bg-slate-900 p-6">
          <h3 className="text-sm font-bold text-white mb-4">Order Status Breakdown</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet — start promoting your storefront!</p>
          ) : (
            <div className="space-y-3">
              {['Paid/Processing', 'Dispatched', 'Completed'].map(status => {
                const count = orders.filter(o => o.status === status).length
                const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
                const colors: Record<string, string> = {
                  'Paid/Processing': 'bg-orange-500',
                  'Dispatched': 'bg-blue-500',
                  'Completed': 'bg-emerald-500',
                }
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300">{status}</span>
                      <span className="font-semibold text-white">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Monthly Volume */}
        <div className="rounded-2xl border border-white/5 bg-slate-900 p-6">
          <h3 className="text-sm font-bold text-white mb-4">Monthly Volume</h3>
          {sortedMonths.length === 0 ? (
            <p className="text-sm text-slate-500">No monthly data available yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedMonths.map(mmyy => {
                const count = monthlyVolumes[mmyy]
                const monthName = new Date(`20${mmyy.slice(2, 4)}-${mmyy.slice(0, 2)}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })
                
                return (
                  <div key={mmyy} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 border border-orange-500/30">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{monthName}</p>
                        <p className="text-[10px] text-slate-400">Prefix: **{mmyy}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-emerald-400">
                      {count} <span className="text-xs font-normal text-slate-500">orders</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Master Order List */}
      <div className="rounded-2xl border border-white/5 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Master Order List</h3>
          <span className="text-xs text-slate-500">{orders.length} orders total</span>
        </div>
        
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No orders found in the database.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order Number</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map(order => {
                  let dateStr = '—'
                  if (order.createdAt) {
                    if (typeof (order.createdAt as any).toDate === 'function') {
                      dateStr = (order.createdAt as any).toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    } else if (typeof order.createdAt === 'string') {
                      dateStr = new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    } else if (typeof order.createdAt === 'object' && '_seconds' in order.createdAt) {
                      dateStr = new Date((order.createdAt as any)._seconds * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    }
                  }

                  const statusColor = 
                    order.status === 'Completed' || order.status === 'Delivered' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                    order.status === 'Paid/Processing' || order.status === 'Accepted' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                    order.status === 'Dispatched' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
                    'text-amber-400 bg-amber-400/10 border-amber-400/20'

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white">
                        {order.ticketNumber || order.id.slice(0, 14)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        €{(order.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Delete Order"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
