'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot, type DocumentData } from 'firebase/firestore'
import { clientDb } from './firebase-client'

export type ActiveOrder = {
  id: string
  ticketNum: string
  status: string
  itemsSummary: string
  amountTotal: number
  createdAt: any
}

export function useActiveOrder(email: string | null | undefined) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!email) {
      setActiveOrder(null)
      setLoading(false)
      return
    }

    setLoading(true)
    // Firestore caveat: inequality filter on 'status' requires 'status' to be the first orderBy
    const q = query(
      collection(clientDb, 'orders'),
      where('customerEmail', '==', email),
      where('status', '!=', 'Delivered'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
      limit(1)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setActiveOrder(null)
      } else {
        const doc = snapshot.docs[0]
        const data = doc.data() as DocumentData
        
        // Extract a ticket number from the document ID if not explicitly saved
        const ticketNum = data.ticketNum || doc.id.slice(0, 8).toUpperCase()
        
        setActiveOrder({
          id: doc.id,
          ticketNum,
          status: data.status || 'Processing',
          itemsSummary: data.itemsSummary || '',
          amountTotal: data.amountTotal || 0,
          createdAt: data.createdAt
        })
      }
      setLoading(false)
    }, (error) => {
      console.error('Error fetching active order:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [email])

  return { activeOrder, loading }
}
