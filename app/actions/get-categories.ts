'use server'

import { getFirebaseAdmin } from '@/lib/firebase-admin'

export async function fetchCategoryFilters() {
  try {
    const { db } = getFirebaseAdmin()
    const snap = await db.doc('settings/categoryFilters').get()
    if (!snap.exists) return null
    return snap.data()
  } catch (err) {
    console.error('[fetchCategoryFilters] Error:', err)
    return null
  }
}
