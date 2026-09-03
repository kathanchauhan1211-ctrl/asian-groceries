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
// Viewbox: 0 0 500 420
// City coords placed on accurate Lithuania geographic outline
// Vilnius = origin hub (bottom-right), routes radiate out to other cities

const VILNIUS = { x: 370, y: 295, name: 'Vilnius', label: 'HUB' }

const DESTINATIONS = [
  { id: 'kaunas',      x: 220, y: 270, name: 'Kaunas',      eta: '1h 20m' },
  { id: 'klaipeda',   x: 55,  y: 195, name: 'Klaipėda',   eta: '3h 00m' },
  { id: 'siauliai',   x: 160, y: 115, name: 'Šiauliai',    eta: '2h 30m' },
  { id: 'panevezys',  x: 255, y: 145, name: 'Panevėžys',   eta: '2h 00m' },
  { id: 'alytus',     x: 255, y: 340, name: 'Alytus',      eta: '1h 30m' },
  { id: 'marijampole',x: 195, y: 330, name: 'Marijampolė', eta: '1h 45m' },
]

// Accurate Lithuania geographic outline path (scaled to 500x420 viewBox)
// Based on real cartographic data — wider at top-right, tapering south-west
const LITHUANIA_PATH = `
  M 175 42
  L 210 38
  L 248 35
  L 280 38
  L 318 42
  L 345 48
  L 375 55
  L 400 65
  L 420 80
  L 435 100
  L 445 122
  L 450 148
  L 448 172
  L 442 195
  L 438 215
  L 432 235
  L 425 255
  L 416 272
  L 408 290
  L 400 308
  L 390 325
  L 375 340
  L 358 352
  L 338 362
  L 315 368
  L 290 372
  L 268 370
  L 248 363
  L 228 353
  L 210 340
  L 195 325
  L 178 312
  L 158 300
  L 138 288
  L 118 272
  L 100 255
  L 85 238
  L 72 218
  L 62 198
  L 55 178
  L 50 155
  L 48 132
  L 50 112
  L 56 92
  L 68 75
  L 82 62
  L 100 52
  L 122 45
  L 148 40
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
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 shadow-inner">
      <svg
        viewBox="0 0 500 420"
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
          {/* Lithuanian flag clip path — clips the 3-stripe flag to the country shape */}
          <clipPath id="lithuaniaClip">
            <path d={LITHUANIA_PATH} />
          </clipPath>
          {/* Hatching pattern overlay for the sketch/crosshatch texture */}
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
          </pattern>
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

        <rect width="500" height="420" fill="url(#grid)" />

        {/* ── Lithuanian flag fill: 3 horizontal stripes clipped to country shape ── */}
        {/* Yellow/Gold — top third */}
        <rect x="0" y="0" width="500" height="140" fill="#F9B732" clipPath="url(#lithuaniaClip)" />
        {/* Green — middle third */}
        <rect x="0" y="140" width="500" height="140" fill="#2E7D32" clipPath="url(#lithuaniaClip)" />
        {/* Dark Red — bottom third */}
        <rect x="0" y="280" width="500" height="140" fill="#8B1C2B" clipPath="url(#lithuaniaClip)" />
        {/* Crosshatch texture overlay for sketch look */}
        <rect x="0" y="0" width="500" height="420" fill="url(#hatch)" clipPath="url(#lithuaniaClip)" opacity="0.5"/>

        {/* ── Lithuania outline border ── */}
        <path
          d={LITHUANIA_PATH}
          fill="none"
          stroke="#c9a227"
          strokeWidth="2"
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
                className="dark:stroke-slate-900"
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
                className={isActive ? 'dark:fill-orange-400' : 'dark:fill-slate-400'}
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
          fill="white"
          stroke="#1e293b"
          strokeWidth="3"
          paintOrder="stroke"
          fontFamily="Inter, sans-serif"
        >
          Vilnius HUB
        </text>

        {/* ── Legend ── */}
        <g transform="translate(10, 10)">
          <rect width="110" height="36" rx="6" fill="white" opacity="0.92" stroke="#e2e8f0" strokeWidth="1"/>
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
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
            <Bus className="size-3.5" /> Vilnius Bus Delivery System
          </span>
          <h2 className="mt-5 font-serif text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            Autobusų Stotis <span className="text-accent">Live Tracker</span>
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Vilnius Bus Station direct courier pipeline. Track packages dispatched from our store at Šaltinių g. 22.
          </p>
        </div>

        {/* Input */}
        <form
          onSubmit={handleTrack}
          className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Enter Bus Ticket Number (e.g. AS-VLN-4821)"
              aria-label="Bus parcel ticket number"
              className="h-12 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-all duration-300 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
            <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Parcel Link</p>
                  <p className="text-md font-bold text-slate-900 dark:text-white">{ticket.toUpperCase() || 'AS-VLN-4821'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {activeDestId && (
                    <div className="flex items-center gap-1.5 rounded-md bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                      <Navigation className="size-3.5 text-accent" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {DESTINATIONS.find(d => d.id === activeDestId)?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        · ETA {DESTINATIONS.find(d => d.id === activeDestId)?.eta}
                      </span>
                    </div>
                  )}
                  <span className="inline-block rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                    {TRACK_STEPS[activeStep - 1].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              {/* Left: Pipeline steps */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
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
                                  ? 'border-accent bg-white dark:bg-slate-900 text-accent shadow-md scale-110'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
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
                              isDone ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                            }`} />
                          )}
                        </div>

                        {/* Text */}
                        <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                          <p className={`text-sm font-bold transition-colors ${
                            isCurrent ? 'text-accent' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.time}</p>
                          {isCurrent && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{step.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Live update */}
                <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-accent animate-pulse" />
                    Live Courier Update
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeStep === 2 
                      ? `Bus courier en route from Vilnius to ${DESTINATIONS.find(d => d.id === activeDestId)?.name ?? 'destination'} — ETA ${DESTINATIONS.find(d => d.id === activeDestId)?.eta ?? ''}`
                      : TRACK_STEPS[activeStep - 1].description
                    }
                  </p>
                </div>
              </div>

              {/* Right: Lithuania Map */}
              <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Route Map — Lithuania</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
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
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-accent/40 text-accent'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
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
