'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CATEGORY_GROUPS, type CategoryGroup } from '@/lib/products'
import { useTranslation } from '@/lib/translation-context'

/**
 * SwipeableCategoryBar
 *
 * Reads the active category from the URL (?category=...) and writes changes
 * back to URL params — same pipeline as ProductCatalog.
 *
 * If `categories` prop is not provided, defaults to CATEGORY_GROUPS from lib/products.ts.
 * This guarantees the bar and the product grid always use the same grouping.
 *
 * Props:
 *  - categories: optional override (defaults to CATEGORY_GROUPS)
 *  - prependFilterButton: optional ReactNode prepended before the pill row (e.g. Filters button)
 */
export function SwipeableCategoryBar({
  categories = CATEGORY_GROUPS,
  prependFilterButton,
}: {
  categories?: CategoryGroup[]
  prependFilterButton?: React.ReactNode
}) {
  const { td } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Read active category from URL
  const categoryParam = searchParams.get('category') || ''
  const selectedCategories = categoryParam ? categoryParam.split(',').filter(Boolean) : []

  // Which group is active? (first selected category determines the active group)
  const activeGroup = categories.find(g =>
    g.match.some(m => selectedCategories.includes(m))
  ) ?? null

  // Write category change to URL
  const selectGroup = useCallback((grp: CategoryGroup | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!grp) {
      params.delete('category')
    } else {
      // If this group is already active, deselect it
      const isActive = grp.match.some(m => selectedCategories.includes(m))
      if (isActive) {
        params.delete('category')
      } else {
        params.set('category', grp.match[0])
      }
    }
    router.replace(`/?${params.toString()}`, { scroll: false })
  }, [router, searchParams, selectedCategories])

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [categories])

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="sticky top-[4.5rem] z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-xl md:mx-0 md:px-0 mb-6 transition-all duration-200 group/bar relative">

      {/* Desktop Scroll Left */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-300)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-40 hidden md:flex items-center justify-center size-9 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/bar:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {prependFilterButton}

        {prependFilterButton && (
          <div className="w-px h-6 shrink-0 mx-1" style={{ background: 'var(--border)' }} />
        )}

        {/* All button */}
        <button
          onClick={() => selectGroup(null)}
          className="snap-start shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold transition-all border hover:-translate-y-0.5 active:scale-95"
          style={{
            background:  activeGroup === null ? 'var(--primary)' : 'var(--card)',
            color:       activeGroup === null ? '#fff'           : 'var(--foreground)',
            borderColor: activeGroup === null ? 'var(--primary)' : 'var(--border)',
            boxShadow:   activeGroup === null ? '0 4px 12px rgba(249,115,22,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {td('All')}
        </button>

        {categories.map(grp => {
          const active = grp.match.some(m => selectedCategories.includes(m))
          return (
            <button
              key={grp.label}
              onClick={() => selectGroup(grp)}
              className="snap-start shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold transition-all border hover:-translate-y-0.5 active:scale-95"
              style={{
                background:  active ? 'var(--primary)' : 'var(--card)',
                color:       active ? '#fff'           : 'var(--foreground)',
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                boxShadow:   active ? '0 4px 12px rgba(249,115,22,0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <span className="text-base leading-none">{grp.icon}</span>
              {td(grp.label)}
            </button>
          )
        })}
      </div>

      {/* Desktop Scroll Right */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(300)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-40 hidden md:flex items-center justify-center size-9 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 text-gray-700 hover:text-orange-500 hover:scale-110 transition-all opacity-0 group-hover/bar:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  )
}
