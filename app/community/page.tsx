'use client'

import { WhatsAppSection } from '@/components/whatsapp-section'
import { PageHero } from '@/components/page-hero'
import { useRouter } from 'next/navigation'
import { MessageSquare, ExternalLink } from 'lucide-react'
import Image from 'next/image'

// Real WhatsApp group invite link — users who scan the QR code land here
const WHATSAPP_GROUP_URL = 'https://wa.me/+37061676111'

export default function CommunityPage() {
  const router = useRouter()

  const handleQuickBuy = (productId: string) => {
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
        subtitle="Join our WhatsApp group for real-time stock alerts, restocks, and direct support"
      />

      {/* QR Code section */}
      <div className="mx-auto max-w-2xl px-4 py-10 flex flex-col items-center text-center">
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Scan to join our WhatsApp group
        </p>

        {/* Clickable QR code — tapping on mobile opens WhatsApp group directly */}
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-block rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-200 transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] hover:border-emerald-400"
          aria-label="Scan QR code to join WhatsApp group"
        >
          <Image
            src="/whatsapp-qr.jpg"
            alt="WhatsApp Group QR Code — scan to join"
            width={220}
            height={220}
            className="block"
            priority
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-500/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ExternalLink className="size-8 text-white" />
            <span className="text-sm font-bold text-white">Open WhatsApp</span>
          </div>
        </a>

        <p className="mt-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Or tap the image to open directly on your phone
        </p>

        {/* Direct link button */}
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#25D366' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          Join WhatsApp Group
        </a>
      </div>

      <div className="py-2">
        <WhatsAppSection onQuickBuy={handleQuickBuy} />
      </div>
    </div>
  )
}
