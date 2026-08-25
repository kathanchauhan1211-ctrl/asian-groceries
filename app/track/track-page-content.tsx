'use client'

import { BusTracker } from '@/components/bus-tracker'
import { PageHero } from '@/components/page-hero'
import { useSearchParams } from 'next/navigation'
import { Bus } from 'lucide-react'

export default function TrackPageContent() {
  const searchParams = useSearchParams()
  const ticket = searchParams.get('ticket') || ''

  return (
    <div>
      <PageHero
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Bus className="size-3" /> Autobusų Stotis pipeline
          </span>
        }
        title={<>Track your <span className="text-accent">Courier Delivery</span></>}
        subtitle="Track packages dispatched from our store at Šaltinių g. 22 to any city in Lithuania"
      />
      <div className="py-6">
        <BusTracker initialTicket={ticket} />
      </div>
    </div>
  )
}
