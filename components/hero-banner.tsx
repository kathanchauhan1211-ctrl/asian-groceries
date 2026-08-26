'use client'

import { MapPin } from 'lucide-react'
import { LogoSVG } from '@/components/logo-svg'

// Approximate relative positions on the map illustration (percent)
const VILNIUS = { x: 72, y: 68 }
const CITIES = [
  { name: 'Kaunas', x: 52, y: 55 },
  { name: 'Klaipėda', x: 14, y: 34 },
  { name: 'Šiauliai', x: 40, y: 26 },
  { name: 'Panevėžys', x: 54, y: 32 },
  { name: 'Alytus', x: 58, y: 82 },
]

export function HeroBanner({ onTrack }: { onTrack: () => void }) {
  return (
    <section className="relative overflow-hidden bg-background dark:bg-[#0F1117]">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 py-8 md:flex-row md:items-center md:gap-10 md:py-10 lg:py-12">

          {/* ── Brand block (left) ── */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left flex-1 min-w-0">
            {/* Location pill */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary mb-4">
              <MapPin className="size-3" />
              Vilnius · Lithuania
            </span>

            {/* Brand name */}
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              IndianMarket
              <span className="text-primary">.lt</span>
            </h1>

            {/* 3-word slogan */}
            <p className="mt-2 text-base font-medium text-muted-foreground tracking-wide sm:text-lg">
              Taste the Subcontinent
            </p>

            {/* Subtle flag stripe */}
            <div className="mt-5 flex gap-0 overflow-hidden rounded-full h-1.5 w-24 shadow-sm">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white border-y border-slate-200 dark:border-none" />
              <div className="flex-1 bg-[#138808]" />
            </div>
          </div>

          {/* ── Flag + Map (right) ── */}
          <div className="relative flex flex-row items-start gap-4 sm:gap-6 flex-1 justify-center md:justify-end">
            {/* Store flag */}
            <div className="pointer-events-none hidden lg:flex flex-col items-center shrink-0 self-start mt-2">
              <div className="flag-sway flex flex-col items-center">
                <div className="relative flex h-48 w-[4rem] flex-col items-center rounded-t-full rounded-b-lg overflow-hidden shadow-xl">
                  <div className="absolute top-0 left-0 right-0 h-1.5 z-10">
                    <div className="h-full w-full flex">
                      <div className="flex-1 bg-[#FF9933]" />
                      <div className="flex-1 bg-white" />
                      <div className="flex-1 bg-[#138808]" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary/90" />
                  <div className="flag-shimmer absolute inset-0 z-[1]" />
                  <div className="flag-ripple absolute inset-0 z-[2]" />
                  <div className="relative z-10 flex h-full flex-col items-center py-5 gap-2">
                    <div className="flex flex-col items-center gap-0.5 mb-1">
                      <span className="block w-3 h-3 rounded-full bg-accent/80 shadow-sm" />
                      <span className="block w-5 h-0.5 rounded-full bg-primary-foreground/40" />
                    </div>
                    <span className="flex size-11 items-center justify-center rounded-full shadow-md ring-2 ring-primary-foreground/20" style={{ background: 'rgba(255,255,255,0.12)' }}>
                      <LogoSVG size={32} />
                    </span>
                    <span className="mt-auto block w-2.5 h-2.5 rotate-45 bg-accent/70 rounded-sm" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="block w-4 h-1 rounded-full bg-accent/60" />
                  <span className="h-16 w-1.5 rounded-full bg-gradient-to-b from-muted-foreground/50 via-muted-foreground/30 to-muted-foreground/20" />
                  <span className="block w-3 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              </div>
            </div>

            {/* Lithuania map */}
            <div className="relative mx-auto aspect-square w-full max-w-[340px] md:max-w-[400px] overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-xl shadow-primary/8">
              <div className="relative size-full">
                <img
                  src="/lithuania-map.png"
                  alt="Map of Lithuania showing delivery routes from Vilnius"
                  className="size-full object-contain opacity-90"
                />
                {/* City pins */}
                {[...CITIES, { name: 'Vilnius HQ', ...VILNIUS }].map((c) => (
                  <div
                    key={c.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  >
                    <span className={`block rounded-full ${c.name === 'Vilnius HQ' ? 'size-3.5 bg-primary ring-4 ring-primary/20' : 'size-2.5 bg-accent ring-2 ring-white'} shadow-sm`} />
                    <span className={`mt-1 whitespace-nowrap rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-bold ${c.name === 'Vilnius HQ' ? 'text-primary' : 'text-slate-700'} shadow-sm border border-slate-200`}>
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* Ornate Indian trim divider */}
      <div className="desi-trim" aria-hidden />
    </section>
  )
}
