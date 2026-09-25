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
import { CATEGORY_GROUPS, type CategoryGroup } from '@/lib/products'
import { onSnapshot, doc } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'

export type { CategoryGroup }

export type CategoryFilterState = {
  categories: CategoryGroup[]
  loading: boolean
  error: string | null
}

export type FirestoreCategory = {
  id: string
  label: string
  icon: string
  active: boolean
  order: number
  createdAt?: any
}

function toGroup(fc: FirestoreCategory): CategoryGroup {
  return {
    label: fc.label,
    icon:  fc.icon ?? '📦',
  }
}

export function useCategoryFilters(): CategoryFilterState {
  const [categories, setCategories] = useState<CategoryGroup[]>(CATEGORY_GROUPS)
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
          } else {
            setCategories(CATEGORY_GROUPS)
          }
        } else {
          setCategories(CATEGORY_GROUPS)
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[useCategoryFilters] Real-time error:', err)
        setCategories(CATEGORY_GROUPS)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { categories, loading, error }
}
