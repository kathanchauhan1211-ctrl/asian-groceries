'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

import { useBrands } from '@/lib/use-brands'

export function BrandCatalog() {
  const { brands, loading } = useBrands()
  const activeBrands = brands.filter(b => b.active !== false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-scroll fast
  useEffect(() => {
    if (isPaused || !scrollRef.current || activeBrands.length === 0) return
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' })
        }
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [isPaused, activeBrands.length])

  const scroll = (dir: 1 | -1) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8
      scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-[1600px] px-4 md:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="flex gap-4 md:gap-5 overflow-hidden">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex-shrink-0 w-[40vw] sm:w-[28vw] md:w-[200px] lg:w-[220px] h-[80px] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (activeBrands.length === 0) return null

  return (
    <section className="mx-auto max-w-[1600px] px-4 md:px-6 py-4 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          🏷️ Shop by Brand
        </h2>
      </div>

      <div 
        className="relative group md:w-fit max-w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          className="hidden md:flex absolute -left-4 lg:-left-6 top-[40%] -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          style={{ 
            background: 'var(--card)', 
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }}
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4 px-2 -mx-2"
        >
          {activeBrands.map(brand => (
            <Link 
              key={brand.id}
              href={brand.href}
              draggable={false}
              className="snap-start flex-shrink-0 flex flex-col w-[40vw] min-w-[40vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[200px] md:min-w-[200px] lg:w-[220px] lg:min-w-[220px] rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-all group/brand"
            >
              <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-900/50 border-b border-border/20 flex items-center justify-center">
                {brand.image ? (
                  <Image 
                    src={brand.image} 
                    alt={brand.name} 
                    fill 
                    className="object-contain p-4 group-hover/brand:scale-105 transition-transform" 
                  />
                ) : (
                  <div className="text-5xl">{brand.emoji}</div>
                )}
              </div>
              <div className="p-3 sm:p-4 text-center">
                <h3 className="font-bold text-foreground text-sm md:text-base leading-tight truncate">{brand.name}</h3>
                {brand.tagline && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{brand.tagline}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          className="hidden md:flex absolute -right-4 lg:-right-6 top-[40%] -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          style={{ 
            background: 'var(--card)', 
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }}
          aria-label="Scroll right"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    </section>
  )
}
