'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { type Slide } from '@/app/admin/slides/page'

const AUTO_MS = 3500
const TRANS_MS = 420

const FALLBACK_SLIDES: Slide[] = [
  {
    img: 'https://i.ytimg.com/vi/EjBcaWm2_4w/maxresdefault.jpg',
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
    img: 'https://www.southasiancentral.ca/wp-content/uploads/Brand-page-top-banner-1.webp',
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
    img: 'https://vibrantfoods.com/wp-content/uploads/2022/08/TRS_OUR-BRAND_-BANNERS2.jpg',
    brand: 'TRS',
    label: 'Lentils & Pulses',
    headline: 'Premium Quality Pulses',
    sub: "TRS — the UK's #1 South Asian ingredient brand",
    cta: 'Shop Lentils',
    href: '/?category=Lentils+%26+Pulses',
    order: 2,
    enabled: true,
  }
].map((s, i) => ({ id: `fallback-${i}`, ...s }))


export function PromoSlider() {
  const [slides, setSlides]       = useState<Slide[]>([])
  const [loading, setLoading]     = useState(true)
  
  const [current, setCurrent]     = useState(0)
  const [prev, setPrev]           = useState<number | null>(null)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused]       = useState(false)
  
  const total = slides.length

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(clientDb, 'slides'), where('enabled', '==', true), orderBy('order', 'asc'))
        const snap = await getDocs(q)
        if (snap.empty) {
          setSlides(FALLBACK_SLIDES)
        } else {
          setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() } as Slide)))
        }
      } catch (err) {
        console.error('Failed to load slides, using fallback:', err)
        setSlides(FALLBACK_SLIDES)
      }
      setLoading(false)
    }
    load()
  }, [])

  const goTo = useCallback((idx: number, dir: 'next' | 'prev' = 'next') => {
    if (animating || total === 0) return
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
      return 'translateX(0%)' // Keep previous slide in place while the new one slides over it
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

      {/* ── Slider shell — Boxed Billboard Layout ── */}
      <div className="w-full bg-background px-4 md:px-8 py-6 md:py-10 flex justify-center border-b border-border">
        <div
          className="relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border/50"
          style={{ aspectRatio: '21/9', minHeight: '200px', background: '#080C14' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >

          {loading ? (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" style={{ background: 'var(--muted)' }} />
          ) : total === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400" style={{ background: 'var(--secondary)' }}>
              No slides available
            </div>
          ) : (
            <>
              {slides.map((slide, i) => {
            const isCurrent = i === current
            const isPrev    = i === prev
            const active    = isCurrent || isPrev

            return (
              <div
                key={slide.id}
                aria-hidden={!isCurrent}
                className="absolute inset-0"
                style={{
                  background: '#080C14',
                  zIndex: getZIndex(i),
                  transform: getTransform(i),
                  transition: active ? `transform ${TRANS_MS}ms cubic-bezier(0.25,0.46,0.45,0.94)` : 'none',
                }}
              >
                <img
                  src={slide.img}
                  alt={slide.brand}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    objectPosition: 'center center',
                    filter: 'brightness(1.05) saturate(1.05)',
                    animation: isCurrent && !animating
                      ? `${i % 2 === 0 ? 'kb-in' : 'kb-out'} ${AUTO_MS + TRANS_MS}ms ease-in-out forwards`
                      : 'none',
                  }}
                />

                {/* Gradient overlay just at the very bottom for the text bar */}
                <div
                  className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                  style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)' }}
                />

                {/* ── Text content — bottom single-line bar ── */}
                <div 
                  className="absolute inset-x-0 bottom-0 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4 gap-2 sm:gap-4"
                  style={{
                    opacity: isCurrent && !animating ? 1 : 0,
                    transform: isCurrent && !animating ? 'translateY(0)' : 'translateY(10px)',
                    transition: `opacity ${TRANS_MS + 50}ms ease-out 50ms, transform ${TRANS_MS + 50}ms ease-out 50ms`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 min-w-0">
                    {/* Brand pill */}
                    <span
                      className="inline-flex shrink-0 items-center rounded-sm px-2 py-0.5 font-bold uppercase tracking-widest text-[10px]"
                      style={{ background: '#F97316', color: '#fff' }}
                    >
                      {slide.label}
                    </span>

                    {/* Headline & Sub */}
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="font-bold text-white text-[13px] sm:text-[15px] truncate">
                        {slide.headline}
                      </h2>
                      {slide.sub && (
                        <span className="hidden md:inline font-medium text-white/70 text-[13px] truncate border-l border-white/20 pl-2">
                          {slide.sub}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={slide.href}
                    className="shrink-0 inline-flex items-center justify-center rounded-full font-bold text-slate-900 transition-all duration-200 hover:scale-105 hover:bg-orange-50 text-[11px] sm:text-[13px] px-3 py-1 sm:px-5 sm:py-1.5"
                    style={{ background: '#fff' }}
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

          {/* ── Dots (Moved up or hidden as we have the bottom bar) ── */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
            {slides.map((_, i) => (
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

          {/* Counter (Moved slightly up to avoid overlapping the bottom bar) */}
          <div className="absolute right-4 top-4 z-20 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold tabular-nums backdrop-blur-sm" style={{ color: '#fff' }}>
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
            </>
          )}

        </div>
      </div>
      
      {/* Ornate Indian trim divider on the bottom to frame the slider */}
      <div className="desi-trim" aria-hidden />
    </>
  )
}
