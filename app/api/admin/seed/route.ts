import { NextResponse } from 'next/server'
import { getFirestore, collection, getDocs, addDoc, writeBatch, doc } from 'firebase/firestore'
import { initializeApp, getApps, getApp } from 'firebase/app'

// ─── Init Firebase (server-side client SDK) ──────────────────────────────────
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

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_SLIDES = [
  {
    img:      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
    brand:    'Aashirvaad',
    label:    'Atta & Flour',
    headline: "India's Most Loved Flour",
    sub:      'Soft rotis every time — authentic stone-ground atta',
    cta:      'Shop Flour',
    href:     '/?category=Rice+%26+Grains',
    order:    0,
    enabled:  true,
  },
  {
    img:      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=1600&q=80',
    brand:    'MDH',
    label:    'Spices & Masalas',
    headline: 'Real Taste, Real Spice',
    sub:      'MDH — trusted by generations across South Asia',
    cta:      'Shop Spices',
    href:     '/?category=Spices',
    order:    1,
    enabled:  true,
  },
  {
    img:      'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&q=80',
    brand:    'TRS',
    label:    'Lentils & Pulses',
    headline: 'Premium Quality Pulses',
    sub:      "TRS — the UK's #1 South Asian ingredient brand",
    cta:      'Shop Lentils',
    href:     '/?category=Lentils+%26+Pulses',
    order:    2,
    enabled:  true,
  },
]

const SEED_COLLECTIONS = [
  {
    title:       "🔥 Today's Best Offers",
    order:       0,
    enabled:     true,
    mode:        'auto',
    autoRule:    'price_asc',
    productIds:  [],
    maxItems:    15,
    viewAllHref: '/?sort=price-asc',
  },
  {
    title:       '✨ New Arrivals',
    order:       1,
    enabled:     true,
    mode:        'auto',
    autoRule:    'newest',
    productIds:  [],
    maxItems:    15,
    viewAllHref: '/',
  },
  {
    title:       '⭐ Bestsellers',
    order:       2,
    enabled:     true,
    mode:        'auto',
    autoRule:    'bestseller',
    productIds:  [],
    maxItems:    15,
    viewAllHref: '/?sort=bestseller',
  },
]

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST() {
  try {
    const results: Record<string, string> = {}

    // Seed slides only if empty
    const slidesSnap = await getDocs(collection(db, 'slides'))
    if (slidesSnap.empty) {
      for (const slide of SEED_SLIDES) {
        await addDoc(collection(db, 'slides'), slide)
      }
      results.slides = `Seeded ${SEED_SLIDES.length} slides`
    } else {
      results.slides = `Skipped — ${slidesSnap.size} slides already exist`
    }

    // Seed collections only if empty
    const collectionsSnap = await getDocs(collection(db, 'collections'))
    if (collectionsSnap.empty) {
      for (const col of SEED_COLLECTIONS) {
        await addDoc(collection(db, 'collections'), col)
      }
      results.collections = `Seeded ${SEED_COLLECTIONS.length} collections`
    } else {
      results.collections = `Skipped — ${collectionsSnap.size} collections already exist`
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  // Convenience: allow GET so we can just hit it from the browser address bar
  return POST()
}
