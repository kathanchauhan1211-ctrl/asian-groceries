import { Suspense } from 'react'
import PageContent from './page-content'

export default function ShopPage() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  )
}
