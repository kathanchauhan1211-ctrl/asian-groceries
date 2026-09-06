'use client'

import { Suspense } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth-context'
import { SiteHeader } from '@/components/site-header'
import { CartSheet } from '@/components/cart-sheet'
import { CheckoutModal } from '@/components/checkout-modal'
import { SiteFooter } from '@/components/site-footer'
import { FloatingNavigation } from '@/components/floating-navigation'


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
