'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
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
  setOpen: (open: boolean) => void
  addItem: (product: Product, variant: Variant, quantity?: number) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setOpen] = useState(false)

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

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.variant.price, 0)
    const totalWeight = lines.reduce((sum, l) => sum + l.quantity * (l.variant.weightKg || 0), 0)
    return { lines, count, subtotal, totalWeight, isOpen, setOpen, addItem, updateQuantity, removeItem }
  }, [lines, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
