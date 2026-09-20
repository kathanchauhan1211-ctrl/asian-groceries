'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Brand {
  id: string
  name: string
  tagline: string
  emoji: string
  color: string
  textColor: string
  href: string
  badge?: string
}

const BRANDS: Brand[] = [
  { id: 'aashirvaad',  name: 'Aashirvaad',  tagline: 'Atta & Flour',       emoji: '🌾', color: '#92400e', textColor: '#fff', href: '/?q=aashirvaad',  badge: 'Best Seller' },
  { id: 'mdh',         name: 'MDH',          tagline: 'Spices & Masalas',   emoji: '🌶️', color: '#b91c1c', textColor: '#fff', href: '/?q=mdh' },
  { id: 'trs',         name: 'TRS',          tagline: 'Lentils & Pulses',   emoji: '🫘', color: '#065f46', textColor: '#fff', href: '/?q=trs',         badge: 'Premium' },
  { id: 'everest',     name: 'Everest',      tagline: 'Blended Masalas',    emoji: '🏔️', color: '#1e3a5f', textColor: '#fff', href: '/?q=everest' },
  { id: 'patanjali',   name: 'Patanjali',    tagline: 'Natural & Organic',  emoji: '🌿', color: '#14532d', textColor: '#fff', href: '/?q=patanjali',   badge: 'Organic' },
  { id: 'amul',        name: 'Amul',         tagline: 'Dairy & Sweets',     emoji: '🧈', color: '#78350f', textColor: '#fff', href: '/?q=amul' },
  { id: 'haldirams',   name: "Haldiram's",   tagline: 'Snacks & Sweets',    emoji: '🍬', color: '#7c2d12', textColor: '#fff', href: '/?q=haldirams',   badge: 'Popular' },
  { id: 'kingsley',    name: 'Kitchen King', tagline: 'All-in-One Masala',  emoji: '👑', color: '#4c1d95', textColor: '#fff', href: '/?q=kitchen+king' },
  { id: 'maggi',       name: 'Maggi',        tagline: 'Noodles & Sauces',   emoji: '🍜', color: '#b45309', textColor: '#fff', href: '/?q=maggi' },
  { id: 'lijjat',      name: 'Lijjat',       tagline: 'Papad & Crispy',     emoji: '🫓', color: '#854d0e', textColor: '#fff', href: '/?q=lijjat' },
]

const AUTO_MS = 3200

export function BrandCatalog() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [isDrag, setIsDrag] = useState(false)
  const [paused, setPaused] = useState(false)
  const dragStartX = useRef(0)
  const dragOffsetStart = useRef(0)

  function cardW() {
    if (!trackRef.current) return 180
    const vw = trackRef.current.offsetWidth
    if (vw >= 1024) return vw / 5
    if (vw >= 640) return vw / 3.5
    return vw / 2.3
  }

  const maxOffset = useCallback(() => {
    const cw = cardW()
    const tw = trackRef.current?.offsetWidth ?? 0
    return -(BRANDS.length * cw - tw - cw * 0.3)
  }, [])

  const clamp = useCallback((v: number) => Math.max(maxOffset(), Math.min(0, v)), [maxOffset])

  const scrollBy = (dir: 1 | -1) => {
    setOffset(prev => clamp(prev + dir * -cardW()))
  }

  useEffect(() => {
    if (paused || isDrag) return
    const t = setInterval(() => {
      setOffset(prev => {
        const next = prev - cardW()
        return next < maxOffset() ? 0 : next
      })
    }, AUTO_MS)
    return () => clearInterval(t)
  }, [paused, isDrag, maxOffset])

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDrag(true)
    dragStartX.current = e.clientX
    dragOffsetStart.current = offset
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDrag) return
    setOffset(clamp(dragOffsetStart.current + (e.clientX - dragStartX.current)))
  }
  const onPointerUp = () => {
    setIsDrag(false)
    const cw = cardW()
    setOffset(prev => clamp(Math.round(prev / cw) * cw))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight">🏷️ Shop by Brand</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Trusted names from South Asia</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => scrollBy(-1)} className="flex items-center justify-center size-8 rounded-full bg-black/5 hover:bg-black/10 transition-all hover:scale-110 active:scale-90 border border-black/8" aria-label="Scroll left">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scrollBy(1)} className="flex items-center justify-center size-8 rounded-full bg-black/5 hover:bg-black/10 transition-all hover:scale-110 active:scale-90 border border-black/8" aria-label="Scroll right">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          ref={trackRef}
          className="flex"
          style={{
            transform: `translateX(${offset}px)`,
            transition: isDrag ? 'none' : 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
            willChange: 'transform',
            cursor: isDrag ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {BRANDS.map(brand => (
            <div key={brand.id} className="flex-shrink-0 pr-3" style={{ width: 'calc(100% / 2.3)' }}>
              <Link href={brand.href} draggable={false} tabIndex={-1}>
                <div
                  className="relative rounded-2xl overflow-hidden h-[130px] sm:h-[150px] transition-transform duration-200 hover:scale-[1.03] hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${brand.color}f0, ${brand.color}99)` }}
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.5) 0%, transparent 55%)' }} />
                  {brand.badge && (
                    <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-white border border-white/20">
                      {brand.badge}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 text-3xl sm:text-4xl select-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}>
                    {brand.emoji}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm sm:text-base font-black tracking-tight leading-none" style={{ color: brand.textColor }}>{brand.name}</p>
                    <p className="text-[10px] sm:text-xs mt-0.5 font-semibold opacity-75" style={{ color: brand.textColor }}>{brand.tagline}</p>
                  </div>
                  <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)' }} />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
