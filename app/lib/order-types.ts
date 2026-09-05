// app/lib/order-types.ts

export type OrderStatus =
  | 'Paid - Pending Acceptance'
  | 'Accepted'
  | 'Preparing'
  | 'Dispatched'
  | 'Delivered';

export interface OrderTimestamps {
  paid?: string; // ISO timestamp
  accepted?: string;
  preparing?: string;
  dispatched?: string;
  delivered?: string;
}

/** A single line item as written by the server-side /api/orders route */
export interface OrderLineItem {
  productId: string;
  productName: string;
  variantLabel: string;
  price: number;       // server-verified unit price
  quantity: number;
  lineTotal: number;   // price × quantity, calculated server-side
}

export interface Order {
  id: string;
  sessionId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  transitHub: string;
  amountTotal: number;
  paymentStatus: string;
  status: OrderStatus;
  orderNotes: string;
  itemsSummary: string;
  createdAt: string; // ISO string
  timestamps: OrderTimestamps;
  // ── Fields added by the secure server-side order route ──────────────────
  ticketNumber?: string;
  paymentMethod?: string;
  items?: OrderLineItem[];
  subtotal?: number;
  deliveryFee?: number;
  grandTotal?: number;
  totalWeight?: number;
}
