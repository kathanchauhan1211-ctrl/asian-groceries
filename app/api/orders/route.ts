import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'

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
  transitHub: string
  deliveryFee: number
  orderNotes: string
  paymentMethod: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a collision-resistant ticket number, e.g. AG-M4KJ2X-A9F3 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `AG-${timestamp}-${random}`
}

/** Builds the HTML for the confirmation email */
function buildOrderEmailHtml(params: {
  ticketNumber: string
  customerName: string
  grandTotal: number
  items: Array<{ productName: string; variantLabel: string; quantity: number; lineTotal: number }>
  transitHub: string
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
        <strong>Destination:</strong> ${params.transitHub}<br/>
        <strong>Payment:</strong> ${params.paymentMethod.replace('_', ' ')}
      </p>
      <p style="font-size:12px;color:#94a3b8;">
        Track your order at <a href="https://asianmarket.lt/track?ticket=${params.ticketNumber}">asianmarket.lt/track</a>
      </p>
    </div>
  `
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse & basic validate ──────────────────────────────────────────
    const body: OrderRequestBody = await req.json()
    const { items, customerName, customerPhone, customerEmail, transitHub, deliveryFee, orderNotes, paymentMethod } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }
    if (!customerName || !customerPhone || !transitHub) {
      return NextResponse.json({ error: 'Missing required customer fields.' }, { status: 400 })
    }
    if (typeof deliveryFee !== 'number' || deliveryFee < 0) {
      return NextResponse.json({ error: 'Invalid delivery fee.' }, { status: 400 })
    }

    // ── 2. Init Admin SDK ──────────────────────────────────────────────────
    const { db } = getFirebaseAdmin()

    // ── 3. Run atomic Firestore transaction ────────────────────────────────
    const ticketNumber = generateTicketNumber()

    // Build product doc refs outside the transaction so they can be reused
    const productRefs = items.map((item) =>
      db.collection('products').doc(item.productId),
    )

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

    const orderRef = db.collection('orders').doc() // pre-generate ID

    await db.runTransaction(async (transaction) => {
      // a) Read all product docs inside the transaction (for consistency)
      const productSnaps = await Promise.all(
        productRefs.map((ref) => transaction.get(ref)),
      )

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

      // e) Write the order document inside the transaction
      transaction.set(orderRef, {
        ticketNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail ?? null,
        transitHub,
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
        totalWeight: 0, // weight not tracked server-side without variant weightKg in DB
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    const grandTotal = subtotal + deliveryFee

    // ── 4. Non-blocking email (does NOT fail the order if email fails) ─────
    if (customerEmail) {
      ;(async () => {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')
          await resend.emails.send({
            from: 'Asian Groceries <onboarding@resend.dev>',
            to: [customerEmail],
            subject: `Order Confirmed – ${ticketNumber}`,
            html: buildOrderEmailHtml({
              ticketNumber,
              customerName,
              grandTotal,
              items: enrichedItems,
              transitHub,
              paymentMethod,
            }),
          })
        } catch (emailErr) {
          // Intentionally swallowed — email failure must never break the order
          console.error('[orders/route] Non-blocking email failed:', emailErr)
        }
      })()
    }

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
