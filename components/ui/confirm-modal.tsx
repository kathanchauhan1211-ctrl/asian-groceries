'use client'

import { X, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: 'danger' | 'warning' | 'primary'
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger'
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  const variantColors = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-orange-500 hover:bg-orange-600',
    primary: 'bg-blue-600 hover:bg-blue-700',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onCancel : undefined}
      />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex size-12 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
            <AlertTriangle className="size-6" />
          </div>
          
          <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
          <p className="mb-6 text-sm text-slate-500">{message}</p>
          
          <div className="flex w-full gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 ${variantColors[variant]}`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
