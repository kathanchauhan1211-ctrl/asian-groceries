// app/lib/order-types.ts

export type OrderStatus =
  | 'Pending Payment'
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
  ticketNumber?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  transitHub: string;
  grandTotal: number;       // written by /api/orders — use this field everywhere
  paymentStatus: string;
  status: OrderStatus;
  orderNotes: string;
  itemsSummary: string;
  createdAt: string; // ISO string
  timestamps: OrderTimestamps;
  // ── Fields added by the secure server-side order route ──────────────────
  paymentMethod?: string;
  items?: OrderLineItem[];
  subtotal?: number;
  deliveryFee?: number;
  totalWeight?: number;
}
