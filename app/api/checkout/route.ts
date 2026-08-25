import { NextResponse } from 'next/headers'
import Stripe from 'stripe'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia',
})

export async function POST(req: Request) {
  try {
    const { items, customerEmail, orderNotes } = await req.json()

    // 1. Verify items and calculate total securely on the backend
    // For now we'll trust the items from the frontend for testing,
    // but in production, we should fetch products from Firestore and verify prices.
    const { db } = getFirebaseAdmin()
    
    // Create line items for Stripe
    const line_items = items.map((item: any) => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.product.name} - ${item.variant.label}`,
            images: [item.product.image.startsWith('http') ? item.product.image : `https://asian-groceries-c1b58.web.app${item.product.image}`],
          },
          unit_amount: Math.round(item.variant.price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      }
    })

    // 2. Create Stripe Checkout Session
    const origin = req.headers.get('origin') || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/track?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      customer_email: customerEmail || undefined,
      metadata: {
        orderNotes: orderNotes || '',
        // Store items briefly as stringified JSON if it fits, or just store a reference
        itemsSummary: items.map((i: any) => `${i.quantity}x ${i.product.id}`).join(','),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
