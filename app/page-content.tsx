'use client'

import { HeroBanner } from '@/components/hero-banner'
import { ProductCatalog } from '@/components/product-catalog'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Origin } from '@/lib/products'

export default function PageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get('q') || ''
  const originParam = searchParams.get('origin') as Origin | 'All' | null
  const origin = originParam || 'All'
  const category = searchParams.get('category') || null

  return (
    <>
      <HeroBanner onTrack={() => router.push('/track')} />
      <ProductCatalog query={query} origin={origin} activeCategory={category} />
    </>
  )
}
