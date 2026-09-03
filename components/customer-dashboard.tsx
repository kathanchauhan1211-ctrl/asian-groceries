'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { useProducts } from '@/lib/use-products'
import { Button } from '@/components/ui/button'
import {
  User,
  MapPin,
  Clock,
  RefreshCw,
  Award,
  ChevronRight,
  TrendingUp,
  Truck,
  Download
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import Link from 'next/link'

type LiveOrder = {
  id: string
  ticketNum: string // usually same as id
  createdAt: string
  amountTotal: number
  itemsSummary: string
  status: string
}

const TERMINAL_OPTIONS = [
  'Kaunas Bus Station - Via Autobusų Stotis Courier',
  'Vilnius Central Station - Via Autobusų Stotis Courier',
  'Klaipėda Bus Station - Via Autobusų Stotis Courier',
  'Šiauliai Bus Station - Via Autobusų Stotis Courier',
]

export function CustomerDashboard({ onSelectTab }: { onSelectTab: (tab: string) => void }) {
  const { addItem } = useCart()
  const { products: liveProducts } = useProducts()
  const { user } = useAuth()
  
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [preferredTerminal, setPreferredTerminal] = useState(TERMINAL_OPTIONS[0])
  const [isEditingTerminal, setIsEditingTerminal] = useState(false)
  const [loading, setLoading] = useState(true)

  // 1. Fetch user terminal preference
  useEffect(() => {
    if (!user) return
    const fetchTerminal = async () => {
      try {
        const userDoc = await getDoc(doc(clientDb, 'users', user.uid))
        if (userDoc.exists() && userDoc.data().preferredTerminal) {
          setPreferredTerminal(userDoc.data().preferredTerminal)
        }
      } catch (err) {
        console.error('Failed to load preferred terminal', err)
      }
    }
    fetchTerminal()
  }, [user])

  // 2. Live orders feed
  useEffect(() => {
    if (!user?.email) return
    const q = query(
      collection(clientDb, 'orders'),
      where('customerEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const liveData = snap.docs.map(d => {
        const data = d.data()
        // Fallback for ticketNum or ID
        const id = d.id
        return {
          id,
          ticketNum: id.slice(0, 8).toUpperCase(),
          createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown',
          amountTotal: data.amountTotal || 0,
          itemsSummary: data.itemsSummary || '',
          status: data.status || 'Processing'
        }
      })
      setOrders(liveData)
      setLoading(false)
    }, (error) => {
      console.error('Firebase orders subscription error:', error)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Save Terminal to Firestore
  const handleSaveTerminal = async (newTerminal: string) => {
    setPreferredTerminal(newTerminal)
    setIsEditingTerminal(false)
    if (user) {
      await setDoc(doc(clientDb, 'users', user.uid), { preferredTerminal: newTerminal }, { merge: true })
    }
  }

  // One-click re-order macro mapping itemsSummary
  const handleReorder = (order: LiveOrder) => {
    if (!order.itemsSummary) return
    
    // itemsSummary is a comma-separated string like "1x INDIAN SELLA..., 2x Everest Spices"
    const items = order.itemsSummary.split(',')
    
    items.forEach((itemStr) => {
      const match = itemStr.trim().match(/^(\d+)x\s+(.+)$/)
      if (match) {
        const qty = parseInt(match[1])
        const namePart = match[2].toLowerCase()
        
        const product = liveProducts.find((p) =>
          p.name.toLowerCase().includes(namePart) || 
          namePart.includes(p.name.toLowerCase())
        )
        if (product) {
          addItem(product, product.variants[0], qty)
        }
      }
    })
    onSelectTab('shop')
  }

  const handleDownloadInvoice = () => {
    window.print()
  }

  // Calculate Tier
  let tier = 'Bronze'
  if (orders.length >= 10) tier = 'Gold'
  else if (orders.length >= 3) tier = 'Silver'
  
  const tierColors = {
    Bronze: 'text-amber-700',
    Silver: 'text-slate-400',
    Gold: 'text-yellow-500'
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Top Banner Dashboard Card */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <User className="size-7" />
            </span>
            <div>
              <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white">Welcome Back, {user.displayName || 'Customer'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500">Tier Status</p>
              <p className={`text-sm font-bold flex items-center gap-1 justify-center ${tierColors[tier as keyof typeof tierColors]}`}>
                <Award className="size-3.5" /> {tier}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Orders</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Saved Transit Terminal Card */}
        <div className="md:col-span-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20 mb-4">
              <MapPin className="size-4.5" />
            </span>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-sans text-sm font-bold text-slate-900 dark:text-white">Preferred Local Terminal</h3>
              <button onClick={() => setIsEditingTerminal(!isEditingTerminal)} className="text-[10px] font-bold uppercase text-accent hover:underline">
                {isEditingTerminal ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Automated drop-off point saved for direct Courier Bus Dispatch.
            </p>
            
            {isEditingTerminal ? (
              <div className="mt-3 space-y-2">
                <select 
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm text-slate-700 dark:text-slate-300 outline-none"
                  value={preferredTerminal}
                  onChange={(e) => setPreferredTerminal(e.target.value)}
                >
                  {TERMINAL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <Button size="sm" onClick={() => handleSaveTerminal(preferredTerminal)} className="w-full bg-accent hover:bg-accent/90 text-white font-semibold">
                  Save Terminal
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {preferredTerminal.split(' - ')[0]}
              </p>
            )}
          </div>
          
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Autobusų Stotis Courier</span>
            <span className="text-emerald-600 dark:text-emerald-500 font-semibold">Synced Active</span>
          </div>
        </div>

        {/* Purchase History Grid */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-sans text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="size-4 text-accent" /> Dispatch Order History
            </h3>
            {!loading && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Found {orders.length} orders</span>}
          </div>

          <div className="space-y-4">
            {loading ? (
               <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading live orders...</div>
            ) : orders.length === 0 ? (
               <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                 No orders found. Head to the shop and make your first purchase!
               </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-4 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Ticket Num
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">AS-{order.ticketNum}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Status
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Date
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{order.createdAt}</span>
                    </div>
                  </div>

                  <div className="py-3">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Items
                    </span>
                    <ul className="space-y-1">
                      {order.itemsSummary ? order.itemsSummary.split(',').map((it, i) => (
                        <li key={i} className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
                          • {it.trim()}
                        </li>
                      )) : <li className="text-xs text-slate-500 dark:text-slate-400">No items available</li>}
                    </ul>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-3 mt-1">
                    <div className="text-xs shrink-0">
                      <span className="text-slate-500 dark:text-slate-400">Amount: </span>
                      <span className="font-bold text-slate-900 dark:text-white">€{order.amountTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadInvoice}
                        className="h-7 text-[10px] px-2 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:text-slate-200"
                      >
                        <Download className="size-3 mr-1" /> Invoice
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-7 text-[10px] px-2 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:text-slate-200"
                      >
                        <Link href={`/track?ticket=${order.id}`}>
                          <Truck className="size-3 mr-1" /> Track
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleReorder(order)}
                        className="h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-[10px] font-semibold text-white px-2 shadow-sm"
                      >
                        <RefreshCw className="size-3 mr-1" /> Reorder
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rewards Progress Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
            <TrendingUp className="size-4.5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Next Delivery Free Voucher</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Collect {Math.max(1, 10 - orders.length)} more ticket dispatches out of Vilnius Station</p>
          </div>
        </div>
        <ChevronRight className="size-4.5 text-slate-400 dark:text-slate-500" />
      </div>
    </div>
  )
}
