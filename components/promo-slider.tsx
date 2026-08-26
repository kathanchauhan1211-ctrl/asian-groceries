'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Slide data ───────────────────────────────────────────────────────────────
// Replace `bg` with a real image URL (e.g. `/banners/spices.jpg`) when ready.
// The `img` field is optional — if provided it is used as a background image.
const SLIDES = [
  {
    id: 1,
    bg: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 40%, #EA580C 70%, #F97316 100%)',
    label: '🌶️ Spices & Masalas',
    headline: 'Authentic Spice Blends',
    sub: 'From India, Pakistan & Sri Lanka',
    cta: 'Shop Spices',
    href: '/?category=Spices',
    accent: '#FED7AA',
  },
  {
    id: 2,
    bg: 'linear-gradient(135deg, #1E3A5F 0%, #1D4ED8 40%, #2563EB 70%, #3B82F6 100%)',
    label: '🌾 Rice & Grains',
    headline: 'Premium Basmati Rice',
    sub: 'Long-grain aged varieties',
    cta: 'Shop Rice',
    href: '/?category=Rice+%26+Grains',
    accent: '#BFDBFE',
  },
  {
    id: 3,
    bg: 'linear-gradient(135deg, #4A044E 0%, #7E22CE 40%, #A855F7 70%, #C084FC 100%)',
    label: '🍬 Sweets & Mithai',
    headline: 'Festival Sweets',
    sub: 'Ladoo, Barfi, Gulab Jamun & more',
    cta: 'Shop Sweets',
    href: '/?category=Sweets',
    accent: '#F3E8FF',
  },
  {
    id: 4,
    bg: 'linear-gradient(135deg, #064E3B 0%, #065F46 40%, #059669 70%, #10B981 100%)',
    label: '🫖 Tea & Drinks',
    headline: 'Masala Chai & More',
    sub: 'Premium teas from the subcontinent',
    cta: 'Shop Teas',
    href: '/?category=Tea+%26+Drinks',
    accent: '#A7F3D0',
  },
  {
    id: 5,
    bg: 'linear-gradient(135deg, #78350F 0%, #92400E 40%, #B45309 70%, #D97706 100%)',
    label: '🥘 Ready Meals',
    headline: 'Quick & Authentic',
    sub: 'Ready-to-eat South Asian meals',
    cta: 'Shop Ready Meals',
    href: '/?category=Ready+Meals',
    accent: '#FEF3C7',
  },
]

const AUTO_INTERVAL = 4500

export function PromoSlider() {
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = SLIDES.length

  const goTo = useCallback((idx: number) => {
    setActive(((idx % total) + total) % total)
  }, [total])

  const next = useCallback(() => goTo(active + 1), [active, goTo])
  const prev = useCallback(() => goTo(active - 1), [active, goTo])

  // Auto-advance
  useEffect(() => {
    if (paused) { timerRef.current && clearInterval(timerRef.current); return }
    timerRef.current = setInterval(next, AUTO_INTERVAL)
    return () => { timerRef.current && clearInterval(timerRef.current) }
  }, [next, paused])

  // Touch / pointer drag
  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    setDragStart(e.clientX)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return
    const delta = e.clientX - dragStart
    if (Math.abs(delta) > 40) delta < 0 ? next() : prev()
    setDragging(false)
  }

  const slide = SLIDES[active]

  return (
    <div className="w-full overflow-hidden" style={{ borderBottom: '1px solid #E5E7EB' }}>
      <div
        className="relative w-full select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={() => setDragging(false)}
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      {/* Slides */}
      <div
        className="relative h-[220px] sm:h-[280px] md:h-[340px] lg:h-[380px] w-full transition-all duration-700"
        style={{ background: slide.bg }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -right-20 -top-20 rounded-full opacity-10"
            style={{ width: 400, height: 400, background: slide.accent }}
          />
          <div
            className="absolute -left-10 -bottom-10 rounded-full opacity-8"
            style={{ width: 280, height: 280, background: slide.accent }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-10 md:px-14 max-w-3xl">
          {/* Label pill */}
          <span
            className="mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.18)', color: slide.accent }}
          >
            {slide.label}
          </span>

          {/* Headline */}
          <h2 className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {slide.headline}
          </h2>
          <p className="mt-2 text-sm font-medium sm:text-base" style={{ color: slide.accent }}>
            {slide.sub}
          </p>

          {/* CTA */}
          <a
            href={slide.href}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:opacity-90 hover:scale-[1.03]"
            style={{ background: slide.accent, color: '#1C1C1C' }}
            onClick={(e) => e.stopPropagation()}
          >
            {slide.cta} →
          </a>
        </div>

        {/* Slide number */}
        <div
          className="absolute right-5 bottom-4 text-[11px] font-semibold tabular-nums"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 22 : 7,
              height: 7,
              background: i === active ? '#fff' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>

      {/* Arrow buttons — desktop only */}
      <button
        aria-label="Previous slide"
        onClick={(e) => { e.stopPropagation(); prev() }}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex size-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(0,0,0,0.25)', color: '#fff' }}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        aria-label="Next slide"
        onClick={(e) => { e.stopPropagation(); next() }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex size-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(0,0,0,0.25)', color: '#fff' }}
      >
        <ChevronRight className="size-5" />
      </button>
      </div>
    </div>
  )
}
