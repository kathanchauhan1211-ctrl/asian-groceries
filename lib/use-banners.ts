'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, Firestore } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'

export type BannerPosition = 'main' | 'secondary_top' | 'secondary_bottom'

export interface BannerConfig {
  id: string
  position: BannerPosition
  title: string
  subtitle: string
  tagline?: string
  image: string
  link: string
  bgColor: string
  textColor: string
  active: boolean
  order: number
}

// Fallback banners if Firestore is empty or errors
const FALLBACK_BANNERS: BannerConfig[] = [
  {
    id: 'main-fallback',
    position: 'main',
    title: 'Ganesh Idols',
    subtitle: 'FESTIVE SEASON LAUNCH',
    tagline: 'Bring home blessings and prosperity today.',
    image: 'https://images.unsplash.com/photo-1563204907-8818c991f807?auto=format&fit=crop&q=80',
    link: '/shop?q=Ganesh',
    bgColor: '#4A2323',
    textColor: '#FFFFFF',
    active: true,
    order: 1,
  },
  {
    id: 'secondary-top-fallback',
    position: 'secondary_top',
    title: 'FRESH VEGGIES',
    subtitle: 'GUARANTEED',
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80',
    link: '/shop?category=Fresh+Vegetables',
    bgColor: '#F59E0B',
    textColor: '#111827',
    active: true,
    order: 2,
  },
  {
    id: 'secondary-bottom-fallback',
    position: 'secondary_bottom',
    title: 'SAME DAY DELIVERY',
    subtitle: 'IN BERLIN',
    tagline: 'Free Delivery from €39.99',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
    link: '/shop',
    bgColor: '#10B981',
    textColor: '#FFFFFF',
    active: true,
    order: 3,
  }
]

export function useBanners(db: Firestore = clientDb) {
  const [banners, setBanners] = useState<BannerConfig[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) {
        setBanners(FALLBACK_BANNERS)
      } else {
        setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as BannerConfig)))
      }
      setError(false)
    }, (err) => {
      console.error('Error fetching banners:', err)
      setError(true)
      setBanners(FALLBACK_BANNERS)
    })
    return () => unsub()
  }, [db])

  return { banners, loading: banners === null, error }
}
