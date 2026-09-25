'use server'

import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { unstable_noStore as noStore } from 'next/cache'

export async function fetchCategoryFilters() {
  noStore()
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

/** Returns all unique product categories directly from Firestore */
export async function fetchAllProductCategories() {
  try {
    const { db } = getFirebaseAdmin()
    const snap = await db.collection('products').select('category').get()
    const cats = new Set<string>()
    snap.docs.forEach(d => {
      const c = d.data().category
      if (c) cats.add(c)
    })
    return Array.from(cats).sort()
  } catch (err) {
    console.error('[fetchAllProductCategories] Error:', err)
    return []
  }
}

/**
 * Fix the category filter match arrays to align with the actual product
 * category values stored in Firestore. Called once via the /debug-categories/fix page.
 */
export async function fixCategoryMatches() {
  try {
    const { db } = getFirebaseAdmin()

    // Build corrected categories based on actual product data
    const correctedCategories = [
      {
        id: 'wheat-chapati-flour',
        label: 'Wheat & Chapati Flour',
        icon: '🌾',
        match: ['Atta', 'Rice & Atta'],  // actual values in products
        active: true,
        order: 0,
        createdAt: 1789855566786,
      },
      {
        id: 'basmati-rice',
        label: 'Basmati Rice',
        icon: '🍚',
        match: ['Rice & Grains'],  // actual value in products
        active: true,
        order: 1,
        createdAt: 1789855566786,
      },
      {
        id: 'lentils-pulses',
        label: 'Lentils & Pulses',
        icon: '🫘',
        match: [],  // no matching products found — will be hidden from storefront
        active: false,
        order: 2,
        createdAt: 1789855566786,
      },
      {
        id: 'spices-masala',
        label: 'Spices & Masala',
        icon: '🌶️',
        match: ['Spices', 'Other Spices'],  // actual values in products
        active: true,
        order: 3,
        createdAt: 1789855566786,
      },
      {
        id: 'snacks',
        label: 'Snacks',
        icon: '🍿',
        match: ['Snacks', 'Namkeen & Snacks'],  // actual values in products
        active: true,
        order: 4,
        createdAt: 1789855566786,
      },
      {
        id: 'sweets-desserts',
        label: 'Sweets & Desserts',
        icon: '🍮',
        match: ['Sweets'],  // actual value in products
        active: true,
        order: 5,
        createdAt: 1789855566786,
      },
      {
        id: 'frozen-foods',
        label: 'Frozen Foods',
        icon: '🧊',
        match: ['Foods', 'Frozen Foods'],  // "Foods" likely contains frozen
        active: true,
        order: 6,
        createdAt: 1789855566786,
      },
      {
        id: 'oils',
        label: 'Oils',
        icon: '🫙',
        match: ['Oils'],  // actual value in products
        active: true,
        order: 7,
        createdAt: 1789855566786,
      },
      {
        id: 'pickles',
        label: 'Pickles',
        icon: '🥒',
        match: ['Pickles'],  // actual value in products
        active: true,
        order: 8,
        createdAt: 1789855566786,
      },
      {
        id: 'tea-drinks',
        label: 'Tea & Drinks',
        icon: '🍵',
        match: ['Tea & Drinks'],  // actual value in products
        active: true,
        order: 9,
        createdAt: 1789855566786,
      },
      {
        id: 'fresh-vegetables',
        label: 'Fresh Vegetables',
        icon: '🥦',
        match: ['Fresh Vegetables', 'Vegetables & Produce', 'Vegetable produce'], 
        active: true,
        order: 10,
        createdAt: 1789855566786,
      },
      {
        id: 'soaps-personal-care',
        label: 'Personal Care',
        icon: '🧴',
        match: ['Soaps & Personal Care'],  // actual value in products
        active: true,
        order: 11,
        createdAt: 1789855566786,
      },
      // Ganpati Idols: user-created category — active and visible on storefront
      // Will show in filter dropdown; clicking it will return 0 results until
      // admin adds products with category "Idols" via the Products page
      {
        id: 'ganpati-idols',
        label: 'Ganpati Idols',
        icon: '🪔',
        match: ['Idols'],
        active: true,  // visible — admin explicitly created this
        order: 12,
        createdAt: 1789855686483,
      },
    ]

    await db.doc('settings/categoryFilters').set({ categories: correctedCategories })
    console.log('[fixCategoryMatches] Fixed', correctedCategories.length, 'categories')
    return { ok: true, count: correctedCategories.length }
  } catch (err: any) {
    console.error('[fixCategoryMatches] Error:', err)
    return { ok: false, error: err.message }
  }
}
