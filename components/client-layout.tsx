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
  // Build an SVG data-URI that embeds the logo as a <image> inside a repeating tile.
  // The SVG tile is 320×220 px, the logo sits rotated −25° in the centre.
  // We use CSS background-repeat to tile it edge-to-edge with no visible corners.
  const tileW = 320
  const tileH = 220
  const imgW = 160
  const imgH = 80
  const cx = tileW / 2 - imgW / 2
  const cy = tileH / 2 - imgH / 2

  // SVG wrapper — the <image> href points to the logo served by Next.js.
  // opacity + mix-blend-mode do the heavy lifting to make it feel embedded.
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">
      <g transform="rotate(-25 ${tileW / 2} ${tileH / 2})" opacity="0.07">
        <image href="/logo.png" x="${cx}" y="${cy}" width="${imgW}" height="${imgH}"
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
        mixBlendMode: 'multiply',
      }}
    />
  )
}
