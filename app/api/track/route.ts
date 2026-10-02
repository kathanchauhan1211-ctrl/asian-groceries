import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ticket = searchParams.get('ticket')?.trim()?.toUpperCase()

    if (!ticket || !ticket.startsWith('AG-') && !ticket.startsWith('ORD')) {
      return NextResponse.json({ error: 'Invalid order ticket format.' }, { status: 400 })
    }

    const { db } = getFirebaseAdmin()
    const trackSnap = await db.collection('tracking').doc(ticket).get()

    if (!trackSnap.exists) {
      return NextResponse.json({ error: 'Order tracking info not found.' }, { status: 404 })
    }

    const order = trackSnap.data()!

    return NextResponse.json({
      ticketNumber: order.ticketNumber,
      status: order.status,
      deliveryMethod: order.deliveryMethod || 'dpd',
      transitHub: order.transitHub,
      deliveryAddress: order.deliveryAddress,
      dpdParcelNumber: order.dpdParcelNumber,
      createdAt: order.createdAt,
    })
  } catch (err: any) {
    console.error('[GET /api/track] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
