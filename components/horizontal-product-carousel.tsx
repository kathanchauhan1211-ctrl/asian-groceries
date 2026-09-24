'use client'

import { useRef } from 'react'
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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -300 : 300
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div className="my-2 w-full overflow-hidden">

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

            <div className="hidden md:flex items-center gap-2">
              <Button
                onClick={() => scroll('left')}
                variant="glass-light"
                size="icon"
                className="rounded-full"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                onClick={() => scroll('right')}
                variant="glass-light"
                size="icon"
                className="rounded-full"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* No title: just show scroll arrows + View All on the right */
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
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex size-8 items-center justify-center rounded-full border transition-all hover:bg-orange-50 dark:hover:bg-orange-900/20"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex size-8 items-center justify-center rounded-full border transition-all hover:bg-orange-50 dark:hover:bg-orange-900/20"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
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
    </div>
  )
}
