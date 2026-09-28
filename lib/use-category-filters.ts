/**
 * lib/use-category-filters.ts
 *
 * Pipeline: category-filter-pipeline
 *
 * Real-time Firestore hook that reads dynamic filter categories from
 * `settings/categoryFilters`. Admin writes to this document via the
 * Categories tab in the Products admin page.
 *
 * Falls back to the static CATEGORY_GROUPS from lib/products.ts while
 * the Firestore data is loading, so the storefront never shows an
 * empty filter list on first render.
 *
 * KEY FIX: now also exposes `matchMap` — a Record<label, string[]> that
 * maps each filter label (e.g. "Rice") to the raw Firestore `category`
 * values it should include (e.g. ["Rice"]). ProductCatalog uses this to
 * correctly filter products without hard-coding category name assumptions.
 */

import { useEffect, useState } from 'react'
import { CATEGORY_GROUPS, type CategoryGroup } from '@/lib/products'
import { onSnapshot, doc } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'

export type { CategoryGroup }

export type CategoryFilterState = {
  categories: CategoryGroup[]
  loading: boolean
  error: string | null
  /** Map from UI filter label → raw Firestore category strings to match against */
  matchMap: Record<string, string[]>
}

export type FirestoreCategory = {
  id: string
  label: string
  icon: string
  active: boolean
  order: number
  match?: string[]   // raw Firestore `category` values this label maps to
  createdAt?: any
}

function toGroup(fc: FirestoreCategory): CategoryGroup {
  return {
    label: fc.label,
    icon:  fc.icon ?? '📦',
  }
}

/** Build label → raw-category-values lookup from the Firestore category list */
function buildMatchMap(raw: FirestoreCategory[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const fc of raw) {
    if (!fc.label) continue
    // Use the match array if present, otherwise fall back to [label]
    map[fc.label] = Array.isArray(fc.match) && fc.match.length > 0
      ? fc.match
      : [fc.label]
  }
  return map
}

export function useCategoryFilters(): CategoryFilterState {
  const [categories, setCategories] = useState<CategoryGroup[]>(CATEGORY_GROUPS)
  const [matchMap,   setMatchMap]   = useState<Record<string, string[]>>({})
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(clientDb, 'settings/categoryFilters'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          if (data && Array.isArray(data.categories)) {
            const raw: FirestoreCategory[] = data.categories
            const active = raw
              .filter((c) => c.active !== false && c.id && c.label)
              .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
              .map(toGroup)

            setCategories(active.length > 0 ? active : CATEGORY_GROUPS)
            setMatchMap(buildMatchMap(raw))
          } else {
            setCategories(CATEGORY_GROUPS)
            setMatchMap({})
          }
        } else {
          setCategories(CATEGORY_GROUPS)
          setMatchMap({})
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[useCategoryFilters] Real-time error:', err)
        setCategories(CATEGORY_GROUPS)
        setMatchMap({})
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { categories, loading, error, matchMap }
}
