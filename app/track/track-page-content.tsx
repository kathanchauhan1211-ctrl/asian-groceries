'use client'

import { DpdTracker } from '@/components/dpd-tracker'
import { PageHero } from '@/components/page-hero'
import { useSearchParams } from 'next/navigation'

export default function TrackPageContent() {
  const searchParams = useSearchParams()
  const ticket = searchParams.get('ticket') || searchParams.get('parcel') || ''

  return (
    <div>
      <PageHero
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400">
            {/* DPD wordmark — simple bold text badge */}
            <span className="font-black tracking-tight">DPD</span>
            Live Courier Tracking
          </span>
        }
        title={<>Track your <span className="text-accent">DPD Parcel</span></>}
        subtitle="Real-time parcel tracking powered by DPD Interconnector. Enter your DPD number or AG order ticket below."
      />
      <div className="py-6">
        <DpdTracker initialTicket={ticket} />
      </div>
    </div>
  )
}
