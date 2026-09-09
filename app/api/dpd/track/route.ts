import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DpdStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'pickup_ready'
  | 'delivered'
  | 'exception'
  | 'unknown'

export interface DpdEvent {
  timestamp: string   // ISO 8601
  description: string
  location?: string
  code?: string
}

export interface DpdTrackResponse {
  parcelNumber: string
  status: DpdStatus
  statusLabel: string
  estimatedDelivery?: string  // ISO date string
  recipient?: string
  destinationCity?: string
  events: DpdEvent[]
}

// ─── Status mapping ──────────────────────────────────────────────────────────

/**
 * Maps raw DPD event codes to our normalised DpdStatus enum.
 * DPD Interconnector uses numeric codes per their Baltic specification.
 * Codes based on DPD Baltic integration documentation.
 */
function mapDpdCodeToStatus(code: string | undefined, description: string): DpdStatus {
  if (!code) return 'unknown'
  const c = String(code).trim()

  // Delivered
  if (['DS', 'DP', '71', 'OK'].includes(c)) return 'delivered'
  // Out for delivery
  if (['OD', '41', 'EO'].includes(c)) return 'out_for_delivery'
  // Ready at pickup point / parcel locker
  if (['PU', 'PR', 'PP'].includes(c)) return 'pickup_ready'
  // Exception / failed
  if (['EX', 'RD', 'ND', 'RT', 'MI'].includes(c)) return 'exception'
  // In transit (catch-all for transit codes)
  if (['IT', 'TR', 'AR', 'DE', 'HO', 'LD', 'UD', 'SO'].includes(c)) return 'in_transit'

  // Fallback: scan description keywords
  const desc = description.toLowerCase()
  if (desc.includes('delivered') || desc.includes('pristatyta')) return 'delivered'
  if (desc.includes('out for delivery') || desc.includes('išvežama')) return 'out_for_delivery'
  if (desc.includes('exception') || desc.includes('klaida')) return 'exception'
  if (desc.includes('transit') || desc.includes('tranzit')) return 'in_transit'

  return 'pending'
}

function statusToLabel(status: DpdStatus): string {
  const map: Record<DpdStatus, string> = {
    pending: 'Order Registered',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    pickup_ready: 'Ready for Pickup',
    delivered: 'Delivered',
    exception: 'Delivery Exception',
    unknown: 'Status Unknown',
  }
  return map[status]
}

// ─── DPD Interconnector caller ───────────────────────────────────────────────

async function fetchFromDpd(parcelNumber: string): Promise<DpdTrackResponse> {
  const apiKey = process.env.DPD_API_KEY
  const baseUrl = process.env.DPD_API_URL ?? 'https://esiunta.dpd.lt/api/v1'

  if (!apiKey) {
    throw new Error('DPD_API_KEY environment variable is not configured.')
  }

  // The exact path for tracking in esiunta.dpd.lt API (found via Swagger docs)
  const url = `${baseUrl}/status/tracking?pknr=${encodeURIComponent(parcelNumber)}&show_all=1&detail=2`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    // Next.js: don't cache DPD responses — tracking is always fresh
    cache: 'no-store',
  })

  if (res.status === 404) {
    throw new Error('PARCEL_NOT_FOUND')
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DPD API error ${res.status}: ${body}`)
  }

  const raw = await res.json()

  // ── Normalise the DPD response ──────────────────────────────────────────
  // DPD Baltic Interconnector returns an array of events under different
  // possible top-level keys depending on version. We handle common shapes.
  const eventList: any[] =
    raw?.parcelEvents?.event ??
    raw?.events ??
    raw?.tracking?.events ??
    raw?.event ??
    []

  // Ensure it's always an array (DPD sometimes returns single object when 1 event)
  const eventsArray: any[] = Array.isArray(eventList) ? eventList : [eventList]

  const events: DpdEvent[] = eventsArray
    .map((ev: any) => ({
      timestamp: ev?.eventTime ?? ev?.time ?? ev?.timestamp ?? '',
      description: ev?.eventDescription ?? ev?.description ?? ev?.desc ?? '',
      location: ev?.depotName ?? ev?.depot ?? ev?.location ?? ev?.city ?? undefined,
      code: ev?.eventCode ?? ev?.code ?? undefined,
    }))
    .filter((ev) => ev.description)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Determine overall status from latest event
  const latestEvent = events[0]
  const latestStatus = mapDpdCodeToStatus(latestEvent?.code, latestEvent?.description ?? '')

  return {
    parcelNumber,
    status: latestStatus,
    statusLabel: statusToLabel(latestStatus),
    estimatedDelivery:
      raw?.estimatedDeliveryDate ??
      raw?.expectedDelivery ??
      raw?.deliveryDate ??
      undefined,
    recipient:
      raw?.recipient?.name ??
      raw?.receiverName ??
      undefined,
    destinationCity:
      raw?.deliveryAddress?.city ??
      raw?.destinationCity ??
      raw?.city ??
      undefined,
    events,
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

/**
 * GET /api/dpd/track?parcel=<parcel_number>
 *
 * Proxies the DPD Interconnector tracking API. The DPD API credentials
 * live only in server-side env vars and are never sent to the browser.
 *
 * Also accepts Asian Groceries order ticket format (AG-XXXX-XXXX):
 * In that case, the Firestore order doc is looked up first to get the
 * dpdParcelNumber assigned by the admin at dispatch.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawInput = searchParams.get('parcel')?.trim() ?? ''

    if (!rawInput) {
      return NextResponse.json(
        { error: 'Missing parcel query parameter.' },
        { status: 400 },
      )
    }

    let dpdParcelNumber = rawInput

    // ── If it looks like an AG internal ticket, look up Firestore first ──
    if (rawInput.toUpperCase().startsWith('AG-')) {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const { db } = getFirebaseAdmin()

      // The Firestore order document ID is the ticket number itself
      const orderSnap = await db.collection('orders').doc(rawInput.toUpperCase()).get()

      if (!orderSnap.exists) {
        return NextResponse.json(
          {
            error: 'ORDER_NOT_FOUND',
            message: `No order found for ticket ${rawInput.toUpperCase()}. Please check your order number.`,
          },
          { status: 404 },
        )
      }

      const orderData = orderSnap.data()!
      const assignedParcelNumber: string | undefined = orderData.dpdParcelNumber

      if (!assignedParcelNumber) {
        // Order exists but DPD number not assigned yet (e.g. still processing)
        return NextResponse.json(
          {
            error: 'DPD_NOT_ASSIGNED',
            message: 'Your order has been received but a DPD parcel number has not been assigned yet. Please check back once your order is dispatched.',
            orderStatus: orderData.status ?? 'Pending',
          },
          { status: 202 },
        )
      }

      dpdParcelNumber = assignedParcelNumber
    }

    // ── Call DPD Interconnector ──────────────────────────────────────────
    const result = await fetchFromDpd(dpdParcelNumber)
    return NextResponse.json(result)

  } catch (err: any) {
    console.error('[GET /api/dpd/track] Error:', err)

    if (err.message === 'PARCEL_NOT_FOUND') {
      return NextResponse.json(
        {
          error: 'PARCEL_NOT_FOUND',
          message: 'No parcel found with that tracking number. Please check the number and try again.',
        },
        { status: 404 },
      )
    }

    if (err.message?.includes('not configured')) {
      return NextResponse.json(
        {
          error: 'SERVICE_UNAVAILABLE',
          message: 'DPD tracking service is not yet configured. Please contact support.',
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: 'UNEXPECTED_ERROR', message: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    )
  }
}
