'use client'

import { useSearchParams } from 'next/navigation'
import { ProductCatalog } from '@/components/product-catalog'
import { ShopFloatingBasket } from '@/components/shop-floating-basket'
import { SwipeableCategoryBar } from '@/components/swipeable-category-bar'
import Link from 'next/link'

export default function PageContent() {
  const searchParams = useSearchParams()

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pt-4 pb-24">
        {/* ═══ Swipeable Category Bar ═══ */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-2 pb-6">
          <SwipeableCategoryBar
            prependFilterButton={
              <Link
                href="/shop"
                className="snap-start shrink-0 flex items-center justify-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-bold transition-all text-white hover:-translate-y-0.5 active:scale-95 shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--im-orange, #F97316), #ea580c)' }}
              >
                Shop All
              </Link>
            }
          />
        </div>

        {/* Full product catalog */}
        <ProductCatalog hideGridWhenUnfiltered={false} />
      </div>

      {/* Floating basket button just for shop page */}
      <ShopFloatingBasket />
    </>
  )
}
