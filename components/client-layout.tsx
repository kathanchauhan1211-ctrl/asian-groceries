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
      {/* Spice flakes and stars pattern background */}
      <SpicePatternTile />

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

function SpicePatternTile() {
  const tileW = 400
  const tileH = 400

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}" opacity="0.25">
      <!-- Chili flakes (Red) -->
      <g fill="#EF4444">
        <polygon points="40,50 45,48 50,55 42,60" />
        <polygon points="120,150 125,145 130,152 122,158" transform="rotate(45 125 150)" />
        <polygon points="280,310 286,308 290,315 284,320" transform="rotate(110 285 315)" />
        <polygon points="350,80 355,75 360,82 352,88" transform="rotate(-30 355 80)" />
        <polygon points="200,250 205,248 210,255 202,260" transform="rotate(75 205 250)" />
        <polygon points="80,350 85,345 90,352 82,358" transform="rotate(15 85 350)" />
        <polygon points="180,30 185,25 190,32 182,38" transform="rotate(60 185 30)" />
        <polygon points="320,200 325,195 330,202 322,208" transform="rotate(130 325 200)" />
      </g>
      <!-- Orange specks -->
      <g fill="#F97316">
        <circle cx="90" cy="110" r="3" />
        <circle cx="210" cy="90" r="2.5" />
        <circle cx="340" cy="270" r="4" />
        <circle cx="160" cy="320" r="3.5" />
        <circle cx="270" cy="130" r="2.5" />
        <circle cx="50" cy="280" r="3" />
        <circle cx="110" cy="200" r="2" />
        <circle cx="380" cy="150" r="3" />
        <circle cx="230" cy="380" r="2.5" />
        <circle cx="20" cy="20" r="2" />
        <circle cx="150" cy="30" r="3.5" />
        <circle cx="380" cy="380" r="2" />
      </g>
      <!-- Star anise (Brown/Orange) -->
      <g fill="#D97706">
        <path d="M 60,200 L 63,193 L 70,195 L 65,200 L 70,205 L 63,207 L 60,214 L 57,207 L 50,205 L 55,200 L 50,195 L 57,193 Z" transform="rotate(15 60 200) scale(1.5)" />
        <path d="M 280,60 L 283,53 L 290,55 L 285,60 L 290,65 L 283,67 L 280,74 L 277,67 L 270,65 L 275,60 L 270,55 L 277,53 Z" transform="rotate(45 280 60) scale(1.2)" />
        <path d="M 150,280 L 153,273 L 160,275 L 155,280 L 160,285 L 153,287 L 150,294 L 147,287 L 140,285 L 145,280 L 140,275 L 147,273 Z" transform="rotate(-20 150 280) scale(1.4)" />
        <path d="M 330,340 L 333,333 L 340,335 L 335,340 L 340,345 L 333,347 L 330,354 L 327,347 L 320,345 L 325,340 L 320,335 L 327,333 Z" transform="rotate(70 330 340) scale(1.1)" />
      </g>
      <!-- Cardamom pods (Green) -->
      <g fill="#84CC16">
        <ellipse cx="220" cy="180" rx="4" ry="7" transform="rotate(30 220 180)" />
        <ellipse cx="100" cy="60" rx="3.5" ry="6.5" transform="rotate(-40 100 60)" />
        <ellipse cx="360" cy="220" rx="4.5" ry="8" transform="rotate(80 360 220)" />
        <ellipse cx="130" cy="380" rx="4" ry="7.5" transform="rotate(-10 130 380)" />
        <ellipse cx="270" cy="250" rx="3.5" ry="6" transform="rotate(110 270 250)" />
      </g>
      <!-- Small leafy bits (Green) -->
      <g fill="#22C55E">
        <polygon points="170,120 173,115 178,118 174,124" transform="rotate(45 174 120)" />
        <polygon points="290,180 293,175 298,178 294,184" transform="rotate(-25 294 180)" />
        <polygon points="60,300 63,295 68,298 64,304" transform="rotate(85 64 300)" />
      </g>
    </svg>`

  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.6] dark:opacity-40"
      style={{
        backgroundImage: `url("${encoded}")`,
        backgroundSize: `${tileW}px ${tileH}px`,
        backgroundRepeat: 'repeat',
      }}
    />
  )
}
