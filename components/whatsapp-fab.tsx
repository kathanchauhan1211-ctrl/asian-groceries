'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WhatsAppFab() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 rounded-2xl border border-border bg-card p-5 shadow-2xl card-enter ornament-corners">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <MessageCircle className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Customer Support</p>
                <p className="text-xs text-muted-foreground">Typically replies in minutes</p>
              </div>
            </div>
            <Button
              onClick={() => setOpen(false)}
              aria-label="Close support"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="mt-3 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
            Labas! 👋 Questions about an order or bus delivery? Message us on WhatsApp.
          </p>
          <Button
            href="https://wa.me/37060000000"
            target="_blank"
            rel="noopener noreferrer"
            variant="emerald"
            size="lg"
            className="btn-shimmer mt-3 w-full rounded-full gap-2"
          >
            <MessageCircle className="size-4" /> Chat on WhatsApp
          </Button>
        </div>
      )}

      <Button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open WhatsApp support"
        variant="emerald"
        size="icon-lg"
        className="relative rounded-full shadow-xl"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && (
          <span className="absolute inline-flex size-14 rounded-full bg-primary/40" style={{ animation: 'pin-pulse 2.5s ease-out infinite' }} />
        )}
      </Button>
    </div>
  )
}
