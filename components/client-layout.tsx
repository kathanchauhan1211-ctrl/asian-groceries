'use client'

import { Suspense, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth-context'
import { SiteHeader } from '@/components/site-header'
import { CartSheet } from '@/components/cart-sheet'
import { CheckoutModal } from '@/components/checkout-modal'
import { SiteFooter } from '@/components/site-footer'
import { FloatingNavigation } from '@/components/floating-navigation'

const ANNOUNCEMENTS = [
  '🚚  Free delivery on orders over €25',
  '📱  Order via WhatsApp: +370 600 00000',
  '🕐  Store open Mon–Sat 10:00–20:00',
]

function AnnouncementBar() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % ANNOUNCEMENTS.length)
        setVisible(true)
      }, 350)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="relative z-50 flex items-center justify-center px-4 py-1.5 text-center text-[11px] sm:text-xs font-semibold bg-[#1A365D] dark:bg-slate-900 text-white/90"
    >
      <span
        style={{
          transition: 'opacity 0.35s ease',
          opacity: visible ? 1 : 0,
          display: 'block',
          letterSpacing: '0.01em',
        }}
      >
        {ANNOUNCEMENTS[idx]}
      </span>
    </div>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <AuthAwareLayout>{children}</AuthAwareLayout>
      </CartProvider>
    </AuthProvider>
  )
}

// Separate component so we can use hooks (AuthProvider must wrap the hook consumers)
function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Admin portal and auth pages are FULLY ISOLATED — no storefront chrome of any kind
  const isAdminRoute = pathname?.startsWith('/admin')
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAdminRoute || isAuthPage) {
    return <>{children}</>
  }

  // ── Storefront chrome (customer webapp only) ──
  return <StorefrontLayout>{children}</StorefrontLayout>
}

function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SpiceDecorBackground />

      {/* Announcement bar — above everything */}
      <AnnouncementBar />

      <Suspense>
        <SiteHeader />
      </Suspense>

      {/* pb-20 for floating nav on mobile, extra env() padding for iOS home indicator */}
      <main
        className="relative z-10 flex-1 pb-20 md:pb-0"
        style={{ paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))' }}
      >
        {children}
      </main>

      <SiteFooter />
      <CartSheet onCheckout={() => {}} />
      <CheckoutModal />
      <FloatingNavigation />
    </div>
  )
}

// SpiceDecorBackground disabled — clean blank background.
// Keep the component here so it can be re-enabled later.
function SpiceDecorBackground() {
  return null
}
