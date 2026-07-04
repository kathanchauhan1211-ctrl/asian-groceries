'use client'

import { BusTracker } from '@/components/bus-tracker'
import { useSearchParams } from 'next/navigation'

export default function TrackPageContent() {
  const searchParams = useSearchParams()
  const ticket = searchParams.get('ticket') || ''

  return (
    <div className="py-10">
      <BusTracker initialTicket={ticket} />
    </div>
  )
}
