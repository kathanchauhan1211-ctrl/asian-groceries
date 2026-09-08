'use client'

import { memo, useState, useEffect } from 'react'
import { Check, Minus, Plus, ShoppingBag, Star, X, ChevronDown, AlertTriangle, HelpCircle, Shield, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useCart } from '@/lib/cart-context'
import { useTranslation } from '@/lib/translation-context'
import { ORIGIN_FLAG, type Product } from '@/lib/products'
import { Button } from '@/components/ui/button'

const STOCK_STYLES: Record<Product['stock'], { pill: string; label: React.ReactNode }> = {
  'In Stock':     { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'In Stock' },
  'Low Stock':    { pill: 'bg-amber-50  text-amber-700  border border-amber-200',  label: <span className="flex items-center gap-0.5"><AlertTriangle className="size-2.5" />Low Stock</span> },
  'Out of Stock': { pill: 'bg-rose-50   text-rose-700   border border-rose-200',   label: 'Sold Out' },
  'Sold Out':     { pill: 'bg-rose-50   text-rose-700   border border-rose-200',   label: 'Sold Out' },
}

// Tiny base64 grey blur placeholder — prevents CLS while real image loads
const BLUR_DATA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f8fafc' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='64' fill='%23cbd5e1'%3E%F0%9F%93%A6%3C/text%3E%3C/svg%3E`

// ─── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCart()
  const { td } = useTranslation()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // Use the first variant as default since we removed the variant selector for this view
  const variant = product.variants?.[0]
  const soldOut = product.stock === 'Out of Stock' || product.stock === 'Sold Out'
  
  const stockLabel = product.stock === 'Low Stock' && typeof product.stockCount === 'number'
    ? `Only ${product.stockCount} left!`
    : (product.stock === 'In Stock' ? 'In stock and ready to ship' : product.stock)

  function handleAdd() {
    if (soldOut || !variant) return
    addItem(product, variant, qty)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 900)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={onClose}>
      <div 
        className="relative w-full max-w-[55rem] bg-gradient-to-b from-[#1c2c4d] to-[#0c162c] shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* iOS style strong top white gradient shine for the modal */}
        <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        {/* Inner shadow for sharp 3D gel effect on the modal */}
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_2px_1px_rgba(255,255,255,0.15),inset_0_-3px_5px_rgba(0,0,0,0.4)] pointer-events-none" />

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-20 transition-colors bg-black/30 backdrop-blur-md rounded-full p-2">
           <X className="size-5" />
        </button>

        {/* Left side (Image) - Full bleed panel */}
        <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto flex items-center justify-center order-1 bg-black/20">
           <Image 
             src={product.image || PLACEHOLDER} 
             alt={product.name} 
             fill 
             className="object-cover" 
             sizes="(max-width: 768px) 100vw, 50vw"
           />
        </div>

        {/* Right side (Content) */}
        <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 overflow-y-auto order-2 flex flex-col custom-scrollbar relative z-10">
           {/* Breadcrumbs */}
           <div className="flex items-center gap-2 text-sm text-white/50 mb-3 font-medium tracking-wide">
              <span>{td(product.origin)}</span>
              <span className="text-white/20">/</span>
              <span>{product.brand || 'Store'}</span>
           </div>

           <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
             {td(product.name)}
           </h2>
           
           <div className="flex items-center flex-wrap gap-4 mb-5">
              <span className="text-2xl font-semibold text-white">€{(variant?.price ?? product.price ?? 0).toFixed(2)}</span>
           </div>

           <p className="text-base text-white/70 mb-8 leading-relaxed">
             {td(product.tagline)}
           </p>

           <div className={`flex items-center gap-2 text-sm font-medium mb-8 ${soldOut ? 'text-rose-400' : 'text-emerald-400'}`}>
              {!soldOut && <Check className="size-5" />}
              {soldOut && <AlertTriangle className="size-5" />}
              <span>{stockLabel}</span>
           </div>

           {/* Add Action Row */}
           <div className="mt-auto flex flex-col sm:flex-row items-center gap-4 pt-4">
             {/* Qty stepper */}
             <div className="flex items-center rounded-xl border border-white/10 h-12 bg-black/20 text-white w-full sm:w-auto shrink-0 shadow-inner">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 hover:text-orange-400 h-full flex items-center justify-center transition-colors">
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-4 hover:text-orange-400 h-full flex items-center justify-center transition-colors">
                  <Plus className="size-4" />
                </button>
             </div>

             <Button
               onClick={handleAdd}
               disabled={soldOut}
               variant={added ? 'emerald' : soldOut ? 'secondary' : 'default'}
               className="flex-1 h-12 text-base w-full shadow-lg"
             >
               {soldOut ? 'Sold Out' : added ? 'Added to bag' : 'Add to bag'}
             </Button>
           </div>
        </div>
      </div>
    </div>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
