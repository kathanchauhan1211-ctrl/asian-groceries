import { NextResponse } from 'next/server'
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { initializeApp, getApps, getApp } from 'firebase/app'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const db  = getFirestore(app)

const FOUR_FEEDS = [
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    description: 'Fresh products just added to the store',
    emoji: '✨',
    color: '#3B82F6',
    image: '/collections/new-arrivals.jpg',
    order: 0,
    enabled: true,
    mode: 'auto',
    autoRule: 'newest',
    productIds: [],
    maxItems: 15,
    viewAllHref: '/',
  },
  {
    id: 'bestsellers',
    title: 'Bestsellers',
    description: 'Our most popular products',
    emoji: '⭐',
    color: '#EAB308',
    image: '/collections/bestsellers.jpg',
    order: 1,
    enabled: true,
    mode: 'auto',
    autoRule: 'bestseller',
    productIds: [],
    maxItems: 15,
    viewAllHref: '/?sort=bestseller',
  },
  {
    id: 'best-offer',
    title: "Today's Best Offer",
    description: 'Hot deals and lowest prices',
    emoji: '🔥',
    color: '#F97316',
    image: '/collections/best-offer.jpg',
    order: 2,
    enabled: true,
    mode: 'auto',
    autoRule: 'price_asc',
    productIds: [],
    maxItems: 15,
    viewAllHref: '/?sort=price-asc',
  },
  {
    id: 'sale',
    title: 'Sale',
    description: 'Discounted items and special offers',
    emoji: '🏷️',
    color: '#10B981',
    image: '/collections/sale.jpg',
    order: 3,
    enabled: true,
    mode: 'auto',
    autoRule: 'price_asc',
    productIds: [],
    maxItems: 15,
    viewAllHref: '/?sort=price-asc',
  },
]

export async function GET() {
  try {
    // 1. Delete all existing collection docs
    const snap = await getDocs(collection(db, 'feed'))
    const deleted: string[] = []
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'feed', d.id))
      deleted.push(d.id)
    }

    // 2. Create the 4 proper feed collections
    const created: string[] = []
    for (const feed of FOUR_FEEDS) {
      const { id, ...data } = feed
      await setDoc(doc(db, 'feed', id), data)
      created.push(id)
    }

    return NextResponse.json({
      success: true,
      deleted,
      created,
      message: `Deleted ${deleted.length} old docs, created ${created.length} new feed collections.`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
