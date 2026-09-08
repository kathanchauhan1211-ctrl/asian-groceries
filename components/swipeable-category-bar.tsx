'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CATEGORY_GROUPS, type CategoryGroup } from '@/lib/products'
import { useTranslation } from '@/lib/translation-context'
import { Button } from '@/components/ui/button'

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
  const pathname = usePathname()
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
    const queryString = params.toString()
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, searchParams, selectedCategories, pathname])

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
        <Button
          onClick={() => scrollBy(-300)}
          variant="glass-light"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-40 hidden md:flex rounded-full opacity-0 group-hover/bar:opacity-100 shadow-md"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-5" />
        </Button>
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
        <Button
          onClick={() => selectGroup(null)}
          variant={activeGroup === null ? 'default' : 'glass-light'}
          size="sm"
          className="snap-start shrink-0 rounded-full px-4 py-2 text-[14px] font-bold hover:-translate-y-0.5 active:scale-95"
        >
          {td('All')}
        </Button>

          {categories.map(grp => {
            const active = grp.match.some(m => selectedCategories.includes(m))
            return (
              <Button
                key={grp.label}
                onClick={() => selectGroup(grp)}
                variant={active ? 'default' : 'glass-light'}
                size="sm"
                className="snap-start shrink-0 rounded-full px-4 py-2 text-[14px] font-bold gap-2 hover:-translate-y-0.5 active:scale-95"
              >
                <span className="text-base leading-none">{grp.icon}</span>
                {td(grp.label)}
              </Button>
            )
          })}
      </div>

      {/* Desktop Scroll Right */}
      {canScrollRight && (
        <Button
          onClick={() => scrollBy(300)}
          variant="glass-light"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-40 hidden md:flex rounded-full opacity-0 group-hover/bar:opacity-100 shadow-md"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-5" />
        </Button>
      )}
    </div>
  )
}
