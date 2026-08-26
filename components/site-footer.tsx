import { Bus, Mail, MapPin, Phone } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="relative border-t-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] mt-auto" style={{ backgroundColor: 'var(--im-navy-mid, #1E3A8A)', borderColor: 'var(--im-orange, #F97316)' }}>
      {/* Content grid - reduced padding for a smaller footer */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-8">
          
          {/* Brand block */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-full bg-white shadow-md">
                <img src="/logo-icon.png" alt="IndianMarket logo" className="size-8 object-contain" />
              </span>
              <span className="leading-none">
                <span className="block font-serif text-base font-bold text-white">IndianMarket</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/70 max-w-xs">
              Order online and pick up in-store, or ship to any city in Lithuania via the bus station network.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-6 md:col-span-3">
            <div>
              <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">Shop</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-white/70">
                {['Spices', 'Grains', 'Lentils', 'Frozen', 'Sweets'].map((c) => (
                  <li key={c}><a href="#shop" className="hover:text-orange-400">{c}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">Contact</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-white/70">
                <li className="flex items-center gap-2"><MapPin className="size-3 text-orange-400" /> Gedimino pr. 1, Vilnius</li>
                <li className="flex items-center gap-2"><Phone className="size-3 text-orange-400" /> +370 600 00000</li>
                <li className="flex items-center gap-2"><Mail className="size-3 text-orange-400" /> labas@indianmarket.lt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — deepest navy */}
      <div style={{ backgroundColor: 'var(--im-navy, #1A365D)' }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-col items-center justify-between gap-1 text-[10px] text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} IndianMarket. All rights reserved.</p>
          <p>Made with care in Vilnius, Lithuania 🇱🇹</p>
        </div>
      </div>
    </footer>
  )
}
