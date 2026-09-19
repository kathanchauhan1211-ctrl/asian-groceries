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
 */

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { CATEGORY_GROUPS, type CategoryGroup } from '@/lib/products'

export type { CategoryGroup }

export type CategoryFilterState = {
  /** Live categories from Firestore (or static fallback while loading) */
  categories: CategoryGroup[]
  /** True while waiting for the first Firestore snapshot */
  loading: boolean
  /** Non-null if Firestore subscription errored */
  error: string | null
}

const SETTINGS_DOC = 'settings/categoryFilters'

/** Shape of a single category stored inside the Firestore document */
export type FirestoreCategory = {
  id: string
  label: string
  icon: string
  match: string[]
  active: boolean
  order: number
  createdAt?: any
}

/** Convert a Firestore category record to the CategoryGroup shape used by the storefront */
function toGroup(fc: FirestoreCategory): CategoryGroup {
  return {
    label: fc.label,
    icon:  fc.icon ?? '📦',
    match: Array.isArray(fc.match) ? fc.match : [],
  }
}

export function useCategoryFilters(): CategoryFilterState {
  const [categories, setCategories] = useState<CategoryGroup[]>(CATEGORY_GROUPS)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    const ref = doc(clientDb, SETTINGS_DOC)

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          const raw: FirestoreCategory[] = Array.isArray(data.categories) ? data.categories : []

          // Only show active categories, sorted by order field
          const active = raw
            .filter((c) => c.active !== false && c.id && c.label && c.match?.length > 0)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(toGroup)

          setCategories(active.length > 0 ? active : CATEGORY_GROUPS)
        } else {
          // Document doesn't exist yet — use static fallback
          setCategories(CATEGORY_GROUPS)
        }
        setLoading(false)
        setError(null)
      },
      (err: any) => {
        if (err.code === 'permission-denied') {
          console.warn('[useCategoryFilters] Permission denied reading settings/categoryFilters. Deploy firestore.rules to fix. Falling back to static categories.')
          setCategories(CATEGORY_GROUPS)
          setLoading(false)
          return
        }
        
        console.error('[useCategoryFilters] Firestore error:', err)
        setError(err.message)
        setCategories(CATEGORY_GROUPS) // fallback on error
        setLoading(false)
      },
    )

    return () => unsub()
  }, [])

  return { categories, loading, error }
}
