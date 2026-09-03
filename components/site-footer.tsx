import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { LogoSVG } from '@/components/logo-svg'

// Category → query param mapping for functional footer links
const SHOP_LINKS = [
  { label: 'Spices',  href: '/?category=Spices' },
  { label: 'Grains',  href: '/?category=Rice+%26+Grains' },
  { label: 'Lentils', href: '/?category=Lentils+%26+Pulses' },
  { label: 'Frozen',  href: '/?category=Frozen+Foods' },
  { label: 'Sweets',  href: '/?category=Snacks+%26+Sweets' },
]

// Social media links
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/asiangroceriesvln?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw=',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    color: 'hover:text-pink-400',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/azijietiskimaistoproduktai',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: 'hover:text-blue-400',
  },
]

export function SiteFooter() {
  return (
    <footer className="relative border-t-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] mt-auto" style={{ backgroundColor: 'var(--im-navy-mid, #1E3A8A)', borderColor: 'var(--im-orange, #F97316)' }}>
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-8">

          {/* Brand block */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center">
                <LogoSVG size={36} />
              </span>
              <span className="leading-none">
                <span className="block font-serif text-base font-bold text-white">Asian Groceries</span>
                <span className="block text-[10px] text-white/50 tracking-wide">Vilnius, Lithuania</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/80 max-w-xs">
              Authentic Asian & South Asian groceries. Order online and pick up in-store, or ship anywhere in Lithuania via the bus station network.
            </p>

            {/* Social media icons */}
            <div className="mt-4 flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`flex size-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:scale-110 ${s.color}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-6 md:col-span-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shop</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-white/80">
                {SHOP_LINKS.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="hover:text-orange-400 transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Contact</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-white/80">
                <li className="flex items-center gap-2"><MapPin className="size-3 text-orange-400 shrink-0" /> Šaltinių g. 22, Vilnius</li>
                <li className="flex items-center gap-2">
                  <Phone className="size-3 text-orange-400 shrink-0" />
                  <a href="tel:+37061676111" className="hover:text-orange-400 transition-colors">+370 616 76111</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-3 text-orange-400 shrink-0" />
                  <a href="mailto:eshop@asiangroceries.lt" className="hover:text-orange-400 transition-colors">
                    eshop@asiangroceries.lt
                  </a>
                </li>
              </ul>

              {/* Follow us label */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Follow Us</h3>
                <div className="flex items-center gap-3">
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs text-white/60 flex items-center gap-1 transition-colors ${s.color}`}
                    >
                      {s.icon}
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ backgroundColor: 'var(--im-navy, #1A365D)' }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex flex-col items-center justify-between gap-1 text-[11px] text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Asian Groceries Vilnius. All rights reserved.</p>
          <p>Made with care in Vilnius, Lithuania 🇱🇹</p>
        </div>
      </div>
    </footer>
  )
}
