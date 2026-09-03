// components/account-order-status.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { clientDb } from '@/lib/firebase-client';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { StatusBadge, StatusVariant } from '@/components/ui/status-badge';

interface OrderDetail {
  status: string;
  timestamps: Record<string, any>;
  amountTotal: number;
  createdAt: string;
}

export default function AccountOrderStatus() {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    // Listen to the latest order of the user
    const q = query(
      collection(clientDb, 'orders'),
      where('customerEmail', '==', user.email),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data() as any;
        setOrder({
          status: data.status,
          timestamps: data.timestamps || {},
          amountTotal: data.amountTotal,
          createdAt: data.createdAt,
        });
      } else {
        setOrder(null);
      }
    });
    return () => unsub();
  }, [user?.email]);

  if (!order) return null;

  const statusMap: Record<string, StatusVariant> = {
    'Paid - Pending Acceptance': 'paid',
    Accepted: 'accepted',
    Preparing: 'preparing',
    Dispatched: 'dispatched',
    Delivered: 'delivered',
  };

  const steps: { label: string; key: string }[] = [
    { label: 'Paid', key: 'paid' },
    { label: 'Accepted', key: 'accepted' },
    { label: 'Preparing', key: 'preparing' },
    { label: 'Dispatched', key: 'dispatched' },
    { label: 'Delivered', key: 'delivered' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm mt-6">
      <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white mb-4">Order Status Timeline</h3>
      <ul className="space-y-3">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={step.key as StatusVariant}>{step.label}</StatusBadge>
              {order.timestamps[step.key] && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(order.timestamps[step.key]).toLocaleString()}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
