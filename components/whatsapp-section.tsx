'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Bell, Users, Zap, Shield, Sparkles, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { PRODUCTS } from '@/lib/products'
import { Button } from '@/components/ui/button'

export function WhatsAppSection({ onQuickBuy }: { onQuickBuy: (productId: string) => void }) {
  const { count } = useCart()
  const [members, setMembers] = useState(1482)

  // Increment user counts slightly over time to show live synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      setMembers((prev) => prev + Math.floor(Math.random() * 2))
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="community" className="scroll-mt-40 relative overflow-hidden py-10 px-4 md:px-6">
      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto max-w-xl text-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <MessageCircle className="size-3.5" /> Vilnius Community Hub
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-slate-900">
            Live WhatsApp <span className="text-accent">Telemetry Stream</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Real-time Vilnius store inventory, restocks, and warehouse notifications pushed directly from Šaltinių g. 22.
          </p>
        </div>

        {/* Telemetry feed layout */}
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm animate-pulse">
                <MessageCircle className="size-5.5" />
              </span>
              <div>
                <p className="font-bold text-slate-900 text-sm">AG Stock Alerts · Vilnius</p>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync (Stock Stream Active)
                </p>
              </div>
            </div>
            
            <div className="rounded-md bg-slate-50 px-2.5 py-1 border border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block leading-none">Members</span>
              <span className="text-xs font-bold text-slate-700 tabular-nums">{members} online</span>
            </div>
          </div>

          {/* Telemetry alerts list - styled as messaging bubbles */}
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 py-1">
            
            {/* System Info */}
            <div className="text-center">
              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider border border-slate-200">
                Today's Stream Updates
              </span>
            </div>

            {/* Bubble 1: Rice re-up */}
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                AG
              </div>
              <div className="flex flex-col max-w-[85%]">
                <div className="rounded-2xl rounded-tl-sm bg-slate-50 p-3.5 border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-700 block mb-1">🟢 STOCK RE-UP</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Fresh <strong>Indian Sella Basmati Rice 5kg</strong> just stacked on shelves! Secure your bag before dispatch runs out.
                  </p>
                  
                  <Button
                    onClick={() => onQuickBuy('basmati-rice')}
                    variant="emerald"
                    size="sm"
                    className="mt-3 font-bold shadow-sm"
                  >
                    <ShoppingCart className="size-3" /> [Quick Buy]
                  </Button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 self-start ml-1">12:32 PM</span>
              </div>
            </div>

            {/* Bubble 2: Everest Spices Alert */}
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                AG
              </div>
              <div className="flex flex-col max-w-[85%]">
                <div className="rounded-2xl rounded-tl-sm bg-slate-50 p-3.5 border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-600 block mb-1">🚨 ALERT</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>Everest Tikhalal Spices</strong> running low. Only 2 items remaining in-store! Lock in your reservation today.
                  </p>
                  
                  <Button
                    onClick={() => onQuickBuy('everest-spices')}
                    variant="amber"
                    size="sm"
                    className="mt-3 font-bold shadow-sm"
                  >
                    <ShoppingCart className="size-3" /> [Secure Yours]
                  </Button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 self-start ml-1">1:40 PM</span>
              </div>
            </div>

            {/* Bubble 3: Delivery Reminder */}
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                AG
              </div>
              <div className="flex flex-col max-w-[85%]">
                <div className="rounded-2xl rounded-tl-sm bg-slate-50 p-3.5 border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-600 block mb-1">📦 LOGISTICS UPDATE</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Kaunas and Klaipėda bus courier parcel dispatches leave Vilnius station in 45 mins. Finish checkout to bundle!
                  </p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 self-start ml-1">2:00 PM</span>
              </div>
            </div>

          </div>

          {/* Sync CTA Banner */}
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 border-l-4 border-l-emerald-500">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-accent animate-spin" /> Sync to Vilnius Food Group Channel
            </h4>
            <p className="text-[11px] text-slate-600 mt-1">
              Join {members} Vilnius residents getting real-time updates directly into their personal WhatsApp chat.
            </p>
            <Button
              href="https://wa.me/37060000000"
              target="_blank"
              rel="noopener noreferrer"
              variant="emerald"
              className="mt-3.5 w-full font-bold shadow-sm"
            >
              <MessageCircle className="size-4" /> Link WhatsApp Identity
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
