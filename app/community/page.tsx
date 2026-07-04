'use client'

import { WhatsAppSection } from '@/components/whatsapp-section'
import { useRouter } from 'next/navigation'

export default function CommunityPage() {
  const router = useRouter()

  const handleQuickBuy = (productId: string) => {
    // Navigate to shop with search query
    router.push(`/?q=${productId}`)
  }

  return (
    <div className="py-10">
      <WhatsAppSection onQuickBuy={handleQuickBuy} />
    </div>
  )
}
