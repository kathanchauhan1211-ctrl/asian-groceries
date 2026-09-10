'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/lib/products'
import { ProductCard } from '@/components/product-card'

type HorizontalRowProps = {
  title: string
  items: Product[]
  viewAllHref: string
  rows?: number
}

/**
 * Reusable horizontally scrollable carousel used on the homepage.
 * Displays a row (or multiple rows) of ProductCard components with native scroll-snap behaviour,
 * left/right navigation arrows for desktop, and a View All link.
 */
export function HorizontalRow({ title, items, viewAllHref, rows = 1 }: HorizontalRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: number) => {
    if (scrollRef.current) {
      // Adjust scroll distance based on card width + gap (~260px)
      scrollRef.current.scrollBy({ left: direction * 260, behavior: 'smooth' })
    }
  }

  const isMultiRow = rows > 1

  return (
    <section className="my-8">
      {/* Header – title + View All */}
      <header className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h2>
        <Link href={viewAllHref} className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors">
          View All
        </Link>
      </header>

      <div className="relative group">
        {/* Left arrow – hidden on mobile */}
        <button
          onClick={() => scroll(-1)}
          className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-gray-200 shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-black/5 dark:border-white/10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Scroll container – native scrolling with snap */}
        <div
          ref={scrollRef}
          className={`overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-4 -mx-2 ${
            isMultiRow ? 'grid gap-4 md:gap-5' : 'flex gap-4 md:gap-5'
          }`}
          style={isMultiRow ? {
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gridAutoFlow: 'column',
            gridAutoColumns: 'min-content'
          } : undefined}
        >
          {items.map((product, idx) => (
            <div
              key={product.id}
              className={`snap-start flex-shrink-0 flex flex-col w-[60vw] min-w-[60vw] sm:w-[32vw] sm:min-w-[32vw] md:w-[260px] md:min-w-[260px] lg:w-[280px] lg:min-w-[280px] ${
                isMultiRow ? 'h-full' : ''
              }`}
            >
              <ProductCard product={product} index={idx} />
            </div>
          ))}
        </div>

        {/* Right arrow – hidden on mobile */}
        <button
          onClick={() => scroll(1)}
          className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full bg-white/90 dark:bg-slate-800/90 text-gray-700 dark:text-gray-200 shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 border border-black/5 dark:border-white/10"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    </section>
  )
}
