'use client'

import { ShoppingBag, Bus, User, MessageSquare, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = 'shop' | 'checkout' | 'track' | 'dashboard' | 'community'

type NavItem = {
  id: Tab
  href: string
  label: string
  icon: any
}

const NAV_ITEMS: NavItem[] = [
  { id: 'shop', href: '/', label: 'Shop', icon: ShoppingBag },
  { id: 'checkout', href: '/checkout', label: 'Checkout', icon: ClipboardList },
  { id: 'track', href: '/track', label: 'Track Parcel', icon: Bus },
  { id: 'dashboard', href: '/dashboard', label: 'My Hub', icon: User },
  { id: 'community', href: '/community', label: 'Community', icon: MessageSquare },
]

export function FloatingNavigation() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white border-t border-slate-200 pb-safe">
      <nav className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center justify-center p-2"
              aria-label={item.label}
            >
              <span
                className={`mb-1 transition-colors duration-200 ${
                  isActive ? 'text-accent' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`size-5 ${isActive ? 'fill-accent/10' : ''}`} />
              </span>

              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-accent font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
