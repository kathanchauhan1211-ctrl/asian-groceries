'use client'

import { useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'
import { useTranslation } from '@/lib/translation-context'
import { Button } from '@/components/ui/button'

export function HorizontalProductCarousel({ 
  title, 
  products, 
  viewAllLink 
}: { 
  title: string; 
  products: Product[]; 
  viewAllLink?: string 
}) {
  const { td } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -300 : 300
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000); // Swipe every 4 seconds
    return () => clearInterval(interval);
  }, [isPaused]);

  if (!products.length) return null

  return (
    <div className="my-2 w-full relative">

      {/* Header — only shown when a title string is provided */}
      {title ? (
        <div className="flex items-center justify-between mb-4 px-4 md:px-0">
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {td(title)}
          </h2>
          <div className="flex items-center gap-4">
            {viewAllLink && (
              <Button
                href={viewAllLink}
                variant="transparent"
                size="sm"
                className="hidden md:flex gap-1"
                style={{ color: 'var(--primary)' }}
              >
                {td('View All')} <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* No title: just show View All on the right */
        <div className="flex items-center justify-end gap-2 mb-2 px-4 md:px-0">
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="flex items-center gap-1 text-sm font-semibold mr-auto"
              style={{ color: 'var(--primary)' }}
            >
              View All <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      )}

      {/* View All — Mobile, only when title is provided */}
      {title && viewAllLink && (
        <div className="md:hidden px-4 mb-4">
          <Button
            href={viewAllLink}
            variant="transparent"
            size="sm"
            className="gap-1 px-0"
            style={{ color: 'var(--primary)' }}
          >
            {td('View All')} <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Carousel track wrapper with arrows */}
      <div 
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Left arrow – hidden on mobile */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-4 lg:-left-6 top-[40%] -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          style={{ 
            background: 'var(--card)', 
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Carousel track */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 md:px-0 pb-6 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {products.map((product, i) => (
            <div 
              key={product.id} 
              className="snap-start shrink-0 w-[47vw] min-w-[47vw] sm:w-[32vw] sm:min-w-[32vw] md:w-[260px] md:min-w-[260px] lg:w-[280px] lg:min-w-[280px] flex flex-col"
            >
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>

        {/* Right arrow – hidden on mobile */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-4 lg:-right-6 top-[40%] -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
          style={{ 
            background: 'var(--card)', 
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          aria-label="Scroll right"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    </div>
  )
}
