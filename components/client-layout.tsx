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
    <div className="flex min-h-dvh flex-col bg-white text-slate-900">
      {/* Tiled diagonal watermark — feels embedded, no pasted-image corners */}
      <WatermarkTile />

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

function WatermarkTile() {
  // Each SVG tile: logo centred, rotated −25°, wrapped in a radial gradient mask
  // so the logo fades at its edges — no hard rectangular "image" look.
  const tileW = 280
  const tileH = 280
  const imgW = 140
  const imgH = 140
  const cx = tileW / 2 - imgW / 2
  const cy = tileH / 2 - imgH / 2

  // Radial gradient mask: opaque in the centre, transparent at corners.
  // Combined with the transparent-background PNG this gives zero visible bounding box.
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">
      <defs>
        <radialGradient id="fade" cx="50%" cy="50%" r="45%">
          <stop offset="0%"   stop-color="white" stop-opacity="1"/>
          <stop offset="70%"  stop-color="white" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
        <mask id="m">
          <rect width="${tileW}" height="${tileH}" fill="url(#fade)"/>
        </mask>
      </defs>
      <g transform="rotate(-25 ${tileW / 2} ${tileH / 2})" opacity="0.12" mask="url(#m)">
        <image href="/logo-icon.png" x="${cx}" y="${cy}" width="${imgW}" height="${imgH}"
          preserveAspectRatio="xMidYMid meet"/>
      </g>
    </svg>`

  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `url("${encoded}")`,
        backgroundSize: `${tileW}px ${tileH}px`,
        backgroundRepeat: 'repeat',
        // multiply blends into the page, further suppressing any residual edge
        mixBlendMode: 'multiply',
      }}
    />
  )
}
