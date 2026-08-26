'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  },
  {
    id: 4,
    img: 'https://i.ytimg.com/vi/KBJbUNJ8-Dk/maxresdefault.jpg',
    brand: "Haldiram's",
    label: 'Snacks & Sweets',
    headline: 'Taste the Tradition',
    sub: "Haldiram's — premium namkeen, mithai & more",
    cta: 'Shop Snacks',
    href: '/?category=Snacks',
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
  },
]

const AUTO_MS = 3500
const TRANS_MS = 420

export function PromoSlider() {
  const [current, setCurrent]     = useState(0)
  const [prev, setPrev]           = useState<number | null>(null)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused]       = useState(false)
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

  useEffect(() => {
    if (paused) return
    const t = setTimeout(goNext, AUTO_MS)
    return () => clearTimeout(t)
  }, [current, paused, goNext])

  const touchStart = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd   = (e: React.TouchEvent) => {
    const d = e.changedTouches[0].clientX - touchStart.current
    if (Math.abs(d) > 40) d < 0 ? goNext() : goPrev()
  }

  function getTransform(i: number) {
    const isCurrent = i === current
    const isPrev    = i === prev
    if (isCurrent) {
      return animating
        ? (direction === 'next' ? 'translateX(100%)' : 'translateX(-100%)')
        : 'translateX(0%)'
    }
    if (isPrev) {
      return direction === 'next' ? 'translateX(-100%)' : 'translateX(100%)'
    }
    return 'translateX(100%)'
  }

  function getZIndex(i: number) {
    if (i === current) return 2
    if (i === prev) return 1
    return 0
  }

  return (
    <>
      <style>{`
        @keyframes kb-in  { from { transform: scale(1.0); } to { transform: scale(1.07); } }
        @keyframes kb-out { from { transform: scale(1.07); } to { transform: scale(1.0); } }
      `}</style>

      {/* ── Slider shell — responsive height via aspect-ratio ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ borderBottom: '1px solid var(--border)' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Responsive height: taller on desktop, 9:16-ish on mobile portrait */}
        <div className="relative w-full" style={{ paddingBottom: 'clamp(260px, 42vw, 480px)', height: 0 }}>

          {SLIDES.map((slide, i) => {
            const isCurrent = i === current
            const isPrev    = i === prev
            const active    = isCurrent || isPrev

            return (
              <div
                key={slide.id}
                aria-hidden={!isCurrent}
                className="absolute inset-0"
                style={{
                  zIndex: getZIndex(i),
                  transform: getTransform(i),
                  transition: active ? `transform ${TRANS_MS}ms cubic-bezier(0.25,0.46,0.45,0.94)` : 'none',
                }}
              >
                {/* Full-cover image using <img> + object-fit — identical on every screen size */}
                <img
                  src={slide.img}
                  alt={slide.brand}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: 'brightness(1.12) saturate(1.08)',
                    animation: isCurrent && !animating
                      ? `${i % 2 === 0 ? 'kb-in' : 'kb-out'} ${AUTO_MS + TRANS_MS}ms ease-in-out forwards`
                      : 'none',
                  }}
                />

                {/* Gradient overlay — left-heavy for text legibility */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.06) 100%)' }}
                />

                {/* ── Text content — fully responsive typography ── */}
                <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 md:px-14 max-w-2xl">

                  {/* Brand pill */}
                  <span
                    className="mb-1.5 sm:mb-2 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 font-bold uppercase tracking-widest"
                    style={{
                      fontSize: 'clamp(9px, 1.4vw, 13px)',
                      background: 'rgba(249,115,22,0.90)',
                      color: '#fff',
                      opacity: isCurrent && !animating ? 1 : 0,
                      transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(14px)',
                      transition: `opacity ${TRANS_MS + 60}ms ease-out 60ms, transform ${TRANS_MS + 60}ms ease-out 60ms`,
                    }}
                  >
                    {slide.label}
                  </span>

                  {/* Headline — clamps smoothly from mobile to 4K */}
                  <h2
                    className="font-serif font-bold leading-tight text-white"
                    style={{
                      fontSize: 'clamp(16px, 4vw, 52px)',
                      textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                      opacity: isCurrent && !animating ? 1 : 0,
                      transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(18px)',
                      transition: `opacity ${TRANS_MS + 80}ms ease-out 120ms, transform ${TRANS_MS + 80}ms ease-out 120ms`,
                    }}
                  >
                    {slide.headline}
                  </h2>

                  {/* Subtitle — hidden on very small screens, visible sm+ */}
                  <p
                    className="mt-1 sm:mt-2 font-medium text-white/80 hidden xs:block"
                    style={{
                      fontSize: 'clamp(11px, 1.8vw, 17px)',
                      opacity: isCurrent && !animating ? 1 : 0,
                      transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(16px)',
                      transition: `opacity ${TRANS_MS + 80}ms ease-out 180ms, transform ${TRANS_MS + 80}ms ease-out 180ms`,
                    }}
                  >
                    {slide.sub}
                  </p>

                  {/* CTA */}
                  <a
                    href={slide.href}
                    className="mt-3 sm:mt-5 inline-flex w-fit items-center gap-1.5 rounded-full font-bold text-slate-900 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    style={{
                      fontSize: 'clamp(11px, 1.6vw, 15px)',
                      padding: 'clamp(6px,1vw,10px) clamp(14px,2vw,22px)',
                      background: '#fff',
                      opacity: isCurrent && !animating ? 1 : 0,
                      transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(14px)',
                      transition: `opacity ${TRANS_MS + 80}ms ease-out 240ms, transform ${TRANS_MS + 80}ms ease-out 240ms`,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {slide.cta} →
                  </a>
                </div>
              </div>
            )
          })}

          {/* ── Arrows — always visible, all devices ── */}
          <button
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ width: 'clamp(32px,5vw,44px)', height: 'clamp(32px,5vw,44px)', background: 'rgba(0,0,0,0.42)', color: '#fff', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ChevronLeft style={{ width: 'clamp(14px,2vw,22px)', height: 'clamp(14px,2vw,22px)' }} />
          </button>
          <button
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ width: 'clamp(32px,5vw,44px)', height: 'clamp(32px,5vw,44px)', background: 'rgba(0,0,0,0.42)', color: '#fff', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ChevronRight style={{ width: 'clamp(14px,2vw,22px)', height: 'clamp(14px,2vw,22px)' }} />
          </button>

          {/* ── Dots ── */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i, i > current ? 'next' : 'prev')}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 22 : 7,
                  height: 7,
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.38)',
                }}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute right-14 bottom-3 z-20 text-[10px] font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>

        </div>
      </div>
    </>
  )
}
