'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Slide data — real brand ad images ───────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    img: 'https://i.ytimg.com/vi/EjBcaWm2_4w/maxresdefault.jpg',
    brand: 'Aashirvaad',
    label: 'Atta & Flour',
    headline: "India's Most Loved Flour",
    sub: 'Soft rotis every time — authentic stone-ground atta',
    cta: 'Shop Flour',
    href: '/?category=Rice+%26+Grains',
    pos: 'center center',
  },
  {
    id: 2,
    img: 'https://www.southasiancentral.ca/wp-content/uploads/Brand-page-top-banner-1.webp',
    brand: 'MDH',
    label: 'Spices & Masalas',
    headline: 'Real Taste, Real Spice',
    sub: 'MDH — trusted by generations across South Asia',
    cta: 'Shop Spices',
    href: '/?category=Spices',
    pos: 'center center',
  },
  {
    id: 3,
    img: 'https://vibrantfoods.com/wp-content/uploads/2022/08/TRS_OUR-BRAND_-BANNERS2.jpg',
    brand: 'TRS',
    label: 'Lentils & Pulses',
    headline: 'Premium Quality Pulses',
    sub: "TRS — the UK's #1 South Asian ingredient brand",
    cta: 'Shop Lentils',
    href: '/?category=Lentils+%26+Pulses',
    pos: 'center 40%',
  },
  {
    id: 4,
    img: 'https://i.ytimg.com/vi/KBJbUNJ8-Dk/maxresdefault.jpg',
    brand: 'Haldiram',
    label: 'Snacks & Sweets',
    headline: 'Taste the Tradition',
    sub: "Haldiram's — premium namkeen, mithai & more",
    cta: 'Shop Snacks',
    href: '/?category=Snacks',
    pos: 'center center',
  },
  {
    id: 5,
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4NgeaYtyZ9LP2HuffUVY1p_cqEppZjKzdtS3Z4hgJo0hG0he-Ji-ZNQ0&s=10',
    brand: 'PRAN',
    label: 'Ready Meals & Drinks',
    headline: 'Flavours of Bangladesh',
    sub: 'PRAN — quality food & beverages from the subcontinent',
    cta: 'Shop PRAN',
    href: '/?category=Ready+Meals',
    pos: 'center center',
  },
]

const AUTO_MS = 3500
const TRANS_MS = 420

export function PromoSlider() {
  const [current, setCurrent]   = useState(0)
  const [prev, setPrev]         = useState<number | null>(null)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused]     = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const total = SLIDES.length

  const goTo = useCallback((idx: number, dir: 'next' | 'prev' = 'next') => {
    if (animating) return
    const next = ((idx % total) + total) % total
    setDirection(dir)
    setPrev(current)
    setCurrent(next)
    setAnimating(true)
    setTimeout(() => { setPrev(null); setAnimating(false) }, TRANS_MS)
  }, [animating, current, total])

  const goNext = useCallback(() => goTo(current + 1, 'next'), [current, goTo])
  const goPrev = useCallback(() => goTo(current - 1, 'prev'), [current, goTo])

  // Auto-advance
  useEffect(() => {
    if (paused) return
    timerRef.current = setTimeout(goNext, AUTO_MS)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, paused, goNext])

  // Touch / swipe
  const touchStart = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(delta) > 40) delta < 0 ? goNext() : goPrev()
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        borderBottom: '1px solid #E5E7EB',
        height: 'clamp(220px, 38vw, 420px)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Slides ── */}
      {SLIDES.map((slide, i) => {
        const isCurrent = i === current
        const isPrev    = i === prev

        let transform = 'translateX(100%)'
        let opacity   = 0
        let zIndex    = 0

        if (isCurrent) {
          // Incoming: slide in from the direction
          transform = animating
            ? (direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)')
            : 'translateX(0%)'
          opacity = 1
          zIndex  = 2
        } else if (isPrev) {
          // Outgoing: slide out to opposite direction
          transform = direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)'
          opacity   = 1
          zIndex    = 1
        }

        return (
          <div
            key={slide.id}
            aria-hidden={!isCurrent}
            className="absolute inset-0"
            style={{
              zIndex,
              opacity,
              transform: isCurrent
                ? (animating
                    ? (direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)')
                    : 'translateX(0%)')
                : (isPrev
                    ? (direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)')
                    : 'translateX(100%)'),
              transition: (isCurrent || isPrev)
                ? `transform ${TRANS_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${TRANS_MS}ms ease-out`
                : 'none',
            }}
          >
            {/* Background image — cover + subtle Ken Burns zoom */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url('${slide.img}')`,
                backgroundSize: 'cover',
                backgroundPosition: slide.pos,
                backgroundRepeat: 'no-repeat',
                animation: isCurrent && !animating
                  ? `kenburns-${i % 2 === 0 ? 'in' : 'out'} ${AUTO_MS + TRANS_MS}ms ease-in-out forwards`
                  : 'none',
              }}
            />

            {/* Dark gradient overlay for text legibility */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.12) 100%)',
              }}
            />

            {/* Text content — slides in from below with stagger */}
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-14 max-w-2xl">
              {/* Brand pill */}
              <span
                className="mb-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(249,115,22,0.90)',
                  color: '#fff',
                  opacity: isCurrent && !animating ? 1 : 0,
                  transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity ${TRANS_MS + 80}ms ease-out, transform ${TRANS_MS + 80}ms ease-out`,
                  transitionDelay: '60ms',
                }}
              >
                {slide.label}
              </span>

              {/* Headline */}
              <h2
                className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl"
                style={{
                  opacity: isCurrent && !animating ? 1 : 0,
                  transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity ${TRANS_MS + 100}ms ease-out, transform ${TRANS_MS + 100}ms ease-out`,
                  transitionDelay: '120ms',
                  textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}
              >
                {slide.headline}
              </h2>

              {/* Subtitle */}
              <p
                className="mt-2 text-sm font-medium text-white/80 sm:text-base"
                style={{
                  opacity: isCurrent && !animating ? 1 : 0,
                  transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity ${TRANS_MS + 100}ms ease-out, transform ${TRANS_MS + 100}ms ease-out`,
                  transitionDelay: '180ms',
                }}
              >
                {slide.sub}
              </p>

              {/* CTA button */}
              <a
                href={slide.href}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-slate-900 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{
                  background: '#fff',
                  opacity: isCurrent && !animating ? 1 : 0,
                  transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity ${TRANS_MS + 100}ms ease-out, transform ${TRANS_MS + 100}ms ease-out, box-shadow 200ms, scale 200ms`,
                  transitionDelay: '240ms',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {slide.cta} →
              </a>
            </div>
          </div>
        )
      })}

      {/* ── Arrows — visible on ALL devices ── */}
      <button
        aria-label="Previous slide"
        onClick={goPrev}
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        aria-label="Next slide"
        onClick={goNext}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <ChevronRight className="size-5" />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 7,
              height: 7,
              background: i === current ? '#fff' : 'rgba(255,255,255,0.40)',
              boxShadow: i === current ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Slide counter ── */}
      <div
        className="absolute right-14 bottom-3 z-20 text-[11px] font-semibold tabular-nums"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>

      {/* ── Ken Burns keyframes injected via style tag ── */}
      <style>{`
        @keyframes kenburns-in {
          from { transform: scale(1.0); }
          to   { transform: scale(1.06); }
        }
        @keyframes kenburns-out {
          from { transform: scale(1.06); }
          to   { transform: scale(1.0); }
        }
      `}</style>
    </div>
  )
}
