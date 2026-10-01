'use client'

import { useState, useEffect } from 'react'
import { PageHero } from '@/components/page-hero'
import { useSearchParams } from 'next/navigation'
import { Search, Loader2, Truck, Bus, Building2, CheckCircle2, ArrowRight, PackageOpen, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TabType = 'dpd' | 'bus' | 'pickup'

export default function TrackPageContent() {
  const searchParams = useSearchParams()
  const initialTicket = searchParams.get('ticket') || ''

  const [ticket, setTicket] = useState(initialTicket)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('dpd')

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!ticket) return

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/track?ticket=${encodeURIComponent(ticket)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to track order.')
      }
      setOrder(data)
      
      // Auto-switch tab based on delivery method
      if (data.deliveryMethod === 'bus') setActiveTab('bus')
      else if (data.deliveryMethod === 'pickup') setActiveTab('pickup')
      else setActiveTab('dpd')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialTicket) {
      handleTrack()
    }
  }, [initialTicket])

  return (
    <div className="pb-24 min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      {/* Premium Hero Section */}
      <div className="relative pt-16 pb-32 overflow-hidden border-b border-slate-200 dark:border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent" />
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-orange-500/10 dark:bg-orange-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto px-4 text-center z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-600 border border-orange-200/50 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-400 mb-6">
            Live Delivery Tracking
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Track your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Order</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto mb-10">
            Enter your order ticket below to instantly find your delivery method and current live status.
          </p>

          {/* Universal Search Bar */}
          <form onSubmit={handleTrack} className="relative group max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
              <Search className="size-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input
              type="text"
              value={ticket}
              onChange={(e) => setTicket(e.target.value.toUpperCase())}
              placeholder="e.g. ORD121023-0001"
              className="block w-full rounded-2xl border-2 border-slate-200/80 bg-white/80 backdrop-blur-md p-5 pl-14 pr-36 text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-[6px] focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:placeholder-slate-500 dark:focus:border-orange-500 dark:focus:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none text-lg font-mono tracking-wide"
              required
            />
            <div className="absolute inset-y-2 right-2">
              <Button type="submit" disabled={loading || !ticket} className="h-full rounded-xl px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md border-0 transition-all hover:scale-[1.02] active:scale-95">
                {loading ? <Loader2 className="size-5 animate-spin" /> : <span className="font-bold text-sm tracking-wide">Track Now</span>}
              </Button>
            </div>
          </form>
          {error && (
            <div className="mt-4 inline-block bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm font-semibold px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* Tabs */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex gap-1 mb-8 shadow-sm max-w-2xl mx-auto">
          <button 
            onClick={() => { setActiveTab('dpd'); setOrder(null); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'dpd' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Truck className={`size-4 ${activeTab === 'dpd' ? 'text-orange-500' : ''}`} /> DPD Courier
          </button>
          <button 
            onClick={() => { setActiveTab('bus'); setOrder(null); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'bus' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Bus className={`size-4 ${activeTab === 'bus' ? 'text-orange-500' : ''}`} /> Bus Terminal
          </button>
          <button 
            onClick={() => { setActiveTab('pickup'); setOrder(null); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'pickup' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
          >
            <Building2 className={`size-4 ${activeTab === 'pickup' ? 'text-orange-500' : ''}`} /> Store Pickup
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-[#131A2A] border border-slate-200 dark:border-slate-800/60 rounded-[32px] p-6 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none min-h-[300px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-[300px] bg-slate-50 dark:bg-slate-800/30 rounded-full blur-3xl pointer-events-none" />

          {/* DPD TAB */}
          {activeTab === 'dpd' && (
            <div className="relative z-10 w-full max-w-lg mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="size-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Truck className="size-10" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">DPD Courier</h3>
              <p className="text-slate-500 dark:text-slate-400 text-base mb-8">
                {order ? (
                  <>Your order is being handled by DPD. You can track its live status directly on the DPD tracking portal below.</>
                ) : (
                  <>Fast and reliable home delivery across Lithuania. Enter your order ticket above to get your direct tracking link.</>
                )}
              </p>
              
              {order && (
                order.dpdParcelNumber ? (
                  <Button size="xl" asChild className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg shadow-red-600/20 py-7 text-lg group transition-all">
                    <a href={`https://www.dpd.com/lt/lt/nepristatyti-siuntiniai/?pknr=${order.dpdParcelNumber}`} target="_blank" rel="noreferrer">
                      Track on DPD Website <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-5 rounded-2xl text-amber-800 dark:text-amber-400 text-sm font-semibold flex items-center gap-3 text-left shadow-inner">
                    <Loader2 className="size-5 animate-spin shrink-0 text-amber-500" />
                    Order is processing. DPD Tracking Number will be assigned shortly.
                  </div>
                )
              )}
            </div>
          )}

          {/* BUS TAB */}
          {activeTab === 'bus' && (
            <div className="relative z-10 w-full max-w-lg mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="size-20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Bus className="size-10" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Bus Terminal</h3>
              <p className="text-slate-500 dark:text-slate-400 text-base mb-8">
                {order ? (
                  <>Track the status of your parcel dispatched via Lithuanian Bus Terminals.</>
                ) : (
                  <>Convenient pickup from your local bus station. Enter your order ticket above to view your live dispatch status.</>
                )}
              </p>
              
              {order && (
                <div className="text-left space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <MapPin className="size-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Destination</p>
                        <p className="font-bold text-slate-900 dark:text-white">{order.transitHub}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-6 rounded-2xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <CheckCircle2 className="size-24" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 relative z-10">Current Status</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 relative z-10">
                      <CheckCircle2 className="size-8 text-blue-500" /> {order.status || 'Pending'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PICKUP TAB */}
          {activeTab === 'pickup' && (
            <div className="relative z-10 w-full max-w-lg mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="size-20 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Building2 className="size-10" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Store Pickup</h3>
              <p className="text-slate-500 dark:text-slate-400 text-base mb-8">
                {order ? (
                  <>Check if your order is ready to be collected from our store.</>
                ) : (
                  <>Order online and pick it up from our Vilnius store for free. Enter your ticket above to see if it's ready.</>
                )}
              </p>
              
              {order && (
                <div className="text-left space-y-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <MapPin className="size-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Location</p>
                        <p className="font-bold text-slate-900 dark:text-white">Asian Groceries, Šaltinių g. 22</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-6 rounded-2xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <CheckCircle2 className="size-24" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 relative z-10">Current Status</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 relative z-10">
                      <CheckCircle2 className="size-8 text-emerald-500" /> {order.status || 'Pending'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
