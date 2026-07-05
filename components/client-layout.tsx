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
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    // Auth pages get clean full-screen layout (no site chrome)
    return <>{children}</>
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      {/* Transparent global watermark — visible on every page & device */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <img
          src="/logo.png"
          alt=""
          className="w-[70vw] max-w-[600px] object-contain opacity-[0.07] mix-blend-multiply"
          aria-hidden
        />
      </div>

      <Suspense>
        <SiteHeader />
      </Suspense>

      {/* main grows to push footer down */}
      <main className="relative z-10 flex-1 pb-20 lg:pb-0">{children}</main>

      <SiteFooter />
      <CartSheet />
      {/* Floating bottom nav — shown on all screens, replaces floating-navigation */}
      <FloatingNavigation />
    </div>
  )
}
