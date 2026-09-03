'use client';

import { Building2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export type PaymentMethod = 'bank_transfer';

// ── Bank account details (update IBAN + bank name when ready) ──────────────────
export const BANK_DETAILS = {
  accountName:   'Asian Groceries UAB',
  iban:          'LT12 3456 7890 1234 5678',
  bank:          'Swedbank',
  bic:           'HABALT22',
  reference:     'Use your ticket number as reference',
}

type Props = {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
};

export function PaymentMethodSelector({ selected, onSelect }: Props) {
  const [copied, setCopied] = useState(false)

  const copyIban = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(BANK_DETAILS.iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Bank Transfer */}
      <label
        className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200 ${
          selected === 'bank_transfer'
            ? 'border-accent bg-accent/5 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
        onClick={() => onSelect('bank_transfer')}
      >
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white">
          {selected === 'bank_transfer' && (
            <div className="h-2.5 w-2.5 rounded-full bg-accent" />
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-900">Bank Transfer</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Transfer the exact amount to our bank account. Your order will be dispatched once payment is confirmed.
          </p>

          {/* Account details — only shown when selected */}
          {selected === 'bank_transfer' && (
            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-600 font-semibold">Account Name</span>
                <span className="font-bold text-slate-800">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600 font-semibold">Bank</span>
                <span className="font-bold text-slate-800">{BANK_DETAILS.bank}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600 font-semibold">BIC / SWIFT</span>
                <span className="font-bold text-slate-800">{BANK_DETAILS.bic}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600 font-semibold">IBAN</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 font-mono">{BANK_DETAILS.iban}</span>
                  <button
                    type="button"
                    onClick={copyIban}
                    className="flex items-center justify-center rounded-md p-0.5 hover:bg-blue-200 transition-colors"
                    aria-label="Copy IBAN"
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-blue-500 pt-1 border-t border-blue-200 mt-1">
                ⚠️ Use your ticket number as the payment reference so we can match your transfer.
              </p>
            </div>
          )}
        </div>
        <input
          type="radio"
          name="payment_method"
          value="bank_transfer"
          className="hidden"
          checked={selected === 'bank_transfer'}
          readOnly
        />
      </label>
    </div>
  );
}
