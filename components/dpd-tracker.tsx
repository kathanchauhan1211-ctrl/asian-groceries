'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search,
  Loader2,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PackageOpen,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Navigation,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types (mirrored from API route) ─────────────────────────────────────────

type DpdStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'pickup_ready'
  | 'delivered'
  | 'exception'
  | 'unknown'

interface DpdEvent {
  timestamp: string
  description: string
  location?: string
  code?: string
}

interface DpdTrackResponse {
  parcelNumber: string
  status: DpdStatus
  statusLabel: string
  estimatedDelivery?: string
  recipient?: string
  destinationCity?: string
  events: DpdEvent[]
}

type ErrorState =
  | { type: 'ORDER_NOT_FOUND'; message: string }
  | { type: 'DPD_NOT_ASSIGNED'; message: string; orderStatus?: string }
  | { type: 'PARCEL_NOT_FOUND'; message: string }
  | { type: 'SERVICE_UNAVAILABLE'; message: string }
  | { type: 'GENERIC'; message: string }

// ─── Status pipeline config ───────────────────────────────────────────────────

const PIPELINE_STEPS: {
  key: DpdStatus[]
  label: string
  icon: React.ElementType
  shortLabel: string
}[] = [
  {
    key: ['pending'],
    label: 'Order Registered',
    shortLabel: 'Registered',
    icon: Package,
  },
  {
    key: ['in_transit'],
    label: 'In Transit',
    shortLabel: 'In Transit',
    icon: Truck,
  },
  {
    key: ['out_for_delivery'],
    label: 'Out for Delivery',
    shortLabel: 'Out for Delivery',
    icon: Navigation,
  },
  {
    key: ['pickup_ready'],
    label: 'Ready for Pickup',
    shortLabel: 'Pickup Ready',
    icon: Building2,
  },
  {
    key: ['delivered'],
    label: 'Delivered',
    shortLabel: 'Delivered',
    icon: CheckCircle2,
  },
]

function getStepIndex(status: DpdStatus): number {
  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    if (PIPELINE_STEPS[i].key.includes(status)) return i
  }
  return 0
}

// ─── Status colour helpers ────────────────────────────────────────────────────

const STATUS_PALETTE: Record<
  DpdStatus,
  { bg: string; border: string; text: string; dot: string; badge: string }
> = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-700/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  in_transit: {
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-700/40',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  out_for_delivery: {
    bg: 'bg-violet-50 dark:bg-violet-900/10',
    border: 'border-violet-200 dark:border-violet-700/40',
    text: 'text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  },
  pickup_ready: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/10',
    border: 'border-cyan-200 dark:border-cyan-700/40',
    text: 'text-cyan-700 dark:text-cyan-400',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
  delivered: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-700/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  exception: {
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-700/40',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  unknown: {
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  },
}

// ─── Lithuania SVG Map ────────────────────────────────────────────────────────
// Accurate geographic outline, tricolor flag fill clipped to country shape.
// Clean, flat, minimalist — no labels, no grid, no animation dots.

const LT_PATH = `
  M 188 42
  C 196 36 210 34 228 33
  C 248 32 268 33 288 36
  C 308 39 326 44 348 50
  C 368 56 385 64 402 76
  C 418 88 430 104 438 122
  C 446 140 448 160 446 180
  C 444 198 438 216 432 232
  C 426 248 418 263 410 278
  C 402 293 394 308 385 322
  C 376 336 364 348 350 358
  C 336 368 320 374 302 376
  C 284 378 266 376 250 370
  C 234 364 220 354 207 342
  C 194 330 183 316 170 303
  C 158 291 144 280 130 268
  C 116 256 103 242 92 227
  C 81 212 72 195 66 178
  C 60 161 56 143 55 125
  C 54 108 56 91 62 76
  C 68 62 77 50 90 42
  C 103 34 118 30 136 30
  C 154 30 170 33 188 42
  Z
`

