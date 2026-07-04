'use client'

import { CheckoutForm } from '@/components/checkout-form'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  const handleOrderComplete = (ticketNum: string) => {
    // In a real app, we'd save this to global state or URL param.
    // Here we'll pass it via search params to track page.
    router.push(`/track?ticket=${ticketNum}`)
  }

  return (
    <div className="py-10">
      <CheckoutForm onComplete={handleOrderComplete} />
    </div>
  )
}
