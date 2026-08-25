import { getFirebaseAdmin } from '../lib/firebase-admin.js'
import { PRODUCTS } from '../lib/products.js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function seed() {
  try {
    const { db } = getFirebaseAdmin()
    const batch = db.batch()

    const productsRef = db.collection('products')

    console.log(`Starting to seed ${PRODUCTS.length} products...`)

    for (const product of PRODUCTS) {
      const docRef = productsRef.doc(product.id)
      batch.set(docRef, product)
    }

    await batch.commit()
    console.log('Successfully seeded database with products!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seed()
