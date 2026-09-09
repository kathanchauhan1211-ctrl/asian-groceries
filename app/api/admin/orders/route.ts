import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { getAdminEmail } from '@/lib/admin-config'
import { Resend } from 'resend'

/**
 * PATCH /api/admin/orders
 * Body: { orderId: string; status: string }
 *
 * Updates an order's status field using the Firebase Admin SDK.
 * This is necessary because Firestore security rules block ALL client-side
 * writes to the 'orders' collection (allow create, update, delete: if false).
 *
 * The caller must supply a valid Firebase ID token in the Authorization header.
 * Only the admin account (verified by email) is permitted.
 *
 * After updating, sends a non-blocking status-change email to the customer.
 */
export async function PATCH(req: NextRequest) {
  try {
    // 1. Verify the caller is the admin
    const authHeader = req.headers.get('authorization') ?? ''
    const idToken = authHeader.replace('Bearer ', '').trim()

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorised — missing token' }, { status: 401 })
    }

    const { auth, db } = getFirebaseAdmin()
    const decoded = await auth.verifyIdToken(idToken)

    if (decoded.email !== getAdminEmail()) {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    // 2. Parse & validate body
    const body = await req.json()
    const { orderId, status, dpdParcelNumber } = body as {
      orderId: string
      status: string
      dpdParcelNumber?: string
    }

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    // 3. Update via Admin SDK (bypasses client security rules)
    const updatePayload: Record<string, unknown> = { status }
    if (dpdParcelNumber && typeof dpdParcelNumber === 'string' && dpdParcelNumber.trim()) {
      updatePayload.dpdParcelNumber = dpdParcelNumber.trim()
    }
    await db.collection('orders').doc(orderId).update(updatePayload)

    // 4. Non-blocking customer status-change email
    ;(async () => {
      try {
        const resendApiKey = process.env.RESEND_API_KEY
        if (!resendApiKey) return

        // Fetch the order to get customer contact info
        const orderSnap = await db.collection('orders').doc(orderId).get()
        if (!orderSnap.exists) return

        const orderData = orderSnap.data()!
        const customerEmail: string | undefined = orderData.customerEmail
        const customerName: string = orderData.customerName ?? 'Customer'
        const ticketNumber: string = orderData.ticketNumber ?? orderId
        const grandTotal: number = orderData.grandTotal ?? 0
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

        if (!customerEmail) return

        const statusColor =
          status.toLowerCase().includes('delivered') ? '#16a34a' :
          status.toLowerCase().includes('dispatch') || status.toLowerCase().includes('transit') ? '#2563eb' :
          status.toLowerCase().includes('cancelled') ? '#dc2626' : '#d97706'

        const resend = new Resend(resendApiKey)
        await resend.emails.send({
          from: 'IndianMarket <onboarding@resend.dev>',
          to: [customerEmail],
          subject: `Order Update – ${ticketNumber} is now "${status}"`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;color:#1e293b;">
              <h2 style="color:#ea580c;">Order Status Update</h2>
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>Your order status has been updated:</p>
              <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid ${statusColor};">
                <p style="margin:0;font-size:18px;font-weight:700;color:${statusColor};">${status}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Ticket: ${ticketNumber}</p>
              </div>
              <p style="font-size:13px;color:#475569;">
                Grand Total: <strong>€${grandTotal.toFixed(2)}</strong>
              </p>
              <p style="font-size:12px;color:#94a3b8;">
                Track your order at
                <a href="${appUrl}/track?ticket=${ticketNumber}">${appUrl}/track</a>
              </p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('[PATCH /api/admin/orders] Status email failed (non-blocking):', emailErr)
      }
    })()

    return NextResponse.json({ success: true, orderId, status })
  } catch (err: any) {
    console.error('[PATCH /api/admin/orders] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}
