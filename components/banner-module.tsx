'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBanners, BannerSlot, BannerSlide } from '@/lib/use-banners'

// ── Mini Slider — shared logic for each banner zone ───────────────────────────

function useBannerSlider(slides: BannerSlide[], intervalMs: number) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)
  const total = slides.length

  const goTo = useCallback((idx: number) => {
    if (animating || total <= 1) return
    const next = ((idx % total) + total) % total
    setAnimating(true)
    setCurrent(next)
    setTimeout(() => setAnimating(false), 450)
  }, [animating, total])

  const goNext = useCallback(() => goTo(current + 1), [current, goTo])
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo])

  useEffect(() => {
    if (paused || total <= 1) return
    const t = setTimeout(goNext, intervalMs)
    return () => clearTimeout(t)
  }, [current, paused, goNext, total, intervalMs])

  const touchStartX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) dx < 0 ? goNext() : goPrev()
  }

  return { current, goNext, goPrev, goTo, paused, setPaused, onTouchStart, onTouchEnd, total }
}

// ── Hero Banner (big left zone) ───────────────────────────────────────────────

function HeroBanner({ slot }: { slot: BannerSlot }) {
  const { current, goNext, goPrev, goTo, setPaused, onTouchStart, onTouchEnd, total } =
    useBannerSlider(slot.slides, slot.autoIntervalMs)

  if (slot.slides.length === 0) return null

  return (
    <div
      className="group relative lg:col-span-2 rounded-2xl overflow-hidden min-h-[300px] lg:min-h-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slot.slides.map((slide, i) => {
        const active = i === current
        return (
          <Link
            key={slide.id}
            href={slide.link}
            className="absolute inset-0 flex flex-col justify-center"
            style={{
              backgroundColor: slide.bgColor,
              opacity: active ? 1 : 0,
              transition: 'opacity 450ms ease-in-out',
              zIndex: active ? 2 : 1,
              pointerEvents: active ? 'auto' : 'none',
            }}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center md:bg-right bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* Content */}
            <div
              className="relative z-10 py-8 pl-14 pr-6 md:p-12 md:pl-16 flex flex-col items-start max-w-[75%] md:max-w-[65%]"
              style={{ animation: active ? 'banner-caption-in 0.5s ease-out 0.1s both' : 'none' }}
            >
              {slide.subtitle && (
                <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] mb-2 uppercase"
                  style={{ color: slide.textColor, opacity: 0.75 }}>
                  {slide.subtitle}
                </p>
              )}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-[0.92] tracking-tight mb-3"
                style={{ color: slide.textColor }}>
                {slide.title.split(' ').map((word, wi) => (
                  <span key={wi} className="block">{word}</span>
                ))}
              </h2>
              {slide.tagline && (
                <p className="text-sm md:text-base font-medium mb-5 opacity-85"
                  style={{ color: slide.textColor }}>
                  {slide.tagline}
                </p>
              )}
              <div className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors"
                style={{ color: slide.textColor }}>
                Shop Now <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>
        )
      })}

      {/* Arrows */}
      {total > 1 && (
        <>
          <button onClick={(e) => { e.preventDefault(); goPrev() }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-8 md:size-10 rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(0,0,0,0.40)', color: '#fff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronLeft className="size-4 md:size-5" />
          </button>
          <button onClick={(e) => { e.preventDefault(); goNext() }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-8 md:size-10 rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(0,0,0,0.40)', color: '#fff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronRight className="size-4 md:size-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-4 left-8 md:left-12 z-20 flex items-center gap-1.5">
          {slot.slides.map((_, i) => (
            <button key={i} onClick={(e) => { e.preventDefault(); goTo(i) }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6, height: 6,
                background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
              }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Small Banner (right column stacked zones) ─────────────────────────────────

function SmallBanner({ slot }: { slot: BannerSlot }) {
  const { current, goNext, goPrev, goTo, setPaused, onTouchStart, onTouchEnd, total } =
    useBannerSlider(slot.slides, slot.autoIntervalMs)

  if (slot.slides.length === 0) return null

  return (
    <div
      className="relative flex-1 rounded-2xl overflow-hidden min-h-[185px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slot.slides.map((slide, i) => {
        const active = i === current
        return (
          <Link
            key={slide.id}
            href={slide.link}
            className="absolute inset-0 flex items-center"
            style={{
              backgroundColor: slide.bgColor,
              opacity: active ? 1 : 0,
              transition: 'opacity 400ms ease-in-out',
              zIndex: active ? 2 : 1,
              pointerEvents: active ? 'auto' : 'none',
            }}
          >
            {/* Background image with mask fade */}
            <div
              className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.image})`,
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 35%)',
                maskImage: 'linear-gradient(to right, transparent, black 35%)',
              }}
            />

            {/* Text content */}
            <div
              className="relative z-10 py-5 pl-10 pr-4 flex flex-col items-start w-[70%]"
              style={{ animation: active ? 'banner-caption-in 0.4s ease-out 0.1s both' : 'none' }}
            >
              <h3 className="text-xl md:text-2xl font-black leading-tight tracking-tight mb-1"
                style={{ color: slide.textColor }}>
                {slide.title.split(' ').map((word, wi) => (
                  <span key={wi} className="block break-words">{word}</span>
                ))}
              </h3>
              {slide.tagline && (
                <p className="text-xs font-semibold mt-1 opacity-90"
                  style={{ color: slide.textColor }}>
                  {slide.tagline}
                </p>
              )}
              {slide.subtitle && (
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-70"
                  style={{ color: slide.textColor }}>
                  {slide.subtitle}
                </p>
              )}
            </div>
          </Link>
        )
      })}

      {/* Arrows for Small Banner */}
      {total > 1 && (
        <>
          <button onClick={(e) => { e.preventDefault(); goPrev() }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-6 rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(0,0,0,0.40)', color: '#fff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronLeft className="size-3" />
          </button>
          <button onClick={(e) => { e.preventDefault(); goNext() }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-6 rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(0,0,0,0.40)', color: '#fff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <ChevronRight className="size-3" />
          </button>
        </>
      )}

      {/* Dot indicators — bottom left */}
      {total > 1 && (
        <div className="absolute bottom-3 left-10 z-20 flex items-center gap-1">
          {slot.slides.map((_, i) => (
            <button key={i} onClick={(e) => { e.preventDefault(); goTo(i) }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 16 : 5, height: 5,
                background: i === current ? '#fff' : 'rgba(255,255,255,0.45)',
              }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function BannerModule() {
  const { slots, loading } = useBanners()

  if (loading || !slots || slots.length === 0) return null

  const heroSlot = slots.find(s => s.slotPosition === 'main')
  const topSlot = slots.find(s => s.slotPosition === 'secondary_top')
  const bottomSlot = slots.find(s => s.slotPosition === 'secondary_bottom')

  return (
    <>
      <style>{`
        @keyframes banner-caption-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[420px]">
          {/* Hero zone */}
          {heroSlot && <HeroBanner slot={heroSlot} />}

          {/* Right column — 2 stacked small zones */}
          <div className="lg:col-span-1 flex flex-col gap-4 h-full">
            {topSlot && <SmallBanner slot={topSlot} />}
            {bottomSlot && <SmallBanner slot={bottomSlot} />}
          </div>
        </div>
      </div>
    </>
  )
}
