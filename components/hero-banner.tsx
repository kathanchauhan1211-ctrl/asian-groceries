'use client'

import { Bus, Clock, Leaf, MapPin, ShieldCheck, Sparkles, Store, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/translation-context'

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
  { icon: Store, label: 'Pickup In-Store', desc: 'Šaltinių g. 22' },
  { icon: Bus, label: 'Bus Delivery', desc: 'All LT cities' },
  { icon: Package, label: 'Pre-Order', desc: 'Reserve your items' },
  { icon: ShieldCheck, label: 'Halal Certified', desc: 'All products' },
]

export function HeroBanner({ onTrack }: { onTrack: () => void }) {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden">
      {/* Premium bold tagline strip */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-2">
            <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-400">
              <Store className="size-3.5" />
              <span>Order Online</span>
            </div>
            <div className="h-4 w-px bg-slate-600 shrink-0" />
            <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/80">
              <MapPin className="size-3.5 text-orange-400" />
              <span>Pickup at Šaltinių g. 22, Vilnius</span>
            </div>
            <div className="h-4 w-px bg-slate-600 shrink-0" />
            <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/80">
              <Bus className="size-3.5 text-orange-400" />
              <span>Delivered to Any City in Lithuania</span>
            </div>
            <div className="h-4 w-px bg-slate-600 shrink-0" />
            <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-400">
              <Package className="size-3.5" />
              <span>Pre-Orders Welcome</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 md:px-6 md:py-12 lg:grid-cols-2 lg:py-14">
        {/* Copy */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <MapPin className="size-3.5" />
            Vilnius&apos;s #1 South Asian Online Store
          </span>

          <h1 className="mt-4 font-serif text-3xl font-semibold leading-[1.08] tracking-tight text-foreground text-balance sm:text-4xl md:text-5xl lg:text-[3.2rem]">
            Authentic{' '}
            <span className="text-spice-gradient">South Asian</span>{' '}
            flavours — order online, pickup or ship nationwide.
          </h1>

          {/* Bold business copy */}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
            India, Pakistan & Sri Lanka&apos;s finest staples at your fingertips. Walk in for same-day pickup at our Vilnius store, or send your order to any city in Lithuania via the{' '}
            <strong className="text-slate-800">Autobusų Stotis bus network</strong>.
          </p>

          {/* Standalone bold tagline */}
          <p className="mt-3 text-sm font-bold text-slate-700 italic">
            &ldquo;Pre-order. Pick up. Or take the bus.&rdquo;
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-11 rounded-full px-6 text-sm font-bold shadow-lg sm:h-12 sm:px-7 sm:text-base"
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Sparkles className="size-4" /> Shop the Pantry
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onTrack}
              className="h-11 rounded-full px-5 text-sm shadow-sm sm:h-12 sm:px-6 sm:text-base"
            >
              <Bus className="size-4" /> Track a Parcel
            </Button>
          </div>

          {/* Trust badges — horizontal scroll on mobile */}
          <div className="mt-6 flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible">
            {TRUST.map((item) => (
              <div key={item.label} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:shrink">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 whitespace-nowrap">{item.label}</p>
                  <p className="text-[10px] text-slate-500 whitespace-nowrap">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map — hidden on mobile, shown on tablet+ */}
        <div className="relative hidden sm:block">
          {/* Store flag */}
          <div className="pointer-events-none absolute -left-10 -top-6 z-20 hidden lg:block">
            <div className="flag-sway flex flex-col items-center">
              <div className="relative flex h-56 w-[4.5rem] flex-col items-center rounded-t-full rounded-b-lg overflow-hidden shadow-xl">
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
                  <span className="flex size-12 items-center justify-center rounded-full bg-card shadow-md ring-2 ring-primary-foreground/20">
                    <img src="/logo.png" alt="" className="size-10 object-contain" aria-hidden />
                  </span>
                  <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground" style={{ writingMode: 'vertical-rl' }}>
                    Asian Groceries
                  </span>
                  <span className="text-[8px] font-medium uppercase tracking-[0.15em] text-primary-foreground/70" style={{ writingMode: 'vertical-rl' }}>
                    Since Vilnius
                  </span>
                  <span className="mt-auto block w-2.5 h-2.5 rotate-45 bg-accent/70 rounded-sm" />
                </div>
              </div>
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
      {/* Ornate Indian trim divider */}
      <div className="desi-trim" aria-hidden />
    </section>
  )
}
