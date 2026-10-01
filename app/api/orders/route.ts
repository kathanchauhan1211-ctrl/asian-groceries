import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { DESTINATIONS, getDestinationById } from '@/lib/destinations'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string
  variantLabel: string
  quantity: number
}

interface OrderRequestBody {
  items: OrderItem[]
  customerName: string
  customerPhone: string
  customerEmail: string | null
  transitHub: string // Used for bus terminal or empty for others
  deliveryMethod: string // 'dpd', 'bus', 'pickup'
  deliveryAddress: string // Home address or empty
  orderNotes: string
  paymentMethod: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 
 * Removed old static generateTicketNumber.
 * Ticket numbers are now generated transactionally inside the route.
 */

/** Builds the HTML for the confirmation email */
function buildOrderEmailHtml(params: {
  ticketNumber: string
  customerName: string
  grandTotal: number
  items: Array<{ productName: string; variantLabel: string; quantity: number; lineTotal: number }>
  transitHub: string
  deliveryMethod: string
  paymentMethod: string
}): string {
  const itemRows = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${i.quantity}× ${i.productName} (${i.variantLabel})</td>
          <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">€${i.lineTotal.toFixed(2)}</td>
        </tr>`,
    )
    .join('')

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
      <h2 style="color:#ea580c;">🛒 Order Confirmed – Asian Groceries</h2>
      <p>Hi <strong>${params.customerName}</strong>, your order has been received!</p>

      <table width="100%" style="border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;text-align:left;font-size:12px;color:#64748b;">Item</th>
            <th style="padding:8px;text-align:right;font-size:12px;color:#64748b;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:10px 8px;font-weight:700;">Grand Total</td>
            <td style="padding:10px 8px;font-weight:700;text-align:right;color:#ea580c;">€${params.grandTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size:13px;color:#475569;">
        <strong>Ticket:</strong> ${params.ticketNumber}<br/>
        <strong>Destination/Address:</strong> ${params.transitHub || params.deliveryMethod === 'dpd' ? 'Home Delivery' : 'Store Pickup'}<br/>
        <strong>Payment:</strong> ${params.paymentMethod.replace('_', ' ')}
      </p>
      <p style="font-size:12px;color:#94a3b8;">
        Track your order at <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://asianmarket.lt'}/track?ticket=${params.ticketNumber}">${process.env.NEXT_PUBLIC_APP_URL ?? 'https://asianmarket.lt'}/track</a>
      </p>
    </div>
  `
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse & basic validate ──────────────────────────────────────────
    const body: OrderRequestBody = await req.json()
    const { items, customerName, customerPhone, customerEmail, transitHub, deliveryMethod, deliveryAddress, orderNotes, paymentMethod } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required customer fields.' }, { status: 400 })
    }

    // ── Server-side delivery fee lookup (prevents client price tampering) ──────
    let deliveryFee = 0
    if (deliveryMethod === 'bus') {
      const destination = getDestinationById(transitHub)
      if (!destination) {
        return NextResponse.json({ error: `Unknown transit hub: ${transitHub}` }, { status: 400 })
      }
      deliveryFee = destination.price
    } else if (deliveryMethod === 'dpd') {
      deliveryFee = 5.00 // Fixed DPD price
    } else if (deliveryMethod === 'pickup') {
      deliveryFee = 0.00
    } else {
      return NextResponse.json({ error: 'Invalid delivery method.' }, { status: 400 })
    }

    // ── 2. Init Admin SDK ──────────────────────────────────────────────────
    const { db } = getFirebaseAdmin()

    // ── 3. Run atomic Firestore transaction ────────────────────────────────
    // Build product doc refs outside the transaction so they can be reused
    const productRefs = items.map((item) =>
      db.collection('products').doc(item.productId),
    )

    let ticketNumber = ''
    let orderRef: any = null

    // Holds enriched line items we'll use after the transaction
    let enrichedItems: Array<{
      productId: string
      productName: string
      variantLabel: string
      price: number
      quantity: number
      lineTotal: number
    }> = []

    let subtotal = 0

    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yy = String(now.getFullYear()).slice(-2)
    const mmyy = `${mm}${yy}`

