'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { PRODUCTS, type Product } from '@/lib/products'
import { Button } from '@/components/ui/button'
import {
  User,
  ShoppingBag,
  MapPin,
  Clock,
  RefreshCw,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

type SavedOrder = {
  ticketNum: string
  date: string
  itemsCount: number
  totalPrice: number
  items: string[]
  transitHub: string
}

export function CustomerDashboard({ onSelectTab }: { onSelectTab: (tab: string) => void }) {
  const { addItem } = useCart()
  const [history, setHistory] = useState<SavedOrder[]>([])
  const [preferredTerminal, setPreferredTerminal] = useState('')

  // Load from localStorage or mock if empty
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('ag_order_history')
      const storedTerminal = localStorage.getItem('ag_saved_terminal')
      
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory))
      } else {
        // Mock default history for first load
        const mockHistory: SavedOrder[] = [
          {
            ticketNum: 'AS-VLN-1942',
            date: '2026-06-28',
            itemsCount: 2,
            totalPrice: 32.41,
            items: ['1x INDIAN SELLA 1121 ALI KHAN BASMATI RICE 5kg', '1x ASHIRVAD ATTA Miltai 5kg'],
            transitHub: 'Kaunas Bus Station - Via Autobusų Stotis Courier',
          },
          {
            ticketNum: 'AS-VLN-0831',
            date: '2026-06-12',
            itemsCount: 3,
            totalPrice: 19.30,
            items: ['2x Everest Tikhalal Spices', '1x Premium Chana Dal'],
            transitHub: 'Kaunas Bus Station - Via Autobusų Stotis Courier',
          },
        ]
        setHistory(mockHistory)
        localStorage.setItem('ag_order_history', JSON.stringify(mockHistory))
      }

      if (storedTerminal) {
        setPreferredTerminal(storedTerminal)
      } else {
        const defaultTerminal = 'Kaunas Bus Station - Via Autobusų Stotis Courier'
        setPreferredTerminal(defaultTerminal)
        localStorage.setItem('ag_saved_terminal', defaultTerminal)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // One-click re-order macro
  const handleReorder = (order: SavedOrder) => {
    // Find matching products in catalog and add them
    order.items.forEach((itemStr) => {
      // parse quantity and product name
      // e.g. "1x INDIAN SELLA..."
      const match = itemStr.match(/^(\d+)x\s+(.+)$/)
      if (match) {
        const qty = parseInt(match[1])
        const namePart = match[2].toLowerCase()
        
        // Find product by name prefix
        const product = PRODUCTS.find((p) =>
          p.name.toLowerCase().includes(namePart) || 
          namePart.includes(p.name.toLowerCase())
        )
        if (product) {
          addItem(product, product.variants[0], qty)
        }
      }
    })
    
    // Switch to shop tab
    onSelectTab('shop')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Top Banner Dashboard Card */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
              <User className="size-7" />
            </span>
            <div>
              <h2 className="font-sans text-xl font-bold text-slate-900">Welcome Back, Customer</h2>
              <p className="text-xs text-slate-500 mt-0.5">Vilnius Autobusų Stotis Terminal Member</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <div className="rounded-lg bg-slate-50 px-4 py-2 border border-slate-200 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500">Tier Status</p>
              <p className="text-sm font-bold text-accent flex items-center gap-1 justify-center">
                <Award className="size-3.5" /> Gold
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-2 border border-slate-200 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500">Total Orders</p>
              <p className="text-sm font-bold text-slate-900">{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Saved Transit Terminal Card */}
        <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/20 mb-4">
              <MapPin className="size-4.5" />
            </span>
            <h3 className="font-sans text-sm font-bold text-slate-900">Preferred Local Terminal</h3>
            <p className="text-xs text-slate-500 mt-1">
              Automated drop-off point saved for direct Courier Bus Dispatch.
            </p>
            <p className="mt-3 text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {preferredTerminal.split(' - ')[0]}
            </p>
          </div>
          
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Autobusų Stotis Courier</span>
            <span className="text-emerald-600 font-semibold">Saved Active</span>
          </div>
        </div>

        {/* Purchase History Grid */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="size-4 text-accent" /> Dispatch Order History
            </h3>
            <span className="text-xs font-semibold text-slate-500">Last {history.length} orders</span>
          </div>

          <div className="space-y-4">
            {history.map((order, idx) => (
              <div
                key={order.ticketNum}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ticket Num
                    </span>
                    <span className="text-xs font-bold text-slate-900">{order.ticketNum}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Date
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{order.date}</span>
                  </div>
                </div>

                <div className="py-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Items
                  </span>
                  <ul className="space-y-1">
                    {order.items.map((it, i) => (
                      <li key={i} className="text-xs text-slate-700 line-clamp-1">
                        • {it}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 mt-1">
                  <div className="text-xs">
                    <span className="text-slate-500">Amount: </span>
                    <span className="font-bold text-slate-900">€{order.totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleReorder(order)}
                    className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white px-3 flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className="size-3" /> One-Click Reorder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rewards Progress Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="size-4.5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Next Delivery Free Voucher</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Collect 3 more ticket dispatches out of Vilnius Station</p>
          </div>
        </div>
        <ChevronRight className="size-4.5 text-slate-400" />
      </div>
    </div>
  )
}
