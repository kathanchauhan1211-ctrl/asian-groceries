'use client'

import { Suspense, useState, useEffect } from 'react'
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
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scale = Math.max(0.5, 1 - scrollY / 1500)
  const opacity = Math.max(0.02, 0.15 - scrollY / 3000)
  const translateY = scrollY * 0.3

  return (
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      {/* Dynamic scrolling global watermark */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img
          src="/logo.png"
          alt=""
          className="w-[70vw] max-w-[600px] object-contain transition-transform duration-75 ease-out"
          style={{
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity: opacity,
            filter: `brightness(${Math.max(0.5, 1 - scrollY / 1000)})`,
          }}
          aria-hidden
        />
      </div>

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
