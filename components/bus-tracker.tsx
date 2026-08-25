'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bus,
  Check,
  Search,
  Loader2,
  Inbox,
  PackageCheck,
  MapPin,
  Navigation,
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
    description: 'Departed Vilnius Bus Station — Expected arrival at target station platform in 2 hours.',
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

// ── Lithuania SVG Map ──────────────────────────────────────────────────────
// Viewbox: 0 0 500 400
// City coords manually placed on a stylised Lithuania outline
// Vilnius = origin hub (bottom-right), routes radiate out to other cities

const VILNIUS = { x: 380, y: 290, name: 'Vilnius', label: 'HUB' }

const DESTINATIONS = [
  { id: 'kaunas',     x: 245, y: 265, name: 'Kaunas',     eta: '1h 20m' },
  { id: 'klaipeda',  x: 65,  y: 185, name: 'Klaipėda',  eta: '3h 00m' },
  { id: 'siauliai',  x: 165, y: 110, name: 'Šiauliai',   eta: '2h 30m' },
  { id: 'panevezys', x: 250, y: 140, name: 'Panevėžys',  eta: '2h 00m' },
  { id: 'alytus',    x: 270, y: 330, name: 'Alytus',     eta: '1h 30m' },
  { id: 'marijampole',x: 205, y: 320, name: 'Marijampolė', eta: '1h 45m' },
]

// Approximate Lithuania outline path (stylised polygon)
const LITHUANIA_PATH = `
  M 140 55
  L 200 42
  L 265 48
  L 320 55
  L 375 68
  L 420 95
  L 445 130
  L 450 165
  L 440 200
  L 435 230
  L 420 255
  L 415 280
  L 405 305
  L 390 330
  L 370 350
  L 340 365
  L 300 370
  L 260 368
  L 230 355
  L 205 340
  L 180 330
  L 148 325
  L 115 310
  L 85 285
  L 62 260
  L 50 230
  L 42 200
  L 40 170
  L 48 140
  L 60 118
  L 75 95
  L 95 75
  L 115 62
  Z
`

