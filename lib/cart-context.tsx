'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product, Variant } from '@/lib/products'

export type CartLine = {
  key: string
  product: Product
  variant: Variant
  quantity: number
}

type CartContextValue = {
  lines: CartLine[]
  count: number
  subtotal: number
  totalWeight: number
  isOpen: boolean
  isMounted: boolean
  setOpen: (open: boolean) => void
  isCheckoutOpen: boolean
  setCheckoutOpen: (open: boolean) => void
  addItem: (product: Product, variant: Variant, quantity?: number) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_STORAGE_KEY = 'ag_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setOpen] = useState(false)
  const [isCheckoutOpen, setCheckoutOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        setLines(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to parse cart from localStorage', err)
    } finally {
      setIsMounted(true)
    }
  }, [])

  // Sync cart to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
    }
  }, [lines, isMounted])

  function addItem(product: Product, variant: Variant, quantity = 1) {
    const key = `${product.id}__${variant.label}`
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key)
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
        )
      }
      return [...prev, { key, product, variant, quantity }]
    })
    setOpen(true)
  }

  function updateQuantity(key: string, quantity: number) {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
    )
  }

  function removeItem(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  function clearCart() {
    setLines([])
  }

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.variant.price, 0)
    const totalWeight = lines.reduce((sum, l) => sum + l.quantity * (l.variant.weightKg || 0), 0)
    return { 
      lines, count, subtotal, totalWeight, 
      isOpen, isMounted, setOpen, 
      isCheckoutOpen, setCheckoutOpen,
      addItem, updateQuantity, removeItem, clearCart 
    }
  }, [lines, isOpen, isCheckoutOpen, isMounted])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
