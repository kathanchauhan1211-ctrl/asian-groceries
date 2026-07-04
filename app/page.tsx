import { Suspense } from 'react'
import PageContent from './page-content'

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  )
}
