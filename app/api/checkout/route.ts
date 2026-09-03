import { NextResponse } from 'next/server'

/**
 * Bank transfer checkout — this endpoint is no longer needed since orders are
 * saved directly to Firestore from the client-side checkout form.
 *
 * Kept as a stub to avoid 404s from any old references. Returns a 410 Gone.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe checkout has been removed. Orders are placed via bank transfer.' },
    { status: 410 }
  )
}
