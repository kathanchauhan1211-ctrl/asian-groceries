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
}
