'use client'

import { WhatsAppSection } from '@/components/whatsapp-section'
import { PageHero } from '@/components/page-hero'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

export default function CommunityPage() {
  const router = useRouter()

  const handleQuickBuy = (productId: string) => {
    // Navigate to shop with search query
    router.push(`/?q=${productId}`)
  }

  return (
    <div>
      <PageHero
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <MessageSquare className="size-3" /> WhatsApp Group
          </span>
        }
        title={<>Vilnius Stock & <span className="text-accent">Restock alerts</span></>}
        subtitle="Join our group chat for real-time stock alerts and direct support"
      />
      <div className="py-6">
        <WhatsAppSection onQuickBuy={handleQuickBuy} />
      </div>
    </div>
  )
}
