'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { type Product } from '@/lib/products'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * AutoRule values stored in Firestore.
 *
 * Built-in rules:
 *   price_asc    → cheapest in-stock products  (Hot Picks / Best Offers)
 *   newest       → most recently added          (New Arrivals)
 *   bestseller   → products with bestseller:true
 *   low_stock    → products with stock === 'Low Stock'  (urgency)
 *   category:X   → products whose category matches X   (e.g. category:Spices)
 *   origin:X     → products from a specific origin     (e.g. origin:India)
 */
export type AutoRule =
  | 'price_asc'
  | 'newest'
  | 'bestseller'
  | 'low_stock'
  | `category:${string}`
  | `origin:${string}`

export interface FeaturedCollectionDoc {
  id: string
  title: string
  order: number
  enabled: boolean
  mode: 'auto' | 'manual'
  autoRule: AutoRule | ''
  productIds: string[]   // used when mode === 'manual'
  maxItems: number
  viewAllHref: string
}

/** Resolved — ready for the <HorizontalRow> component */
export interface FeaturedCollection {
  id: string
  title: string
  items: Product[]
  viewAllHref: string
}

// ─── Fallback carousels (shown when Firestore 'collections' is empty) ─────────
// Mirrors the current hardcoded behaviour in page-content.tsx so the storefront
// is never blank on first deployment.

function buildFallback(allProducts: Product[]): FeaturedCollection[] {
  if (allProducts.length === 0) return []

  const inStock = allProducts.filter(p => p.stock !== 'Out of Stock')
  const bestOffers = [...inStock].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)).slice(0, 15)
  const newArrivals = [...allProducts].reverse().slice(0, 15)
  const flagged     = allProducts.filter(p => p.bestseller)
  const bestsellers = flagged.length > 0 ? flagged : allProducts.slice(0, 10)

  const out: FeaturedCollection[] = []
  if (bestOffers.length)  out.push({ id: 'fb-offers',      title: "🔥 Today's Best Offers", items: bestOffers,  viewAllHref: '/?sort=price-asc' })
  if (newArrivals.length) out.push({ id: 'fb-arrivals',    title: '✨ New Arrivals',         items: newArrivals, viewAllHref: '/' })
  if (bestsellers.length) out.push({ id: 'fb-bestsellers', title: '⭐ Bestsellers',          items: bestsellers, viewAllHref: '/?sort=bestseller' })
  return out
}

// ─── Rule resolver ─────────────────────────────────────────────────────────────

function resolveItems(col: FeaturedCollectionDoc, allProducts: Product[]): Product[] {
  const max = col.maxItems || 15

  if (col.mode === 'manual') {
    const byId = new Map(allProducts.map(p => [p.id, p]))
    return col.productIds.map(id => byId.get(id)).filter(Boolean).slice(0, max) as Product[]
  }

  // Auto rules
  const rule = col.autoRule
  let pool = [...allProducts]

  if (rule === 'price_asc') {
    pool = pool.filter(p => p.stock !== 'Out of Stock')
    pool.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  } else if (rule === 'newest') {
    pool = pool.reverse()
  } else if (rule === 'bestseller') {
    pool = pool.filter(p => p.bestseller)
    // fallback — if nothing flagged, sort by name
    if (pool.length === 0) pool = [...allProducts].slice(0, max)
  } else if (rule === 'low_stock') {
    pool = pool.filter(p => p.stock === 'Low Stock')
  } else if (typeof rule === 'string' && rule.startsWith('category:')) {
    const cat = rule.slice('category:'.length).toLowerCase()
    pool = pool.filter(p => (p.category ?? '').toLowerCase() === cat)
  } else if (typeof rule === 'string' && rule.startsWith('origin:')) {
    const origin = rule.slice('origin:'.length).toLowerCase()
    pool = pool.filter(p => (p.origin ?? '').toLowerCase() === origin)
  }

  return pool.slice(0, max)
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useFeaturedCollections
 *
 * Subscribes in real-time to Firestore 'collections' (onSnapshot).
 * Resolves product items for each enabled collection using the already-loaded
 * `allProducts` array — no extra Firestore reads needed.
 *
 * Falls back to 3 hardcoded carousels when the Firestore collection is empty
 * (zero disruption on first deployment).
 */
export function useFeaturedCollections(allProducts: Product[]) {
  const [docs, setDocs]   = useState<FeaturedCollectionDoc[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const q = query(
      collection(clientDb, 'collections'),
      orderBy('order', 'asc'),
    )
    const unsub = onSnapshot(
      q,
      snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedCollectionDoc))
        setDocs(rows)
        setError(false)
      },
      () => setError(true),
    )
    return () => unsub()
  }, [])

  // Resolve collections → items each time products or docs change
  const collections: FeaturedCollection[] = (() => {
    // Still loading — return empty (page-content shows nothing until products load anyway)
    if (docs === null) return []

    // Firestore had an error or is empty → fall back to hardcoded carousels
    if (error || docs.length === 0) return buildFallback(allProducts)

    return docs
      .filter(d => d.enabled)
      .map(d => ({
        id:          d.id,
        title:       d.title,
        items:       resolveItems(d, allProducts),
        viewAllHref: d.viewAllHref || '/',
      }))
      .filter(c => c.items.length > 0)   // hide empty carousels
  })()

  return { collections, loading: docs === null }
}