function LithuaniaMap({ activeDestId }: { activeDestId: string | null }) {
  const [animProgress, setAnimProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 2200 // ms per animation cycle

  useEffect(() => {
    if (!activeDestId) {
      setAnimProgress(0)
      return
    }
    let running = true
    const animate = (ts: number) => {
      if (!running) return
      if (startRef.current === null) startRef.current = ts
      const elapsed = (ts - startRef.current) % DURATION
      setAnimProgress(elapsed / DURATION)
      rafRef.current = requestAnimationFrame(animate)
    }
    startRef.current = null
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activeDestId])

  const activeDest = DESTINATIONS.find(d => d.id === activeDestId)

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 shadow-inner">
      <svg
        viewBox="0 0 500 400"
        className="w-full"
        aria-label="Lithuania delivery route map"
      >
        {/* ── Background subtle grid ── */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
          </radialGradient>
          {/* Route animation markers */}
          {DESTINATIONS.map(dest => {
            const id = `route-${dest.id}`
            return (
              <marker key={id} id={id} markerWidth="6" markerHeight="6" refX="3" refY="3">
                <circle cx="3" cy="3" r="2.5" fill="#f97316"/>
              </marker>
            )
          })}
        </defs>

        <rect width="500" height="400" fill="url(#grid)" />

        {/* ── Lithuania outline ── */}
        <path
          d={LITHUANIA_PATH}
          fill="#f0fdf4"
          stroke="#86efac"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* ── Route lines (dashed grey) ── */}
        {DESTINATIONS.map(dest => (
          <line
            key={`line-bg-${dest.id}`}
            x1={VILNIUS.x} y1={VILNIUS.y}
            x2={dest.x} y2={dest.y}
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.6"
          />
        ))}

        {/* ── Active route highlight ── */}
        {activeDest && (
          <>
            {/* Glowing route line */}
            <line
              x1={VILNIUS.x} y1={VILNIUS.y}
              x2={activeDest.x} y2={activeDest.y}
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
              opacity="0.85"
            />
            {/* Animated bus dot travelling along the route */}
            {(() => {
              const t = animProgress
              const x = VILNIUS.x + (activeDest.x - VILNIUS.x) * t
              const y = VILNIUS.y + (activeDest.y - VILNIUS.y) * t
              return (
                <>
                  {/* Trail glow */}
                  <circle cx={x} cy={y} r="10" fill="#f97316" opacity="0.15"/>
                  {/* Bus icon represented as rounded rect */}
                  <g transform={`translate(${x - 10}, ${y - 10})`}>
                    <rect width="20" height="14" rx="4" fill="#f97316" filter="url(#glow)"/>
                    <rect x="2" y="3" width="4" height="4" rx="1" fill="white" opacity="0.9"/>
                    <rect x="8" y="3" width="4" height="4" rx="1" fill="white" opacity="0.9"/>
                    <rect x="14" y="3" width="4" height="4" rx="1" fill="white" opacity="0.9"/>
                    <circle cx="4" cy="14" r="2.5" fill="#1e293b"/>
                    <circle cx="16" cy="14" r="2.5" fill="#1e293b"/>
                  </g>
                </>
              )
            })()}
          </>
        )}

        {/* ── Destination city dots ── */}
        {DESTINATIONS.map(dest => {
          const isActive = dest.id === activeDestId
          return (
            <g key={dest.id}>
              {/* Pulse ring for active */}
              {isActive && (
                <circle
                  cx={dest.x} cy={dest.y} r="14"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  opacity="0.5"
                >
                  <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle
                cx={dest.x} cy={dest.y} r={isActive ? 7 : 5}
                fill={isActive ? '#f97316' : '#64748b'}
                stroke="white"
                strokeWidth="2"
              />
              {/* City label */}
              <text
                x={dest.x}
                y={dest.y - 12}
                textAnchor="middle"
                fontSize="9"
                fontWeight={isActive ? '700' : '500'}
                fill={isActive ? '#c2410c' : '#475569'}
                fontFamily="Inter, sans-serif"
              >
                {dest.name}
              </text>
              {isActive && (
                <text
                  x={dest.x}
                  y={dest.y - 23}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill="#f97316"
                  fontFamily="Inter, sans-serif"
                >
                  {dest.eta}
                </text>
              )}
            </g>
          )
        })}

        {/* ── Vilnius Hub (origin) ── */}
        <circle cx={VILNIUS.x} cy={VILNIUS.y} r="16" fill="url(#hubGlow)"/>
        <circle
          cx={VILNIUS.x} cy={VILNIUS.y} r="9"
          fill="#1e293b"
          stroke="#f97316"
          strokeWidth="3"
        />
        <text
          x={VILNIUS.x} y={VILNIUS.y + 3}
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="white"
          fontFamily="Inter, sans-serif"
        >
          VNO
        </text>
        <text
          x={VILNIUS.x} y={VILNIUS.y - 16}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#1e293b"
          fontFamily="Inter, sans-serif"
        >
          Vilnius HUB
        </text>

        {/* ── Legend ── */}
        <g transform="translate(10, 10)">
          <rect width="100" height="36" rx="6" fill="white" opacity="0.85" stroke="#e2e8f0" strokeWidth="0.5"/>
          <circle cx="14" cy="12" r="5" fill="#1e293b" stroke="#f97316" strokeWidth="2"/>
          <text x="24" y="16" fontSize="8" fill="#1e293b" fontFamily="Inter, sans-serif" fontWeight="600">Origin Hub</text>
          <circle cx="14" cy="28" r="4" fill="#64748b" stroke="white" strokeWidth="1.5"/>
          <text x="24" y="32" fontSize="8" fill="#64748b" fontFamily="Inter, sans-serif">Delivery Point</text>
        </g>
      </svg>
    </div>
  )
}

export function BusTracker({ initialTicket = '' }: { initialTicket?: string }) {
  const [ticket, setTicket] = useState(initialTicket || 'AS-VLN-4821')
  const [activeStep, setActiveStep] = useState<number | null>(2)
  const [activeDestId, setActiveDestId] = useState<string | null>('kaunas')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return () => {
      // Cleanup any active listener on unmount
    }
  }, [])

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!ticket.trim()) return
    setLoading(true)
    setActiveStep(null)
    setActiveDestId(null)
    
    try {
      const { doc, onSnapshot } = await import('firebase/firestore')
      const { clientDb } = await import('@/lib/firebase-client')
      
      const orderRef = doc(clientDb, 'orders', ticket.trim())
      
      // We start listening
      onSnapshot(orderRef, (orderSnap) => {
        if (orderSnap.exists()) {
          const data = orderSnap.data()
          // Determine step based on status
          if (data.status === 'Paid - Processing') setActiveStep(1)
          else if (data.status === 'Dispatched') setActiveStep(2)
          else if (data.status === 'Delivered') setActiveStep(3)
          else setActiveStep(1) // Default to Ordered
          
          setActiveDestId('kaunas')
          setLoading(false)
        } else {
          // If not found, clear it
          setActiveStep(null)
          setActiveDestId(null)
          setLoading(false)
        }
      }, (err) => {
        console.error('Firestore listener failed:', err)
        setActiveStep(null)
        setActiveDestId(null)
        setLoading(false)
      })
      
    } catch (err) {
      console.error('Firestore fetch failed:', err)
      setActiveStep(null)
      setActiveDestId(null)
      setLoading(false)
    }
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
          Try suffix '3'→Klaipėda, '4'→Šiauliai, '5'→Panevėžys, '6'→Alytus, other→Kaunas
        </p>

        {/* Pipeline + Map layout */}
        {activeStep !== null && (
          <div className="mt-10 card-enter">
            {/* Status Header */}
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Parcel Link</p>
                  <p className="text-md font-bold text-slate-900">{ticket.toUpperCase() || 'AS-VLN-4821'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {activeDestId && (
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-3 py-1.5 border border-slate-200">
                      <Navigation className="size-3.5 text-accent" />
                      <span className="text-xs font-bold text-slate-700">
                        {DESTINATIONS.find(d => d.id === activeDestId)?.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        · ETA {DESTINATIONS.find(d => d.id === activeDestId)?.eta}
                      </span>
                    </div>
                  )}
                  <span className="inline-block rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    {TRACK_STEPS[activeStep - 1].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              {/* Left: Pipeline steps */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Transit Progress</p>

                {/* Vertical step layout */}
                <div className="relative space-y-0">
                  {TRACK_STEPS.map((step, idx) => {
                    const isDone = step.id < activeStep
                    const isCurrent = step.id === activeStep
                    const StepIcon = step.icon
                    const isLast = idx === TRACK_STEPS.length - 1
                    
                    return (
                      <div key={step.id} className="flex gap-3">
                        {/* Icon + connector */}
                        <div className="flex flex-col items-center">
                          <span
                            className={`z-10 flex size-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                              isDone
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                : isCurrent
                                  ? 'border-accent bg-white text-accent shadow-md scale-110'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            {isDone ? (
                              <Check className="size-4" />
                            ) : (
                              <StepIcon className="size-4" />
                            )}
                          </span>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 min-h-[32px] mt-1 mb-1 rounded-full transition-all duration-500 ${
                              isDone ? 'bg-emerald-400' : 'bg-slate-200'
                            }`} />
                          )}
                        </div>

                        {/* Text */}
                        <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                          <p className={`text-sm font-bold transition-colors ${
                            isCurrent ? 'text-accent' : isDone ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.time}</p>
                          {isCurrent && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Live update */}
                <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-accent animate-pulse" />
                    Live Courier Update
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {activeStep === 2 
                      ? `Bus courier en route from Vilnius to ${DESTINATIONS.find(d => d.id === activeDestId)?.name ?? 'destination'} — ETA ${DESTINATIONS.find(d => d.id === activeDestId)?.eta ?? ''}`
                      : TRACK_STEPS[activeStep - 1].description
                    }
                  </p>
                </div>
              </div>

              {/* Right: Lithuania Map */}
              <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Route Map — Lithuania</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="size-2 rounded-full bg-accent animate-pulse" />
                    {activeStep === 2 ? 'In Transit' : activeStep === 3 ? 'Delivered' : 'Processing'}
                  </div>
                </div>
                <LithuaniaMap activeDestId={activeStep === 2 ? activeDestId : (activeStep === 3 ? activeDestId : null)} />
                {/* City legend */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {DESTINATIONS.map(dest => (
                    <span
                      key={dest.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-all ${
                        dest.id === activeDestId
                          ? 'bg-orange-50 border-accent/40 text-accent'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <MapPin className="size-2.5" /> {dest.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
