// components/homepage-status.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { clientDb } from '@/lib/firebase-client';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, PackageCheck, XCircle } from 'lucide-react';

interface OrderPreview {
  id: string;
  ticketNum: string;
  status: string;
  amountTotal: number;
  createdAt: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Paid - Pending Acceptance': {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Clock className="h-3 w-3" />,
  },
  'Accepted': {
    label: 'Accepted',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  'Preparing': {
    label: 'Preparing',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: <Package className="h-3 w-3" />,
  },
  'Dispatched': {
    label: 'On the way',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: <Truck className="h-3 w-3" />,
  },
  'Delivered': {
    label: 'Delivered',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <PackageCheck className="h-3 w-3" />,
  },
};

export default function HomepageStatus() {
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderPreview | null | undefined>(undefined); // undefined = loading, null = no orders

  useEffect(() => {
    if (!user?.email) {
      setOrder(null);
      return;
    }
    const q = query(
      collection(clientDb, 'orders'),
      where('customerEmail', '==', user.email),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data() as any;
          setOrder({
            id: docSnap.id,
            ticketNum: docSnap.id.slice(0, 8).toUpperCase(),
            status: data.status ?? 'Processing',
            amountTotal: data.amountTotal ?? 0,
            createdAt: data.createdAt,
          });
        } else {
          setOrder(null);
        }
      },
      (err) => {
        console.warn('[HomepageStatus] Firestore error:', err.code);
        setOrder(null);
      }
    );
    return () => unsub();
  }, [user?.email]);

  // Not logged in → render nothing
  if (!user) return null;

  // Loading state → slim skeleton
  if (order === undefined) {
    return (
      <div className="mx-4 mt-3 mb-1 sm:mx-6 lg:mx-8">
        <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const cfg = order ? (STATUS_CONFIG[order.status] ?? STATUS_CONFIG['Paid - Pending Acceptance']) : null;

  return (
    <div className="mx-4 mt-3 mb-1 sm:mx-6 lg:mx-8">
      <Link href="/dashboard" className="block group">
        <div
          className={`
            flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm
            transition-all duration-200 hover:shadow-md
            ${order && cfg
              ? `${cfg.bg} ${cfg.border}`
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }
          `}
        >
          {/* Icon */}
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm
              ${order && cfg ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}
            `}
          >
            {order && cfg ? cfg.icon : <Package className="h-4 w-4" />}
          </span>

          {/* Text */}
          <div className="min-w-0 flex-1">
            {order ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none mb-0.5">
                  Latest Order · #{order.ticketNum}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${cfg?.color}`}>
                    {cfg?.label ?? order.status}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    €{order.amountTotal.toFixed(2)}
                  </span>
                  {/* Animated pulse dot for active statuses */}
                  {order.status !== 'Delivered' && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg?.color.includes('amber') ? 'bg-amber-400' : cfg?.color.includes('blue') ? 'bg-blue-400' : cfg?.color.includes('purple') ? 'bg-purple-400' : 'bg-orange-400'}`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg?.color.includes('amber') ? 'bg-amber-500' : cfg?.color.includes('blue') ? 'bg-blue-500' : cfg?.color.includes('purple') ? 'bg-purple-500' : 'bg-orange-500'}`} />
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No recent orders</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Tap to view your account</p>
              </>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </div>
  );
}