function LithuaniaFlagMap({ cityDot }: { cityDot?: { x: number; y: number; label: string } | null }) {
  return (
    <div className="relative w-full flex items-center justify-center bg-white dark:bg-slate-950 rounded-xl overflow-hidden">
      <svg
        viewBox="50 25 400 360"
        className="w-full max-w-sm mx-auto drop-shadow-md"
        aria-label="Map of Lithuania with flag colors"
        role="img"
      >
        <defs>
          <clipPath id="lt-clip">
            <path d={LT_PATH} />
          </clipPath>
          {/* Subtle glow for destination dot */}
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Lithuanian flag tricolor — clipped to country outline ── */}
        {/* Top third: Yellow/Gold */}
        <rect x="0" y="0" width="600" height="160" fill="#FDB913" clipPath="url(#lt-clip)" />
        {/* Middle third: Forest Green */}
        <rect x="0" y="160" width="600" height="120" fill="#006A44" clipPath="url(#lt-clip)" />
        {/* Bottom third: Deep Red */}
        <rect x="0" y="280" width="600" height="200" fill="#C1272D" clipPath="url(#lt-clip)" />

        {/* ── Country outline border ── */}
        <path
          d={LT_PATH}
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* ── Destination city dot (if known) ── */}
        {cityDot && (
          <g filter="url(#dot-glow)">
            {/* Pulse ring */}
            <circle cx={cityDot.x} cy={cityDot.y} r="14" fill="white" opacity="0.3">
              <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Dot */}
            <circle cx={cityDot.x} cy={cityDot.y} r="7" fill="white" stroke="#DC2626" strokeWidth="2.5" />
            <circle cx={cityDot.x} cy={cityDot.y} r="3.5" fill="#DC2626" />
          </g>
        )}
      </svg>
    </div>
  )
}

// ─── City coordinate map (SVG viewBox 50 25 400 360) ─────────────────────────

const CITY_DOTS: Record<string, { x: number; y: number; label: string }> = {
  vilnius:    { x: 370, y: 295, label: 'Vilnius' },
  kaunas:     { x: 220, y: 270, label: 'Kaunas' },
  klaipeda:   { x: 68,  y: 195, label: 'Klaipėda' },
  siauliai:   { x: 160, y: 115, label: 'Šiauliai' },
  panevezys:  { x: 253, y: 145, label: 'Panevėžys' },
  alytus:     { x: 253, y: 338, label: 'Alytus' },
}

