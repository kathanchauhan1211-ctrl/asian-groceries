import { NextResponse } from 'next/headers'
import Stripe from 'stripe'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
    } else {
      // In dev without webhooks, we can just parse the body
      event = JSON.parse(payload)
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const { db } = getFirebaseAdmin()
      const ordersRef = db.collection('orders')
      
      const orderData = {
        sessionId: session.id,
        customerEmail: session.customer_email || session.customer_details?.email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        paymentStatus: session.payment_status,
        status: 'Paid - Processing',
        orderNotes: session.metadata?.orderNotes || '',
        itemsSummary: session.metadata?.itemsSummary || '',
        createdAt: new Date().toISOString(),
      }

      await ordersRef.doc(session.id).set(orderData)
      console.log(`Order ${session.id} successfully recorded in Firestore!`)

      // NOTE: We could also trigger Resend emails from here
      // But we will handle that in a separate step or right here if needed
      
    } catch (err) {
      console.error('Error saving order to Firestore:', err)
      // Return 200 so Stripe doesn't retry infinitely if our DB is down,
      // or return 500 so they DO retry. Let's return 500 for retry.
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
