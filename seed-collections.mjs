/**
 * seed-collections.mjs
 * Run: node seed-collections.mjs
 * Deletes ALL docs in "collections" and seeds 4 feed collections.
 */
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, '.env.local'), 'utf8')

function getEnv(key) {
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  if (!match) throw new Error(`Missing ${key} in .env.local`)
  return match[1].replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n')
}

const app = initializeApp({
  credential: cert({
    projectId:   getEnv('FIREBASE_PROJECT_ID'),
    clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey:  getEnv('FIREBASE_PRIVATE_KEY'),
  }),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
})

const db = getFirestore(app)

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

async function run() {
  console.log('🗑️  Deleting ALL existing collections documents from Firestore...')
  const existingSnap = await db.collection('collections').get()
  const deletePromises = existingSnap.docs.map(d => {
    console.log(`   Deleting: ${d.id}`)
    return d.ref.delete()
  })
  await Promise.all(deletePromises)
  console.log(`   ✅ Deleted ${existingSnap.docs.length} old document(s)`)

  console.log('\n✍️  Creating 4 real feed collections...')
  for (const feed of FOUR_FEEDS) {
    const { id, ...data } = feed
    await db.collection('collections').doc(id).set(data)
    console.log(`   ✅ ${feed.emoji} "${feed.title}" → ID: ${id}`)
  }

  console.log('\n🚀 DONE! Firestore "collections" now has exactly 4 docs:')
  FOUR_FEEDS.forEach(f => console.log(`   ${f.emoji}  ${f.title}  (id: ${f.id})`))
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