    await db.runTransaction(async (transaction) => {
      // a) Read all product docs and counter inside the transaction
      const counterRef = db.collection('counters').doc('order_number')
      
      const [counterSnap, ...productSnaps] = await Promise.all([
        transaction.get(counterRef),
        ...productRefs.map((ref) => transaction.get(ref))
      ])

      let count = 1
      if (counterSnap.exists) {
        const data = counterSnap.data()!
        if (data.currentMonth === mmyy) {
          count = (data.count || 0) + 1
        }
      }

      const xxxx = String(count).padStart(4, '0')
      ticketNumber = `ORD${dd}${mmyy}-${xxxx}`
      orderRef = db.collection('orders').doc(ticketNumber)

      transaction.set(counterRef, { currentMonth: mmyy, count })

      enrichedItems = [] // reset inside transaction for retry safety
      subtotal = 0

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const snap = productSnaps[i]

        if (!snap.exists) {
          throw new Error(`Product not found: ${item.productId}`)
        }

        const data = snap.data()!
        const productName: string = data.name ?? 'Unknown Product'

        // b) Find matching variant by label for server-side price lookup
        const variants: Array<{ label?: string; size?: string; price?: number | string }> =
          Array.isArray(data.variants) ? data.variants : []

        const matchedVariant = variants.find(
          (v) =>
            (v.label ?? v.size ?? '') === item.variantLabel,
        )

        if (!matchedVariant) {
          throw new Error(
            `Variant "${item.variantLabel}" not found for product "${productName}". Please refresh and try again.`,
          )
        }

        const unitPrice = parseFloat(String(matchedVariant.price ?? data.price ?? '0'))
        if (isNaN(unitPrice) || unitPrice <= 0) {
          throw new Error(`Invalid price for "${productName}" — ${item.variantLabel}.`)
        }

        // c) Stock check — only enforce if stockCount is present on the document
        const stockCount: number | undefined =
          typeof data.stockCount === 'number' ? data.stockCount : undefined

        if (stockCount !== undefined && stockCount < item.quantity) {
          throw new Error(
            `Insufficient stock for "${productName}". Only ${stockCount} left, but ${item.quantity} requested.`,
          )
        }

        const lineTotal = unitPrice * item.quantity
        subtotal += lineTotal

        enrichedItems.push({
          productId: item.productId,
          productName,
          variantLabel: item.variantLabel,
          price: unitPrice,
          quantity: item.quantity,
          lineTotal,
        })

        // d) Atomically decrement stockCount (only if the field exists)
        if (stockCount !== undefined) {
          transaction.update(productRefs[i], {
            stockCount: FieldValue.increment(-item.quantity),
          })
        }
      }

      const grandTotal = subtotal + deliveryFee

      // Computed summary string for admin orders list display
      const itemsSummary = enrichedItems
        .map((i) => `${i.quantity}× ${i.productName} (${i.variantLabel})`)
        .join(', ')

      // e) Write the order document inside the transaction
      transaction.set(orderRef, {
        ticketNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail ?? null,
        transitHub,
        deliveryMethod,
        deliveryAddress,
        orderNotes: orderNotes ?? '',
        paymentMethod,
        paymentStatus: 'Pending Payment - Bank Transfer',
        status: 'Pending Payment',
        items: enrichedItems.map(({ productId, productName, variantLabel, price, quantity, lineTotal }) => ({
          productId,
          productName,
          variantLabel,
          price,
          quantity,
          lineTotal,
        })),
        subtotal,
        deliveryFee,
        grandTotal,
        itemsSummary,
        totalWeight: 0, // weight not tracked server-side without variant weightKg in DB
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    // Compute grandTotal in outer scope (subtotal + deliveryFee are declared above the transaction)
    const grandTotal = subtotal + deliveryFee

    // ── 4. Non-blocking customer confirmation email ────────────────────────
    if (customerEmail) {
      ;(async () => {
        try {
          const resendApiKey = process.env.RESEND_API_KEY
          if (!resendApiKey) {
            console.error('[orders/route] RESEND_API_KEY is not set — order confirmation email will NOT be sent. Set this env var in production.')
            return
          }
          const resend = new Resend(resendApiKey)
          await resend.emails.send({
            from: 'IndianMarket <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `Order Confirmed – ${ticketNumber}`,
            html: buildOrderEmailHtml({
              ticketNumber,
              customerName,
              grandTotal,
              items: enrichedItems,
              transitHub,
              paymentMethod,
              deliveryMethod,
            }),
          })
        } catch (emailErr) {
          // Intentionally swallowed — email failure must never break the order
          console.error('[orders/route] Non-blocking customer email failed:', emailErr)
        }
      })()
    }

    // ── 4b. Non-blocking admin alert email (new order notification) ────────
    ;(async () => {
      try {
        const resendApiKey = process.env.RESEND_API_KEY
        const adminEmail = process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL
        if (!resendApiKey || !adminEmail) return
        const resend = new Resend(resendApiKey)
        const itemsSummaryText = enrichedItems
          .map((i) => `${i.quantity}× ${i.productName} (${i.variantLabel}) — €${i.lineTotal.toFixed(2)}`)
          .join('<br/>')
        await resend.emails.send({
          from: 'IndianMarket Orders <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `🛒 New Order ${ticketNumber} — €${grandTotal.toFixed(2)}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;color:#1e293b;">
              <h2 style="color:#ea580c;">New Order Received</h2>
              <p><strong>Ticket:</strong> ${ticketNumber}</p>
              <p><strong>Customer:</strong> ${customerName} ${customerEmail ? `(${customerEmail})` : ''}</p>
              <p><strong>Phone:</strong> ${customerPhone}</p>
              <p><strong>Delivery Method:</strong> ${deliveryMethod.toUpperCase()}</p>
              <p><strong>Destination/Address:</strong> ${deliveryMethod === 'bus' ? transitHub : (deliveryMethod === 'dpd' ? deliveryAddress : 'Store Pickup')}</p>
              <p><strong>Payment:</strong> ${paymentMethod.replace('_', ' ')}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;"/>
              <p style="font-size:13px;">${itemsSummaryText}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;"/>
              <p><strong>Grand Total: €${grandTotal.toFixed(2)}</strong></p>
              <p style="font-size:12px;color:#94a3b8;">
                Manage this order at
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/orders">Admin → Orders</a>
              </p>
            </div>
          `,
        })
      } catch (adminEmailErr) {
        console.error('[orders/route] Non-blocking admin alert email failed:', adminEmailErr)
      }
    })()

    // ── 5. Return success payload ──────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        orderId: orderRef.id,
        ticketNumber,
        grandTotal,
      },
      { status: 201 },
    )
  } catch (err: any) {
    console.error('[POST /api/orders] Error:', err)

    // Distinguish known business-logic errors (400) from unexpected ones (500)
    const isBusinessError =
      err.message?.includes('Insufficient stock') ||
      err.message?.includes('not found') ||
      err.message?.includes('Invalid price') ||
      err.message?.includes('Variant')

    return NextResponse.json(
      { error: err.message ?? 'An unexpected error occurred. Please try again.' },
      { status: isBusinessError ? 400 : 500 },
    )
  }
}
