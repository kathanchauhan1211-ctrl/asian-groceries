// components/ui/status-badge.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

export type StatusVariant = 'paid' | 'accepted' | 'preparing' | 'dispatched' | 'delivered';

const variantStyles: Record<StatusVariant, string> = {
  paid: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  accepted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  preparing: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
  dispatched: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  delivered: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
};

interface Props {
  status: StatusVariant;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<Props> = ({ status, children }) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[status]
      )}
    >
      {children || status.replace(/_/g, ' ')}
    </span>
  );
};
