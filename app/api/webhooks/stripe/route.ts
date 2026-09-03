import { NextResponse } from 'next/server'

/**
 * Stripe webhook — removed. No longer needed since Stripe is not used.
 * Returning 410 Gone to avoid confusion if any old webhook calls hit this route.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe webhooks have been removed from this application.' },
    { status: 410 }
  )
}
