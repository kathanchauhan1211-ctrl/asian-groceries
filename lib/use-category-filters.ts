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
import { fetchCategoryFilters } from '@/app/actions/get-categories'

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
  match: string[]
  active: boolean
  order: number
  createdAt?: any
}

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
    let mounted = true
    
    async function load() {
      try {
        const data = await fetchCategoryFilters()
        if (!mounted) return
        
        if (data && Array.isArray(data.categories)) {
          const raw: FirestoreCategory[] = data.categories
          const active = raw
            .filter((c) => c.active !== false && c.id && c.label && c.match?.length > 0)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(toGroup)

          setCategories(active.length > 0 ? active : CATEGORY_GROUPS)
        } else {
          setCategories(CATEGORY_GROUPS)
        }
      } catch (err: any) {
        if (mounted) {
          console.error('[useCategoryFilters] Error:', err)
          setError(err.message)
          setCategories(CATEGORY_GROUPS)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    load()
    
    return () => { mounted = false }
  }, [])

  return { categories, loading, error }
}
