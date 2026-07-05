import { Bus, Mail, MapPin, Phone } from 'lucide-react'
import { SeamlessPattern } from './seamless-pattern'

/* Pre-computed mandala coordinates to avoid SSR/client hydration mismatch
   from floating-point differences in Math.cos/Math.sin */
const MANDALA_LINES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => ({
  x2: Math.round((200 + 180 * Math.cos(angle * Math.PI / 180)) * 100) / 100,
  y2: Math.round((200 + 180 * Math.sin(angle * Math.PI / 180)) * 100) / 100,
}))

const MANDALA_DIAMONDS = [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => ({
  x: Math.round((200 + 120 * Math.cos(angle * Math.PI / 180) - 4) * 100) / 100,
  y: Math.round((200 + 120 * Math.sin(angle * Math.PI / 180) - 4) * 100) / 100,
  cx: Math.round((200 + 120 * Math.cos(angle * Math.PI / 180)) * 100) / 100,
  cy: Math.round((200 + 120 * Math.sin(angle * Math.PI / 180)) * 100) / 100,
}))

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border overflow-hidden">
      {/* Decorative Indian trim at top */}
      <div className="desi-trim" aria-hidden />

      {/* Background gradient — deep saffron */}
      <div className="bg-primary text-primary-foreground relative">
        {/* Bold Indian silhouettes watermark */}
        <SeamlessPattern className="[&_g]:!fill-white" opacity={0.18} />
        
        {/* Faint mandala watermark */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" aria-hidden>
          <svg viewBox="0 0 400 400" className="absolute right-0 bottom-0 w-80 h-80 -mr-20 -mb-20 text-primary-foreground" fill="currentColor">
            <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" />
            {/* Radial lines */}
            {MANDALA_LINES.map((l, i) => (
              <line key={i} x1="200" y1="200" x2={l.x2} y2={l.y2} stroke="currentColor" strokeWidth="0.3" />
            ))}
            {/* Diamond markers */}
            {MANDALA_DIAMONDS.map((d, i) => (
              <rect key={i} x={d.x} y={d.y} width="8" height="8" transform={`rotate(45, ${d.cx}, ${d.cy})`} fill="currentColor" opacity="0.5" />
            ))}
          </svg>
        </div>

        {/* Scattered Indian silhouettes watermark */}
        <div className="indian-icons-pattern absolute inset-0 pointer-events-none" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary-foreground shadow-md">
                  <img src="/logo.png" alt="Asian Groceries logo" className="size-10 object-contain" />
                </span>
                <span className="leading-none">
                  <span className="block font-serif text-lg font-semibold">Asian Groceries</span>
                  <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-primary-foreground/60">
                    Online Store · Vilnius
                  </span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-primary-foreground/65">
                Order online and <strong className="text-white/90">pick up in-store</strong> at Šaltinių g. 22, or ship to any city in Lithuania via the bus station courier network.
              </p>
              {/* Small tricolor accent */}
              <div className="mt-3 flex gap-0.5">
                <span className="h-1 w-6 rounded-full bg-[#FF9933]/60" />
                <span className="h-1 w-6 rounded-full bg-white/40" />
                <span className="h-1 w-6 rounded-full bg-[#138808]/50" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Shop</h3>
              <div className="desi-border mt-2 w-8" />
              <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
                {['Spices', 'Grains', 'Lentils', 'Frozen', 'Sweets'].map((c) => (
                  <li key={c}>
                    <a href="#shop" className="transition-colors duration-200 hover:text-primary-foreground">
                      {c}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Delivery</h3>
              <div className="desi-border mt-2 w-8" />
              <ul className="mt-3 space-y-2 text-sm text-primary-foreground/70">
                <li>
                  <a href="#track" className="transition-colors duration-200 hover:text-primary-foreground">
                    Track a Parcel
                  </a>
                </li>
                <li>Autobusų Stotis Network</li>
                <li>Same / Next-Day Stations</li>
                <li>Pickup Points Nationwide</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Contact</h3>
              <div className="desi-border mt-2 w-8" />
              <ul className="mt-3 space-y-2.5 text-sm text-primary-foreground/70">
                <li className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <MapPin className="size-3.5" />
                  </span>
                  Gedimino pr. 1, Vilnius
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Phone className="size-3.5" />
                  </span>
                  +370 600 00000
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Mail className="size-3.5" />
                  </span>
                  labas@asiangroceries.lt
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/12 pt-6 text-xs text-primary-foreground/55 sm:flex-row">
            <p>© {new Date().getFullYear()} Asian Groceries. All rights reserved.</p>
            <p className="flex items-center gap-1.5">Made with care in Vilnius, Lithuania 🇱🇹</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
