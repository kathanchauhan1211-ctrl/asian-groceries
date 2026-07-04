'use client'

import { useState } from 'react'
import {
  Bus,
  Check,
  Search,
  Loader2,
  Inbox,
  PackageCheck,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type TrackStep = {
  id: number
  label: string
  icon: any
  description: string
  time: string
}

const TRACK_STEPS: TrackStep[] = [
  {
    id: 1,
    label: 'Ordered',
    icon: Inbox,
    description: 'Order placed at Šaltinių g. 22 store, Vilnius.',
    time: 'Today · 10:15 AM',
  },
  {
    id: 2,
    label: 'Dispatched',
    icon: Bus,
    description: 'Departed Vilnius Bus Station - Expected arrival at target station platform in 2 hours.',
    time: 'Today · 12:30 PM',
  },
  {
    id: 3,
    label: 'Delivered',
    icon: PackageCheck,
    description: 'Arrived at target station courier platform counter.',
    time: 'Estimated · 2:30 PM',
  },
]

export function BusTracker({ initialTicket = '' }: { initialTicket?: string }) {
  const [ticket, setTicket] = useState(initialTicket)
  const [activeStep, setActiveStep] = useState<number | null>(initialTicket ? 2 : null)
  const [loading, setLoading] = useState(false)

  function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!ticket.trim()) return
    setLoading(true)
    setActiveStep(null)
    
    setTimeout(() => {
      // For demo, if ticket contains '1' or '3', we can change status, otherwise default to step 2 (Dispatched)
      const digits = ticket.replace(/\D/g, '')
      if (digits.endsWith('1')) {
        setActiveStep(1) // Ordered
      } else if (digits.endsWith('3')) {
        setActiveStep(3) // Delivered
      } else {
        setActiveStep(2) // Dispatched
      }
      setLoading(false)
    }, 700)
  }

  return (
    <section id="track" className="scroll-mt-40 relative overflow-hidden px-4 py-12 md:px-6">
      <div className="relative mx-auto max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <Bus className="size-3.5" /> Vilnius Bus Delivery System
          </span>
          <h2 className="mt-5 font-serif text-3xl font-bold text-slate-900 md:text-4xl">
            Autobusų Stotis <span className="text-accent">Live Tracker</span>
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Vilnius Bus Station direct courier pipeline. Track packages dispatched from our store at Šaltinių g. 22.
          </p>
        </div>

        {/* Input */}
        <form
          onSubmit={handleTrack}
          className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Enter Bus Ticket Number (e.g. AS-VLN-4821)"
              aria-label="Bus parcel ticket number"
              className="h-12 w-full rounded-md border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-300 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="h-12 rounded-md bg-accent px-6 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 transition-all duration-300"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Track Transit'}
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-slate-500">
          Try ticket suffix '1' for Ordered, '3' for Delivered, or any other digits for Dispatched demo.
        </p>

        {/* Pipeline */}
        {activeStep !== null && (
          <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 shadow-lg md:p-10 card-enter">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Parcel Link</p>
                <p className="text-md font-bold text-slate-900">{ticket.toUpperCase() || 'AS-VLN-4821'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Node Status</p>
                <span className="inline-block mt-1 rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {TRACK_STEPS[activeStep - 1].label}
                </span>
              </div>
            </div>

            {/* Line Layout */}
            <div className="relative my-10 py-4">
              <div className="absolute left-6 right-6 top-1/2 h-[3px] -translate-y-1/2 bg-slate-200" />
              
              {/* Active track between Stage 1 & 2 if activeStep is >= 2 */}
              {activeStep >= 2 && (
                <div
                  className="absolute left-6 top-1/2 h-[3.5px] -translate-y-1/2 bg-accent transition-all duration-500"
                  style={{
                    width: activeStep === 2 ? '50%' : '100%',
                  }}
                />
              )}

              {/* Steps grid */}
              <div className="relative flex justify-between">
                {TRACK_STEPS.map((step) => {
                  const isDone = step.id < activeStep
                  const isCurrent = step.id === activeStep
                  const StepIcon = step.icon
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center relative">
                      {/* Animated Bus Vector directly over node 2 if active index is 2 */}
                      {step.id === 2 && isCurrent && (
                        <div className="absolute -top-12 z-20 flex flex-col items-center animate-bounce">
                          <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded shadow-sm">
                            In-Transit
                          </span>
                          <div className="w-1.5 h-1.5 bg-accent rotate-45 mt-0.5" />
                        </div>
                      )}

                      {/* Node circle */}
                      <span
                        className={`z-10 flex size-12 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                          isDone
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                            : isCurrent
                              ? 'border-accent bg-white text-accent shadow-sm scale-110'
                              : 'border-slate-300 bg-slate-50 text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <Check className="size-5" />
                        ) : (
                          <StepIcon className={`size-5`} />
                        )}
                      </span>

                      {/* Label */}
                      <span
                        className={`mt-3 text-xs font-bold transition-colors duration-300 ${
                          isCurrent ? 'text-accent' : isDone ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtitle / Active context */}
            <div className="mt-8 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                Live Courier Update
              </p>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                {activeStep === 2 
                  ? 'Departed Vilnius Bus Station - Expected arrival at target station platform in 2 hours.'
                  : TRACK_STEPS[activeStep - 1].description
                }
              </p>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                Timestamp: {TRACK_STEPS[activeStep - 1].time}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