export const ProductCard = memo(function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem, lines } = useCart()
  const { td } = useTranslation()
  const [variantIndex, setVariantIndex] = useState(0)
  const [qty] = useState(1)
  const [added, setAdded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const variant = product.variants?.[variantIndex] ?? product.variants?.[0]
  const soldOut = product.stock === 'Out of Stock'
  const stockStyle = STOCK_STYLES[product.stock] ?? STOCK_STYLES['In Stock']
  const stockLabel = product.stock === 'Low Stock' && typeof product.stockCount === 'number'
    ? <span className="flex items-center gap-0.5 animate-pulse"><AlertTriangle className="size-2.5" />Only {product.stockCount} left!</span>
    : stockStyle.label

  // How many of this variant are already in the cart?
  const cartQty = lines
    .filter(l => l.product.id === product.id && l.variant.label === variant?.label)
    .reduce((sum, l) => sum + l.quantity, 0)
  const inCart = cartQty > 0

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (soldOut || !variant) return
    addItem(product, variant, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  const animClass = index < 12
    ? `card-enter card-enter-${Math.min((index % 6) + 1, 6)}`
    : ''

  return (
    <>
      {/* ── Card ── */}
      <div className={`group relative flex flex-col h-full ${animClass}`}>
        {/* Image Container - Enforce perfect square with exact corner rounding matching the reference */}
        <div className="relative w-full aspect-square overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800">
          <Image
            src={product.image || PLACEHOLDER}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-center group-hover:opacity-75 transition-opacity"
            placeholder="blur"
            blurDataURL={BLUR_DATA}
            loading="lazy"
          />
        </div>
        
        {/* Text Details - Flex grow to push button down, truncate texts to prevent uneven heights */}
        <div className="mt-4 flex justify-between gap-4 flex-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
              <button 
                onClick={() => setModalOpen(true)}
                className="focus:outline-none text-left w-full truncate"
                title={td(product.name)}
                aria-label={`View details for ${td(product.name)}`}
              >
                <span aria-hidden="true" className="absolute inset-0 z-0" />
                {td(product.name)}
              </button>
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
              {variant?.label ? td(variant.label) : td(product.tagline)}
            </p>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white shrink-0">
            €{(variant?.price ?? product.price ?? 0).toFixed(2)}
          </p>
        </div>

        {/* Add button - Aligned cleanly at the bottom */}
        <div className="mt-4 relative z-10">
          <Button
            onClick={handleAdd}
            disabled={soldOut}
            variant={added ? 'emerald' : soldOut ? 'secondary' : inCart ? 'glass-light' : 'default'}
            size="sm"
            className="w-full rounded-md"
          >
            {soldOut ? 'Sold Out'
              : added ? <><Check className="size-3" /> Added!</>
              : inCart ? <><Check className="size-3" /> In Cart ({cartQty})</>
              : <><ShoppingBag className="size-3" /> Add</>}
          </Button>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {modalOpen && (
        <ProductModal product={product} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
})
