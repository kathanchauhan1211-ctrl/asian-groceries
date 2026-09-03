'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useTranslation } from '@/lib/translation-context'
import { type Slide } from '@/app/admin/slides/page'

const AUTO_MS = 4000
const TRANS_MS = 500

// Reliable fallback images — landscape format, high-res
const FALLBACK_SLIDES: Slide[] = [
  {
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
    brand: 'Aashirvaad',
    label: 'Atta & Flour',
    headline: "India's Most Loved Flour",
    sub: 'Soft rotis every time — authentic stone-ground atta',
    cta: 'Shop Flour',
    href: '/?category=Rice+%26+Grains',
    order: 0,
    enabled: true,
  },
  {
    img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=1600&q=80',
    brand: 'MDH',
    label: 'Spices & Masalas',
    headline: 'Real Taste, Real Spice',
    sub: 'MDH — trusted by generations across South Asia',
    cta: 'Shop Spices',
    href: '/?category=Spices',
    order: 1,
    enabled: true,
  },
  {
    img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&q=80',
    brand: 'TRS',
    label: 'Lentils & Pulses',
    headline: 'Premium Quality Pulses',
    sub: "TRS — the UK's #1 South Asian ingredient brand",
    cta: 'Shop Lentils',
    href: '/?category=Lentils+%26+Pulses',
    order: 2,
    enabled: true,
  },
].map((s, i) => ({ id: `fallback-${i}`, ...s }))

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80'

export function PromoSlider() {
  const [slides, setSlides]       = useState<Slide[]>([])
  const [loading, setLoading]     = useState(true)
  const { td } = useTranslation()

  const [current, setCurrent]     = useState(0)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused]       = useState(false)

  const total = slides.length

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(clientDb, 'slides'),
          where('enabled', '==', true),
          orderBy('order', 'asc'),
        )
        const snap = await getDocs(q)
        setSlides(snap.empty ? FALLBACK_SLIDES : snap.docs.map(d => ({ id: d.id, ...d.data() } as Slide)))
      } catch {
        setSlides(FALLBACK_SLIDES)
      }
      setLoading(false)
    }
    load()
  }, [])

  const goTo = useCallback((idx: number) => {
    if (animating || total === 0) return
    const next = ((idx % total) + total) % total
    setAnimating(true)
    setCurrent(next)
    setTimeout(() => setAnimating(false), TRANS_MS)
  }, [animating, total])

  const goNext = useCallback(() => goTo(current + 1), [current, goTo])
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo])

  // Auto-advance
  useEffect(() => {
    if (paused || total === 0) return
    const t = setTimeout(goNext, AUTO_MS)
    return () => clearTimeout(t)
  }, [current, paused, goNext, total])

  // Touch / swipe
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    // Only trigger if horizontal movement dominates (not a vertical scroll)
    if (Math.abs(dx) > 50 && dy < 60) {
      dx < 0 ? goNext() : goPrev()
    }
  }

  return (
    <>
      <style>{`
        @keyframes kb-zoom { from { transform: scale(1.00); } to { transform: scale(1.06); } }
        @keyframes slide-caption-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Full-width slider shell ── */}
      <section
        className="relative w-full overflow-hidden bg-black"
        style={{ aspectRatio: '21/9', minHeight: '180px', maxHeight: '640px' }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label="Promotional slideshow"
      >
        {/* Loading skeleton */}
        {loading && (
          <div className="absolute inset-0 animate-pulse" style={{ background: 'var(--muted)' }} />
        )}

        {/* Slides */}
        {!loading && total > 0 && slides.map((slide, i) => {
          const isCurrent = i === current
          return (
            <div
              key={slide.id}
              aria-hidden={!isCurrent}
              className="absolute inset-0"
              style={{
                zIndex: isCurrent ? 2 : 1,
                opacity: isCurrent ? 1 : 0,
                transition: `opacity ${TRANS_MS}ms ease-in-out`,
              }}
            >
              {/* Background image */}
              <img
                src={slide.img}
                alt={slide.brand}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  animation: isCurrent && !animating
                    ? `kb-zoom ${AUTO_MS + TRANS_MS}ms ease-in-out forwards`
                    : 'none',
                }}
                onError={(e) => {
                  const img = e.currentTarget
                  if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG
                }}
              />

              {/* Rich gradient overlay — heavy at bottom for text legibility */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.40) 35%, rgba(0,0,0,0.10) 65%, transparent 100%)',
                }}
              />

              {/* Caption bar — bottom */}
              <div
                className="absolute inset-x-0 bottom-0 px-4 sm:px-8 md:px-12 pb-10 sm:pb-12 md:pb-14 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-6"
                style={{
                  animation: isCurrent && !animating ? 'slide-caption-in 0.5s ease-out 0.15s both' : 'none',
                }}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  {/* Category pill */}
                  {slide.label && (
                    <span
                      className="w-fit rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest"
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      {td(slide.label)}
                    </span>
                  )}
                  {/* Headline */}
                  <h2 className="text-white font-bold text-lg sm:text-2xl md:text-3xl lg:text-4xl leading-tight tracking-tight drop-shadow-lg">
                    {td(slide.headline)}
                  </h2>
                  {/* Subtitle */}
                  {slide.sub && (
                    <p className="text-white/70 text-[12px] sm:text-sm md:text-base leading-snug max-w-md">
                      {td(slide.sub)}
                    </p>
                  )}
                </div>

                {/* CTA */}
                {slide.cta && (
                  <a
                    href={slide.href}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full font-bold text-slate-900 text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                    style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
                  >
                    {td(slide.cta)}
                    <span className="text-base leading-none">→</span>
                  </a>
                )}
              </div>
            </div>
          )
        })}

        {/* ── Prev / Next arrows ── */}
        {!loading && total > 1 && (
          <>
            <button
              aria-label="Previous slide"
              onClick={goPrev}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90"
              style={{
                width: 'clamp(36px,5vw,48px)',
                height: 'clamp(36px,5vw,48px)',
                background: 'rgba(0,0,0,0.45)',
                color: '#fff',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <ChevronLeft style={{ width: 'clamp(16px,2.5vw,24px)', height: 'clamp(16px,2.5vw,24px)' }} />
            </button>
            <button
              aria-label="Next slide"
              onClick={goNext}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-90"
              style={{
                width: 'clamp(36px,5vw,48px)',
                height: 'clamp(36px,5vw,48px)',
                background: 'rgba(0,0,0,0.45)',
                color: '#fff',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <ChevronRight style={{ width: 'clamp(16px,2.5vw,24px)', height: 'clamp(16px,2.5vw,24px)' }} />
            </button>
          </>
        )}

        {/* ── Dot indicators — bottom-center ── */}
        {!loading && total > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300 ease-out"
                style={{
                  width: i === current ? 24 : 7,
                  height: 7,
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: i === current ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* ── Slide counter — top-right ── */}
        {!loading && total > 1 && (
          <div
            className="absolute right-4 top-4 z-20 rounded-full px-2.5 py-1 text-[10px] font-semibold tabular-nums"
            style={{
              background: 'rgba(0,0,0,0.45)',
              color: '#fff',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
        )}
      </section>
    </>
  )
}
