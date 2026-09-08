'use client'

import { useTranslation } from '@/lib/translation-context'
import Image from 'next/image'

export type CollectionCategory = 'new-arrivals' | 'sale' | 'best-offer' | 'bestsellers'

interface CollectionCardsProps {
  activeCategory: CollectionCategory | null
  onSelectCategory: (category: CollectionCategory | null) => void
}

const CATEGORIES = [
  { id: 'new-arrivals', label: 'New Arrivals', image: '/collections/new-arrivals.jpg' },
  { id: 'sale', label: 'Sale', image: '/collections/sale.jpg' },
  { id: 'best-offer', label: "Today's Best Offer", image: '/collections/best-offer.jpg' },
  { id: 'bestsellers', label: 'Bestsellers', image: '/collections/bestsellers.jpg' },
] as const

export function CollectionCards({ activeCategory, onSelectCategory }: CollectionCardsProps) {
  const { td } = useTranslation()

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {td('Shop by Category')}
        </h2>
      </div>
      
      <div className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(isActive ? null : cat.id as CollectionCategory)}
              className={`relative snap-start flex-shrink-0 cursor-pointer overflow-hidden rounded-md transition-all duration-300 w-[42vw] sm:w-[28vw] md:w-[22vw] lg:w-[22%] aspect-[3/4] ${
                isActive ? 'ring-2 ring-orange-500 shadow-xl scale-[1.02]' : 'shadow-md hover:shadow-xl hover:scale-[1.01]'
              }`}
            >
              <Image 
                src={cat.image} 
                alt={cat.label} 
                fill 
                className="object-cover transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 280px"
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex flex-col items-center justify-end h-full">
                 <h3 className="text-white font-extrabold text-base sm:text-lg md:text-xl tracking-tight text-center drop-shadow-md">
                   {td(cat.label)}
                 </h3>
                 {isActive && (
                   <span className="mt-2 h-1 w-8 bg-orange-500 rounded-full" />
                 )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
