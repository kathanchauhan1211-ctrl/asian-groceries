'use client'

import { useState, useEffect } from 'react'
import { adminPortalDb } from '@/lib/firebase-admin-client'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { Truck, Bus, Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Order = any // Using any for brevity, since we only need a few fields

export default function AdminTrackPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dpd' | 'bus' | 'pickup'>('bus')

  useEffect(() => {
    const q = query(collection(adminPortalDb, 'tracking'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, console.error)
    return () => unsub()
  }, [])

  const dpdOrders = orders.filter(o => o.deliveryMethod === 'dpd' || !o.deliveryMethod)
  const busOrders = orders.filter(o => o.deliveryMethod === 'bus')
  const pickupOrders = orders.filter(o => o.deliveryMethod === 'pickup')

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(adminPortalDb, 'tracking', orderId), { 
        status: newStatus,
        events: arrayUnion({
          status: newStatus,
          timestamp: new Date()
        })
      })
      await updateDoc(doc(adminPortalDb, 'orders', orderId), { status: newStatus })
    } catch (e) {
      console.error('Failed to update status', e)
      alert('Failed to update status')
    }
  }

  if (loading) return <div className="p-8 text-white">Loading tracking data...</div>

  return (
    <div className="p-4 md:p-8 space-y-6 text-white max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Truck className="size-6 text-orange-400" /> Delivery Tracking Management
      </h1>
      
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dpd')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'dpd' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Truck className="size-4" /> DPD Courier ({dpdOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('bus')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'bus' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Bus className="size-4" /> Bus Terminal ({busOrders.length})
        </button>
        <button 
          onClick={() => setActiveTab('pickup')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'pickup' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Building2 className="size-4" /> Store Pickup ({pickupOrders.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'dpd' && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <strong>DPD Orders:</strong> These orders are tracked automatically via the DPD Interconnector API once you assign a DPD tracking number from the <a href="/admin/orders" className="underline font-bold">Orders</a> page.
            </div>
          </div>
        )}

        {activeTab === 'bus' && (
          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-300 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <strong>Bus Tracking:</strong> Update the status manually below. The customer will see this status in their dashboard and track page.
            </div>
          </div>
        )}

        {activeTab === 'pickup' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <strong>Store Pickup:</strong> Update the status manually below when the order is ready for pickup or has been collected.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(activeTab === 'dpd' ? dpdOrders : activeTab === 'bus' ? busOrders : pickupOrders).map(order => (
            <div key={order.id} className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-mono font-bold text-lg text-white">{order.ticketNumber}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-white/10 text-white/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {order.status || 'Pending'}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-slate-300 space-y-1 mb-4 flex-1">
                <p><strong>Method:</strong> {order.deliveryMethod?.toUpperCase() || 'DPD'}</p>
                {order.deliveryMethod === 'bus' && <p><strong>Terminal:</strong> {order.transitHub}</p>}
                {order.deliveryMethod === 'dpd' && <p><strong>Address:</strong> {order.deliveryAddress}</p>}
                {order.dpdParcelNumber && <p><strong>DPD No:</strong> {order.dpdParcelNumber}</p>}
              </div>

              {activeTab === 'bus' && (
                <div className="mt-auto space-y-2 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Preparing', 'Dispatched to Station', 'In Transit', 'Arrived at Destination'].map(s => (
                      <Button key={s} size="sm" variant={order.status === s ? 'orange' : 'glass-dark'} onClick={() => updateStatus(order.id, s)} className="text-[10px] px-2 h-7">
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'pickup' && (
                <div className="mt-auto space-y-2 pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Preparing', 'Ready for Pickup', 'Picked Up'].map(s => (
                      <Button key={s} size="sm" variant={order.status === s ? 'emerald' : 'glass-dark'} onClick={() => updateStatus(order.id, s)} className="text-[10px] px-2 h-7">
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'dpd' && (
                <div className="mt-auto pt-3 border-t border-white/10">
                  <Button variant="glass-dark" size="sm" className="w-full text-xs" asChild>
                    <a href="/admin/orders">Manage in Orders Page</a>
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {(activeTab === 'dpd' ? dpdOrders : activeTab === 'bus' ? busOrders : pickupOrders).length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/10 border-dashed">
              No orders found for this delivery method.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
