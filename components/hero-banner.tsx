'use client'

import { Bus, Clock, Leaf, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Approximate relative positions on the map illustration (percent)
const VILNIUS = { x: 72, y: 68 }
const CITIES = [
  { name: 'Kaunas', x: 52, y: 55 },
  { name: 'Klaipėda', x: 14, y: 34 },
  { name: 'Šiauliai', x: 40, y: 26 },
  { name: 'Panevėžys', x: 54, y: 32 },
  { name: 'Alytus', x: 58, y: 82 },
]

const TRUST = [
  { icon: Clock, label: 'Same / Next-Day' },
  { icon: ShieldCheck, label: 'Halal Certified' },
  { icon: Leaf, label: 'Fresh Weekly' },
]

export function HeroBanner({ onTrack }: { onTrack: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:px-6 lg:grid-cols-2 lg:py-14">
        {/* Copy */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <MapPin className="size-3.5" /> Based in Vilnius · Delivering nationwide
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance md:text-5xl lg:text-[3.5rem]">
            Authentic{' '}
            <span className="text-spice-gradient">South Asian</span>{' '}
            flavors, hand-delivered to your city&apos;s bus station.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            India, Pakistan &amp; Sri Lanka&apos;s finest staples — shipped across Lithuania via the
            Autobusų Stotis courier network. Same-day or next-day, straight to your nearest station.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 rounded-full px-7 text-base shadow-lg"
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Sparkles className="size-4" /> Shop the Pantry
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onTrack}
              className="h-12 rounded-full px-6 text-base shadow-sm"
            >
              <Bus className="size-4" /> Track a Parcel
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {TRUST.map((t) => (
              <div key={t.label} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground shadow-sm">
                  <t.icon className="size-4" />
                </span>
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="relative">
          {/* Enhanced Indian-themed storefront flag */}
          <div className="pointer-events-none absolute -left-10 -top-6 z-20 hidden lg:block">
            <div className="flag-sway flex flex-col items-center">
              {/* Flag body — with Indian tricolor accent & ornate design */}
              <div className="relative flex h-56 w-[4.5rem] flex-col items-center rounded-t-full rounded-b-lg overflow-hidden shadow-xl">
                {/* Tricolor accent stripe at top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 z-10">
                  <div className="h-full w-full flex">
                    <div className="flex-1 bg-[#FF9933]" />
                    <div className="flex-1 bg-white" />
                    <div className="flex-1 bg-[#138808]" />
                  </div>
                </div>
                {/* Main flag background */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary to-primary/90" />
                {/* Shimmer overlay */}
                <div className="flag-shimmer absolute inset-0 z-[1]" />
                {/* Fabric ripple layer */}
                <div className="flag-ripple absolute inset-0 z-[2]" />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col items-center py-5 gap-2">
                  {/* Decorative kalash-inspired top ornament */}
                  <div className="flex flex-col items-center gap-0.5 mb-1">
                    <span className="block w-3 h-3 rounded-full bg-accent/80 shadow-sm" />
                    <span className="block w-5 h-0.5 rounded-full bg-primary-foreground/40" />
                  </div>

                  {/* Logo circle */}
                  <span className="flex size-12 items-center justify-center rounded-full bg-card shadow-md ring-2 ring-primary-foreground/20">
                    <img src="/logo.png" alt="" className="size-10 object-contain" aria-hidden />
                  </span>

                  {/* Vertical text */}
                  <span
                    className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    Asian Groceries
                  </span>
                  <span
                    className="text-[8px] font-medium uppercase tracking-[0.15em] text-primary-foreground/70"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    Since Vilnius
                  </span>

                  {/* Bottom decorative diamond */}
                  <span className="mt-auto block w-2.5 h-2.5 rotate-45 bg-accent/70 rounded-sm" />
                </div>
              </div>

              {/* Ornamental pole finial — small kalash */}
              <div className="flex flex-col items-center">
                <span className="block w-4 h-1 rounded-full bg-accent/60" />
                <span className="h-18 w-1.5 rounded-full bg-gradient-to-b from-muted-foreground/50 via-muted-foreground/30 to-muted-foreground/20" />
                <span className="block w-3 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-xl shadow-primary/8">
            <div className="relative size-full">
              <img
                src="/lithuania-map.png"
                alt="Map of Lithuania showing delivery routes from Vilnius"
                className="size-full object-contain opacity-90"
              />

              {/* Static City pins */}
              {[...CITIES, { name: 'Vilnius HQ', ...VILNIUS }].map((c) => (
                <div
                  key={c.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                >
                  <span className={`block size-2.5 rounded-full ${c.name === 'Vilnius HQ' ? 'bg-primary ring-4 ring-primary/20 size-3.5' : 'bg-accent ring-2 ring-white'} shadow-sm`} />
                  <span className={`mt-1 whitespace-nowrap rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-bold ${c.name === 'Vilnius HQ' ? 'text-primary' : 'text-slate-700'} shadow-sm border border-slate-200`}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Ornate Indian trim divider */}
      <div className="desi-trim" aria-hidden />
    </section>
  )
}
