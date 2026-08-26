'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth-context'
import { SiteHeader } from '@/components/site-header'
import { CartSheet } from '@/components/cart-sheet'
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
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Actual spice-decor.jpg as background — large tile so only a few spices show */}
      <SpiceDecorBackground />

      <Suspense>
        <SiteHeader />
      </Suspense>

      <main className="relative z-10 flex-1 pb-20 md:pb-0">{children}</main>

      <SiteFooter />
      <CartSheet />
      <FloatingNavigation />
    </div>
  )
}

/**
 * Background spice decoration — uses the actual spice-decor.jpg photo tiled
 * at 2000px so only ~1 tile per screen (very few visible spice elements).
 * mix-blend-mode:multiply makes the cream background transparent on white.
 */
function SpiceDecorBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/spice-decor.jpg')",
          backgroundSize: '2000px auto',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'multiply',
          opacity: 0.30,
        }}
      />
    </div>
  )
}
