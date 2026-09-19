import { NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

const CATEGORY_KEYS = ['new-arrivals', 'sale', 'best-offer', 'bestsellers'] as const

export async function POST() {
  try {
    const { db } = getFirebaseAdmin()
    const batch = db.batch()

    for (const key of CATEGORY_KEYS) {
      const ref = db.collection('shopCategories').doc(key)
      batch.set(ref, { key, pinnedProductIds: [], maxItems: 15 }, { merge: true })
    }

    await batch.commit()
    return NextResponse.json({ ok: true, message: 'All category feeds cleared' })
  } catch (err: any) {
    console.error('[clear-feeds]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
