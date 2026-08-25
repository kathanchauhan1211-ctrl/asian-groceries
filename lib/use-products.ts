'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  getDocs,
  query,
  limit,
  startAfter,
  orderBy,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { type Product } from './products'

const PAGE_SIZE = 48

/**
 * Normalise a raw Firestore document into a safe Product shape.
 * Handles field name mismatches between admin portal and storefront.
 */
function normaliseProduct(id: string, data: any): Product {
  const price = parseFloat(data.price) || 0

  const variants: Product['variants'] =
    Array.isArray(data.variants) && data.variants.length > 0
      ? data.variants.map((v: any) => ({
          label: v.label ?? v.size ?? data.unit ?? '1 unit',
          size: v.size ?? v.label ?? data.unit ?? '1 unit',
          price: parseFloat(v.price) || price,
        }))
      : [{ label: data.unit ?? '1 unit', size: data.unit ?? '1 unit', price }]

  const diet: string[] =
    Array.isArray(data.diet) ? data.diet :
    Array.isArray(data.dietary) ? data.dietary :
    typeof data.dietary === 'string' && data.dietary
      ? data.dietary.split(',').map((d: string) => d.trim()).filter(Boolean)
      : []

  const stock: Product['stock'] =
    data.stock === 'In Stock'  ? 'In Stock'  :
    data.stock === 'Low Stock' ? 'Low Stock' :
    data.stock === 'Sold Out'  ? 'Out of Stock' :
    data.stock === 'Out of Stock' ? 'Out of Stock' :
    'In Stock'

  return {
    id,
    name:        data.name        ?? 'Unnamed Product',
    brand:       data.brand       ?? '',
    origin:      data.origin      ?? 'India',
    category:    data.category    ?? 'General',
    tagline:     data.tagline     ?? data.description ?? '',
    image:       data.image       ?? '',
    price,
    unit:        data.unit        ?? '1 unit',
    stock,
    diet,
    variants,
    bestseller:  data.bestseller  ?? false,
    description: data.description ?? '',
  }
}

/**
 * useProducts — paginated, single-fetch (getDocs not onSnapshot).
 *
 * Why getDocs and not onSnapshot?
 * - Products don't change every second. Real-time isn't needed for customers.
 * - onSnapshot keeps a persistent WebSocket open and re-renders ALL cards on
 *   every tiny Firestore write — brutal with 200+ products.
 * - getDocs fires once, returns data, done. Admin portal changes show on
 *   next page refresh (acceptable UX for a grocery shop).
 *
 * Pagination: loads PAGE_SIZE (48) products at a time.
 * Call loadMore() to fetch the next page.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)

  // Initial load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const q = query(
          collection(clientDb, 'products'),
          orderBy('name'),
          limit(PAGE_SIZE)
        )
        const snap = await getDocs(q)
        if (cancelled) return
        const docs = snap.docs.map(d => normaliseProduct(d.id, d.data()))
        setProducts(docs)
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
        setHasMore(snap.docs.length === PAGE_SIZE)
      } catch (err: any) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Load next page
  const loadMore = useCallback(async () => {
    if (!lastDoc || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const q = query(
        collection(clientDb, 'products'),
        orderBy('name'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map(d => normaliseProduct(d.id, d.data()))
      setProducts(prev => [...prev, ...docs])
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
      setHasMore(snap.docs.length === PAGE_SIZE)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingMore(false)
    }
  }, [lastDoc, loadingMore, hasMore])

  const errorCode = (error as any)?.code ?? null
  const errorMessage =
    errorCode === 'permission-denied'
      ? 'Firestore Security Rules are blocking reads. Go to Firebase Console → Firestore → Rules → Publish the rules.'
      : errorCode === 'unavailable'
      ? 'Cannot reach Firestore. Check your internet connection.'
      : error
      ? `Firestore error: ${error.message}`
      : null

  return { products, loading, loadingMore, hasMore, loadMore, error, errorCode, errorMessage }
}
