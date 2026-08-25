'use client'

import { doc, updateDoc, deleteDoc, writeBatch, collection, addDoc } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { Stock } from '@/lib/products'

export async function updateProductStock(productId: string, newStock: Stock) {
  try {
    await updateDoc(doc(clientDb, 'products', productId), { stock: newStock })
    return { success: true }
  } catch (error) {
    console.error('Failed to update stock:', error)
    return { success: false, error }
  }
}

export async function updateProductPrice(productId: string, newPrice: number) {
  try {
    await updateDoc(doc(clientDb, 'products', productId), { price: newPrice })
    return { success: true }
  } catch (error) {
    console.error('Failed to update price:', error)
    return { success: false, error }
  }
}

/** Full product update — any fields */
export async function updateProduct(productId: string, fields: Record<string, any>) {
  try {
    await updateDoc(doc(clientDb, 'products', productId), fields)
    return { success: true }
  } catch (error) {
    console.error('Failed to update product:', error)
    return { success: false, error }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await updateDoc(doc(clientDb, 'orders', orderId), { status })
    return { success: true }
  } catch (error) {
    console.error('Failed to update order status:', error)
    return { success: false, error }
  }
}

export async function createProduct(productData: any) {
  try {
    const ref = await addDoc(collection(clientDb, 'products'), productData)
    return { success: true, id: ref.id }
  } catch (error) {
    console.error('Failed to create product:', error)
    return { success: false, error }
  }
}

export async function deleteProduct(productId: string) {
  try {
    await deleteDoc(doc(clientDb, 'products', productId))
    return { success: true }
  } catch (error) {
    console.error('Failed to delete product:', error)
    return { success: false, error }
  }
}

/** Delete multiple products in a single Firestore batch */
export async function deleteProducts(productIds: string[]) {
  try {
    const BATCH = 450
    for (let i = 0; i < productIds.length; i += BATCH) {
      const batch = writeBatch(clientDb)
      productIds.slice(i, i + BATCH).forEach(id =>
        batch.delete(doc(clientDb, 'products', id))
      )
      await batch.commit()
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to bulk delete products:', error)
    return { success: false, error }
  }
}
