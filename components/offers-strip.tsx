'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useTranslation } from '@/lib/translation-context'
import Link from 'next/link'
import {
  Flame, Layers, Leaf, Coffee, Candy, Milk,
  Tag, ChevronRight,
  type LucideIcon,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Offer {
  id?: string
  icon: string         // Lucide icon name key, e.g. "Flame"
  title: string
  subtitle: string
  badgeColor: string   // hex, e.g. "#EF4444"
  href: string
  order: number
  enabled: boolean
}

// ─── Icon map — maps string key → LucideIcon component ───────────────────────
// Admin stores the key name; storefront renders the component
export const OFFER_ICON_MAP: Record<string, LucideIcon> = {
  Flame,
  Layers,
  Leaf,
  Coffee,
  Candy,
  Milk,
  Tag,
}

// ─── Fallback data (shown until admin creates offers in Firestore) ─────────────
const FALLBACK_OFFERS: (Offer & { id: string })[] = [
  { id: 'f0', icon: 'Flame',  title: 'Spice Bundles',   subtitle: 'Up to 30% off',    badgeColor: '#EF4444', href: '/?category=Spices',             order: 0, enabled: true },
  { id: 'f1', icon: 'Layers', title: 'Basmati Rice',    subtitle: 'Buy 2 Save 15%',   badgeColor: '#F97316', href: '/?category=Rice+%26+Grains',    order: 1, enabled: true },
  { id: 'f2', icon: 'Leaf',   title: 'Lentils & Dal',   subtitle: 'From €1.49',       badgeColor: '#10B981', href: '/?category=Lentils+%26+Pulses', order: 2, enabled: true },
  { id: 'f3', icon: 'Milk',   title: 'Dairy & Paneer',  subtitle: 'Fresh arrivals',   badgeColor: '#3B82F6', href: '/?category=Dairy',              order: 3, enabled: true },
  { id: 'f4', icon: 'Coffee', title: 'Teas & Chai',     subtitle: '3 for 2 offer',    badgeColor: '#8B5CF6', href: '/?category=Beverages',          order: 4, enabled: true },
  { id: 'f5', icon: 'Candy',  title: 'Indian Sweets',   subtitle: 'Festival specials', badgeColor: '#EC4899', href: '/?category=Snacks+%26+Sweets', order: 5, enabled: true },
]

// ─── OfferCard ─────────────────────────────────────────────────────────────────
function OfferCard({ offer }: { offer: Offer & { id: string } }) {
  const { td } = useTranslation()
  const hex = offer.badgeColor || '#F97316'
  const Icon = OFFER_ICON_MAP[offer.icon] ?? Tag

  return (
    <Link
      href={offer.href}
      className="group relative flex-shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97]"
      style={{
        width: 'clamp(100px, 22vw, 136px)',
        minHeight: '112px',
        background: `linear-gradient(145deg, ${hex}1A 0%, ${hex}0D 100%)`,
        border: `1.5px solid ${hex}2E`,
        boxShadow: `0 2px 12px ${hex}14`,
        padding: '14px 10px',
        textDecoration: 'none',
      }}
      aria-label={`${offer.title}: ${offer.subtitle}`}
    >
      {/* Soft glow blob */}
      <span
        className="absolute top-1 left-1/2 -translate-x-1/2 rounded-full blur-2xl opacity-40 pointer-events-none transition-opacity duration-300 group-hover:opacity-60"
        style={{ width: 52, height: 52, background: hex }}
        aria-hidden
      />

      {/* Icon */}
      <span
        className="relative z-10 flex items-center justify-center rounded-xl p-2 transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${hex}22` }}
      >
        <Icon
          className="size-5 sm:size-6 shrink-0"
          style={{ color: hex }}
          strokeWidth={2}
        />
      </span>

      {/* Title */}
      <span
        className="relative z-10 text-center font-bold text-[11px] sm:text-[12px] leading-tight"
        style={{ color: 'var(--foreground)' }}
      >
        {td(offer.title)}
      </span>

      {/* Discount badge */}
      <span
        className="relative z-10 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white leading-none"
        style={{ background: hex }}
      >
        {td(offer.subtitle)}
      </span>

      {/* Hover border glow */}
      <span
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1.5px ${hex}55` }}
        aria-hidden
      />
    </Link>
  )
}

// ─── OffersStrip ───────────────────────────────────────────────────────────────
export function OffersStrip() {
  const { td } = useTranslation()
  const [offers, setOffers] = useState<(Offer & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(clientDb, 'offers'),
          where('enabled', '==', true),
          orderBy('order', 'asc'),
        )
        const snap = await getDocs(q)
        setOffers(
          snap.empty
            ? FALLBACK_OFFERS
            : snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer & { id: string }))
        )
      } catch {
        setOffers(FALLBACK_OFFERS)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section
      className="w-full px-4 sm:px-6 md:px-8 pt-4 pb-2"
      aria-label="Offers and discounts"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold" style={{ color: 'var(--foreground)' }}>
          <Tag className="size-4 shrink-0" style={{ color: 'var(--primary)' }} />
          <span>{td('Offers & Discounts')}</span>
        </h2>
        <Link
          href="/?sort=sale"
          className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold transition-opacity duration-200 hover:opacity-70"
          style={{ color: 'var(--primary)' }}
        >
          {td('See all')}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl animate-pulse"
              style={{
                width: 'clamp(100px,22vw,136px)',
                minHeight: 112,
                background: 'var(--muted)',
              }}
            />
          ))}
        </div>
      )}

      {/* Cards */}
      {!loading && offers.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-x-visible"
          role="list"
        >
          {offers.map((offer) => (
            <div key={offer.id} role="listitem">
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
