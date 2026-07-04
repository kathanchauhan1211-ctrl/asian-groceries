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
    <div className="min-h-dvh bg-white relative text-slate-900 pb-28">
      {/* Transparent global watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
        <img
          src="/logo.png"
          alt=""
          className="w-[80vw] max-w-[800px] object-contain"
          aria-hidden
        />
      </div>

      <Suspense>
        <SiteHeader />
      </Suspense>
      <main className="relative z-10">{children}</main>
      <SiteFooter />
      <CartSheet />
      <FloatingNavigation />
    </div>
  )
}
