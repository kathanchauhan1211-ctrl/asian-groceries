'use client'

import { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot, setDoc, getDoc,
} from 'firebase/firestore'

// ─── Types ─────────────────────────────────────────────────────────────────────

/** The 4 fixed shop-category keys that match the storefront CollectionCards */
export type ShopCategoryKey = 'new-arrivals' | 'sale' | 'best-offer' | 'bestsellers'

/** Static metadata for each category */
export interface ShopCategoryDef {
  key: ShopCategoryKey
  label: string
  emoji: string
  color: string        // accent color (tailwind-safe hex)
  gradient: string     // card bg gradient
  description: string
}

/** Firestore document shape (one doc per category key) */
export interface ShopCategoryDoc {
  key: ShopCategoryKey
  pinnedProductIds: string[]  // manually pinned from order dots or product picker
  maxItems: number
}

// ─── Static definitions ────────────────────────────────────────────────────────

export const SHOP_CATEGORY_DEFS: ShopCategoryDef[] = [
  {
    key: 'best-offer',
    label: "Today's Best Offer",
    emoji: '🔥',
    color: '#F97316',
    gradient: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.08) 100%)',
    description: 'Hot deals under €5 — shown in the "Top Picks" popup',
  },
  {
    key: 'bestsellers',
    label: 'Bestsellers',
    emoji: '⭐',
    color: '#EAB308',
    gradient: 'linear-gradient(135deg, rgba(234,179,8,0.18) 0%, rgba(161,98,7,0.08) 100%)',
    description: 'Best-selling products — manually pin or auto-flag via product editor',
  },
  {
    key: 'new-arrivals',
    label: 'New Arrivals',
    emoji: '✨',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(29,78,216,0.08) 100%)',
    description: 'Recently added products — latest items first',
  },
  {
    key: 'sale',
    label: 'Sale',
    emoji: '🏷️',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(6,95,70,0.08) 100%)',
    description: 'Discounted products sorted by lowest price',
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function defaultDoc(key: ShopCategoryKey): ShopCategoryDoc {
  return { key, pinnedProductIds: [], maxItems: 15 }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useShopCategories (ADMIN version)
 *
 * Subscribes to all 4 shopCategories docs in real-time.
 * Provides helpers to pin / unpin products.
 *
 * @param db  The Firestore instance to use (admin portal db for admin pages)
 */
export function useShopCategories(db: import('firebase/firestore').Firestore) {
  const [docs, setDocs] = useState<Record<ShopCategoryKey, ShopCategoryDoc>>({
    'new-arrivals': defaultDoc('new-arrivals'),
    'sale': defaultDoc('sale'),
    'best-offer': defaultDoc('best-offer'),
    'bestsellers': defaultDoc('bestsellers'),
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const KEYS: ShopCategoryKey[] = ['new-arrivals', 'sale', 'best-offer', 'bestsellers']
    const unsubs = KEYS.map(key =>
      onSnapshot(
        doc(db, 'shopCategories', key),
        snap => {
          const data = snap.exists()
            ? (snap.data() as ShopCategoryDoc)
            : defaultDoc(key)
          setDocs(prev => ({ ...prev, [key]: { ...defaultDoc(key), ...data } }))
          setLoading(false)
        },
        (err: any) => {
          // permission-denied: Firestore rules not yet deployed — fall back silently
          if (err?.code !== 'permission-denied') {
            console.error('[useShopCategories] Firestore error:', err)
          }
          setLoading(false)
        },
      )
    )
    return () => unsubs.forEach(u => u())
  }, [db])

  /** Toggle a productId inside a category's pinnedProductIds */
  async function togglePin(key: ShopCategoryKey, productId: string) {
    const ref = doc(db, 'shopCategories', key)
    const snap = await getDoc(ref)
    const current: ShopCategoryDoc = snap.exists()
      ? (snap.data() as ShopCategoryDoc)
      : defaultDoc(key)

    const already = current.pinnedProductIds.includes(productId)
    const next = already
      ? current.pinnedProductIds.filter(id => id !== productId)
      : [productId, ...current.pinnedProductIds]

    await setDoc(ref, { ...current, key, pinnedProductIds: next }, { merge: true })
  }

  /** Replace pinned list entirely for a category */
  async function setPinnedIds(key: ShopCategoryKey, ids: string[]) {
    const ref = doc(db, 'shopCategories', key)
    const snap = await getDoc(ref)
    const current: ShopCategoryDoc = snap.exists()
      ? (snap.data() as ShopCategoryDoc)
      : defaultDoc(key)
    await setDoc(ref, { ...current, key, pinnedProductIds: ids }, { merge: true })
  }

  /** Update maxItems for a category */
  async function setMaxItems(key: ShopCategoryKey, max: number) {
    const ref = doc(db, 'shopCategories', key)
    await setDoc(ref, { maxItems: max }, { merge: true })
  }

  /** Returns true if a product is pinned to a given category */
  function isPinned(key: ShopCategoryKey, productId: string): boolean {
    return docs[key].pinnedProductIds.includes(productId)
  }

  return { docs, loading, togglePin, setPinnedIds, setMaxItems, isPinned }
}

// ─── Storefront hook (read-only, uses public clientDb) ─────────────────────────

/**
 * useShopCategoryProducts (STOREFRONT version)
 *
 * Returns the merged product list for a category:
 * pinned products first, then auto-rule products (deduped).
 */
export function useShopCategoryDoc(
  key: ShopCategoryKey,
  db: import('firebase/firestore').Firestore,
) {
  const [catDoc, setCatDoc] = useState<ShopCategoryDoc | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'shopCategories', key),
      snap => {
        if (snap.exists()) setCatDoc(snap.data() as ShopCategoryDoc)
        else setCatDoc(defaultDoc(key))
      },
      (err: any) => {
        if (err?.code !== 'permission-denied') {
          console.error('[useShopCategoryDoc] Firestore error:', err)
        }
        setCatDoc(defaultDoc(key))
      },
    )
    return () => unsub()
  }, [key, db])

  return catDoc
}
