import { Suspense } from 'react'
import TrackPageContent from './track-page-content'

export default function TrackPage() {
  return (
    <Suspense>
      <TrackPageContent />
    </Suspense>
  )
}
