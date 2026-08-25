'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useProducts } from '@/lib/use-products'
import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react'

type Order = { id: string; amountTotal: number; status: string; createdAt: any }

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const { products } = useProducts()

  useEffect(() => {
    const unsub = onSnapshot(collection(clientDb, 'orders'), snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[])
    })
    return () => unsub()
  }, [])

  const revenue = orders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.amountTotal || 0), 0)
  const pending = orders.filter(o => o.status !== 'Delivered').length
  const delivered = orders.filter(o => o.status === 'Delivered').length
  const inStock = products.filter(p => p.stock === 'In Stock').length

  const stats = [
    { label: 'Total Revenue', value: `€${revenue.toFixed(2)}`, sub: 'From delivered orders', icon: TrendingUp, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { label: 'Orders Delivered', value: String(delivered), sub: 'Completed successfully', icon: ShoppingCart, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { label: 'Pending Orders', value: String(pending), sub: 'Processing + dispatched', icon: Package, color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { label: 'Products In Stock', value: String(inStock), sub: `Of ${products.length} total`, icon: Users, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
  ]

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

      {/* Revenue breakdown */}
      <div className="rounded-2xl border border-white/5 bg-slate-900 p-6">
        <h3 className="text-sm font-bold text-white mb-4">Order Status Breakdown</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet — start promoting your storefront!</p>
        ) : (
          <div className="space-y-3">
            {['Paid - Processing', 'Dispatched', 'Delivered'].map(status => {
              const count = orders.filter(o => o.status === status).length
              const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
              const colors: Record<string, string> = {
                'Paid - Processing': 'bg-orange-500',
                'Dispatched': 'bg-blue-500',
                'Delivered': 'bg-emerald-500',
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
    </div>
  )
}
