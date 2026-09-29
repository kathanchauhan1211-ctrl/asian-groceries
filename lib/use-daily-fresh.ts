'use client'

/**
 * lib/use-daily-fresh.ts
 *
 * Real-time hook for the Daily Fresh homepage section.
 * Reads from Firestore `dailyFresh` collection — two fixed docs:
 *   dailyFresh/vegetables  { title, emoji, productIds, enabled }
 *   dailyFresh/fruits      { title, emoji, productIds, enabled }
 *
 * Admin curates which products appear in each row via /admin/daily-fresh.
 */

import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'

export type DailyFreshRow = {
  id: string          // 'vegetables' | 'fruits'
  title: string
  emoji: string
  productIds: string[]
  enabled: boolean
}

export function useDailyFresh() {
  const [rows, setRows] = useState<DailyFreshRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(clientDb, 'settings'),
      (snap) => {
        const DEFAULT_ROWS: Record<string, Partial<DailyFreshRow>> = {
          vegetables: { title: 'Vegetables', emoji: '🥦' },
          fruits: { title: 'Fruits', emoji: '🍎' },
        }
        const data = snap.docs
          .filter(d => d.id.startsWith('dailyFresh_'))
          .map(d => {
            const id = d.id.replace('dailyFresh_', '')
            const docData = d.data()
            const defaults = DEFAULT_ROWS[id] || {}
            return {
              id,
              ...docData,
              title: docData.title ?? defaults.title ?? '',
              emoji: docData.emoji ?? defaults.emoji ?? '',
              productIds: docData.productIds ?? [],
              enabled: docData.enabled ?? true,
            } as DailyFreshRow
          })
          .filter(r => r.id !== 'all')
          .filter(r => r.enabled !== false)
        setRows(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return () => unsub()
  }, [])

  return { rows, loading }
}