function getCityDot(destinationCity?: string | null) {
  if (!destinationCity) return null
  const lower = destinationCity.toLowerCase()
  for (const [key, val] of Object.entries(CITY_DOTS)) {
    if (lower.includes(key.replace('ė', 'e').replace('š', 's').replace('ž', 'z')) ||
        lower.includes(val.label.toLowerCase().substring(0, 4))) {
      return val
    }
  }
  return null
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function fmtDateShort(iso: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBanner({ data }: { data: DpdTrackResponse }) {
  const palette = STATUS_PALETTE[data.status] ?? STATUS_PALETTE.unknown
  const isException = data.status === 'exception'

  return (
    <div
      className={`rounded-2xl border ${palette.bg} ${palette.border} p-5 md:p-6 shadow-sm`}
    >
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div className={`mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-xl ${palette.badge}`}>
            {isException ? (
              <AlertTriangle className="size-6" />
            ) : data.status === 'delivered' ? (
              <CheckCircle2 className="size-6" />
            ) : data.status === 'out_for_delivery' ? (
              <Truck className="size-6" />
            ) : data.status === 'pickup_ready' ? (
              <Building2 className="size-6" />
            ) : (
              <Package className="size-6" />
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              Parcel Status
            </p>
            <p className={`text-xl font-bold ${palette.text}`}>
              {data.statusLabel}
            </p>
            {data.destinationCity && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="size-3.5" />
                Destination: <span className="font-semibold text-slate-700 dark:text-slate-200 ml-0.5">{data.destinationCity}</span>
              </p>
            )}
            {data.recipient && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Recipient: <span className="font-semibold text-slate-700 dark:text-slate-200">{data.recipient}</span>
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
            Parcel No.
          </p>
          <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
            {data.parcelNumber}
          </p>
          {data.estimatedDelivery && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                Est. Delivery
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-end gap-1">
                <Clock className="size-3.5" />
                {fmtDateShort(data.estimatedDelivery)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live pulse indicator */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-black/5 dark:border-white/5">
        <span className={`size-2 rounded-full animate-pulse ${palette.dot}`} />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {data.status === 'delivered'
            ? 'Parcel has been successfully delivered.'
            : data.status === 'exception'
            ? 'There is an issue with your delivery. Contact DPD support.'
            : 'Tracking information is live and updated by DPD.'}
        </p>
      </div>
    </div>
  )
}

function ProgressPipeline({ status }: { status: DpdStatus }) {
  const isException = status === 'exception'
  const isPickup = status === 'pickup_ready'

  // For pickup_ready, show a special branch rather than standard pipeline
  const steps = PIPELINE_STEPS.filter((s) => {
    if (!isPickup) return !s.key.includes('pickup_ready')
    return !s.key.includes('out_for_delivery')
  })

  const currentIdx = isException ? -1 : steps.findIndex((s) => s.key.includes(status))

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5">
        Delivery Progress
      </p>

      {isException && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3">
          <AlertTriangle className="size-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            A delivery exception has occurred. DPD will attempt re-delivery or contact you.
          </p>
        </div>
      )}

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-start gap-0">
        {steps.map((step, idx) => {
          const isDone = !isException && idx < currentIdx
          const isCurrent = !isException && idx === currentIdx
          const Icon = step.icon
          const isLast = idx === steps.length - 1

          return (
            <div key={step.label} className="flex flex-1 flex-col items-center">
              {/* Icon + connector line */}
              <div className="flex w-full items-center">
                {/* Left line */}
                <div
                  className={`h-0.5 flex-1 transition-all duration-500 ${idx === 0 ? 'invisible' : isDone || isCurrent ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                />
                {/* Circle */}
                <div
                  className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    isDone
                      ? 'border-red-500 bg-red-500 text-white'
                      : isCurrent
                      ? 'border-red-500 bg-white dark:bg-slate-900 text-red-500 scale-110 shadow-md shadow-red-100 dark:shadow-red-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                </div>
                {/* Right line */}
                <div
                  className={`h-0.5 flex-1 transition-all duration-500 ${isLast ? 'invisible' : isDone ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                />
              </div>
              {/* Label */}
              <p
                className={`mt-2 text-center text-[11px] font-semibold leading-tight transition-colors ${
                  isCurrent
                    ? 'text-red-600 dark:text-red-400'
                    : isDone
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.shortLabel}
              </p>
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="flex sm:hidden flex-col gap-0">
        {steps.map((step, idx) => {
          const isDone = !isException && idx < currentIdx
          const isCurrent = !isException && idx === currentIdx
          const Icon = step.icon
          const isLast = idx === steps.length - 1

          return (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    isDone
                      ? 'border-red-500 bg-red-500 text-white'
                      : isCurrent
                      ? 'border-red-500 bg-white dark:bg-slate-900 text-red-500 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[28px] my-1 rounded-full transition-all duration-500 ${isDone ? 'bg-red-400' : 'bg-slate-200 dark:bg-slate-700'}`}
                  />
                )}
              </div>
              <div className={`${isLast ? 'pb-0' : 'pb-5'} flex flex-col justify-center`}>
                <p
                  className={`text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'text-red-600 dark:text-red-400'
                      : isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventTimeline({ events }: { events: DpdEvent[] }) {
  const [expanded, setExpanded] = useState(false)
  const INITIAL_SHOW = 4
  const visible = expanded ? events : events.slice(0, INITIAL_SHOW)
  const hasMore = events.length > INITIAL_SHOW

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Event History
        </p>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {events.length} events
        </span>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />

        <div className="space-y-4">
          {visible.map((ev, idx) => {
            const isFirst = idx === 0
            const descLower = ev.description.toLowerCase()
            const isDelivered = descLower.includes('deliver') || descLower.includes('pristatyta')
            const isException = descLower.includes('exception') || descLower.includes('failed') || descLower.includes('klaida')

            return (
              <div key={idx} className="flex gap-4 relative">
                {/* Dot on timeline */}
                <div
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isDelivered
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : isException
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600'
                      : isFirst
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'
                  }`}
                >
                  {isDelivered ? (
                    <CheckCircle2 className="size-4" />
                  ) : isException ? (
                    <AlertTriangle className="size-4" />
                  ) : isFirst ? (
                    <PackageOpen className="size-4" />
                  ) : (
                    <Truck className="size-3.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  <p
                    className={`text-sm font-semibold leading-snug ${
                      isFirst ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {ev.description}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {ev.timestamp && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {fmtDate(ev.timestamp)}
                      </p>
                    )}
                    {ev.location && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <MapPin className="size-2.5" />
                        {ev.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3.5" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" /> Show {events.length - INITIAL_SHOW} more events
            </>
          )}
        </button>
      )}
    </div>
  )
}

// ─── Empty / Error states ─────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
        <Package className="size-8 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
        Track your DPD parcel
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        Enter your DPD parcel number or Asian Groceries order ticket (AG-XXXX-XXXX) above to see live tracking information.
      </p>
    </div>
  )
}

function ErrorCard({ error }: { error: ErrorState }) {
  const isNotFound =
    error.type === 'ORDER_NOT_FOUND' || error.type === 'PARCEL_NOT_FOUND'
  const isPending = error.type === 'DPD_NOT_ASSIGNED'
  const isServiceDown = error.type === 'SERVICE_UNAVAILABLE'

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
      <div
        className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl ${
          isPending
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'
            : isServiceDown
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-500'
        }`}
      >
        {isPending ? (
          <Clock className="size-7" />
        ) : isServiceDown ? (
          <RotateCcw className="size-7" />
        ) : (
          <AlertTriangle className="size-7" />
        )}
      </div>

      {isPending && error.type === 'DPD_NOT_ASSIGNED' && error.orderStatus && (
        <span className="inline-block mb-3 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40">
          Order status: {error.orderStatus}
        </span>
      )}

      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
        {isNotFound
          ? 'Parcel Not Found'
          : isPending
          ? 'DPD Tracking Not Yet Active'
          : isServiceDown
          ? 'Tracking Service Unavailable'
          : 'Something went wrong'}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {error.message}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DpdTracker({ initialTicket = '' }: { initialTicket?: string }) {
  const [inputValue, setInputValue] = useState(initialTicket)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DpdTrackResponse | null>(null)
  const [error, setError] = useState<ErrorState | null>(null)
  const hasSearched = useRef(false)

  // Auto-search if a ticket was passed in the URL
  useEffect(() => {
    if (initialTicket && !hasSearched.current) {
      hasSearched.current = true
      doSearch(initialTicket)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicket])

  async function doSearch(value: string) {
    const query = value.trim()
    if (!query) return

    setLoading(true)
    setData(null)
    setError(null)

    try {
      const res = await fetch(`/api/dpd/track?parcel=${encodeURIComponent(query)}`)
      const json = await res.json()

      if (!res.ok) {
        const errType = json.error ?? 'GENERIC'
        setError({
          type: errType as ErrorState['type'],
          message: json.message ?? 'An unexpected error occurred. Please try again.',
          ...(errType === 'DPD_NOT_ASSIGNED' ? { orderStatus: json.orderStatus } : {}),
        } as ErrorState)
        return
      }

      setData(json as DpdTrackResponse)
    } catch {
      setError({
        type: 'GENERIC',
        message: 'Could not connect to the tracking service. Please check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch(inputValue)
  }

  const cityDot = data ? getCityDot(data.destinationCity) : null

  return (
    <section className="relative px-4 pb-16 pt-2 md:px-6">
      <div className="mx-auto max-w-4xl">

        {/* ── Search bar ── */}
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="dpd-tracking-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter DPD parcel number or AG-XXXX-XXXX order ticket"
              aria-label="DPD parcel tracking number"
              autoComplete="off"
              spellCheck={false}
              className="h-13 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 hover:border-slate-300 dark:hover:border-slate-600 placeholder:text-slate-400"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !inputValue.trim()}
            id="dpd-track-button"
            className="h-13 rounded-xl px-7 font-semibold bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Track Parcel'
            )}
          </Button>
        </form>

        <p className="mt-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
          Powered by{' '}
          <span className="font-bold text-red-600 dark:text-red-500">DPD</span>{' '}
          Interconnector — real-time courier tracking
        </p>

        {/* ── Result or empty state ── */}
        {!loading && !data && !error && <EmptyState />}
        {!loading && error && <ErrorCard error={error} />}

        {data && !loading && (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
            {/* Status banner */}
            <StatusBanner data={data} />

            {/* Progress pipeline */}
            <ProgressPipeline status={data.status} />

            {/* Map + Events side by side on large screens */}
            <div className="grid gap-4 lg:grid-cols-5">
              {/* Lithuania map */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                  Delivery Region — Lithuania
                </p>
                <div className="flex-1 flex items-center">
                  <LithuaniaFlagMap cityDot={cityDot} />
                </div>
                {cityDot && (
                  <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                    <MapPin className="size-3 text-red-500" />
                    Delivering to <span className="font-semibold text-slate-700 dark:text-slate-200 ml-1">{cityDot.label}</span>
                  </p>
                )}
              </div>

              {/* Event timeline */}
              <div className="lg:col-span-3">
                {data.events.length > 0 ? (
                  <EventTimeline events={data.events} />
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 h-full flex flex-col items-center justify-center text-center shadow-sm">
                    <Clock className="size-8 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      No tracking events yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Events will appear once the parcel is scanned by DPD.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
