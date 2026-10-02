import { NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

export async function GET() {
  try {
    const { db } = getFirebaseAdmin()
    
    // Fetch all existing orders
    const ordersSnap = await db.collection('orders').get()
    const batch = db.batch()
    let count = 0

    ordersSnap.forEach((doc) => {
      const data = doc.data()
      const trackingRef = db.collection('tracking').doc(doc.id)
      
      batch.set(trackingRef, {
        ticketNumber: data.ticketNumber || doc.id,
        customerName: data.customerName || 'Unknown',
        deliveryMethod: data.deliveryMethod || 'dpd',
        transitHub: data.transitHub || '',
        deliveryAddress: data.deliveryAddress || '',
        status: data.status || 'Pending',
        events: [{
          status: data.status || 'Pending',
          timestamp: data.createdAt || new Date()
        }],
        dpdParcelNumber: data.dpdParcelNumber || null,
        createdAt: data.createdAt || new Date(),
      }, { merge: true })
      
      count++
    })

    await batch.commit()

    return NextResponse.json({ message: `Successfully migrated ${count} existing orders into the tracking collection.` })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
