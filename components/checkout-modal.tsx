'use client'

import { useCart } from '@/lib/cart-context'
import { CheckoutForm } from './checkout-form'
import { X } from 'lucide-react'

export function CheckoutModal() {
  const { isCheckoutOpen, setCheckoutOpen } = useCart()

  if (!isCheckoutOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="fixed inset-0" onClick={() => setCheckoutOpen(false)} />
      
      <div className="relative w-full max-w-lg mx-auto transform transition-all animate-in zoom-in-95 duration-300 ease-out">
        <button
          onClick={() => setCheckoutOpen(false)}
          className="absolute -top-3 -right-3 z-10 flex size-8 items-center justify-center rounded-full bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-md transition-all duration-200 ring-1 ring-slate-200"
          aria-label="Close checkout"
        >
          <X className="size-4" />
        </button>
        
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden w-full max-h-[85vh] overflow-y-auto custom-scrollbar ring-1 ring-slate-100">
          <CheckoutForm onComplete={(ticketNum) => {
            window.location.href = `/track?ticket=${ticketNum}`
          }} />
        </div>
      </div>
    </div>
  )
}
