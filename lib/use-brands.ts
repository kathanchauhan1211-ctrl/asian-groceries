'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'

export interface BrandDoc {
  id: string
  order: number
  name: string
  tagline: string
  emoji: string
  image?: string
  color: string
  textColor: string
  href: string
  badge?: string
  active: boolean
}

export function useBrands() {
  const [brands, setBrands] = useState<BrandDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const q = query(collection(clientDb, 'brands'), orderBy('order', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrandDoc))
        setBrands(fetched)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching brands:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { brands, loading, error }
}
