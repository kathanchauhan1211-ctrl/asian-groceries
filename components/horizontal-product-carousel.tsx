'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/products'
import { useTranslation } from '@/lib/translation-context'

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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -300 : 300
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div className="my-8 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {td(title)}
        </h2>
        
        <div className="flex items-center gap-4">
          {viewAllLink && (
            <Link 
              href={viewAllLink} 
              className="hidden md:flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {td('View All')} <ArrowRight className="size-4" />
            </Link>
          )}
          
          {/* Desktop Arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              className="flex size-8 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-secondary transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="flex size-8 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-secondary transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View All Mobile */}
      {viewAllLink && (
        <div className="md:hidden px-4 mb-4">
           <Link 
            href={viewAllLink} 
            className="flex items-center gap-1 text-sm font-semibold"
            style={{ color: 'var(--primary)' }}
          >
            {td('View All')} <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {/* Carousel */}
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
    </div>
  )
}
