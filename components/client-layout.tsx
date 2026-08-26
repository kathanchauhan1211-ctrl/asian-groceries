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
      {/*
       * SVG-based spice decoration — every shape is hand-drawn code,
       * no image file. Placed freely across the full viewport at z-45
       * so it's visible over both the sticky header and all page content.
       * pointer-events:none means nothing is blocked.
       */}
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


// ─── Individual spice SVG shapes (all centered at 0,0) ───────────────────────

/** Star anise — 8-pointed star with seed dot in centre */
function StarAnise({ color = '#7A3B0A' }: { color?: string }) {
  // Pre-computed 16-point polygon: outer r=12, inner r=4.5, 8 petals
  const pts =
    '0,-12 1.72,-4.16 8.49,-8.49 4.16,-1.72 12,0 4.16,1.72 8.49,8.49 1.72,4.16 ' +
    '0,12 -1.72,4.16 -8.49,8.49 -4.16,1.72 -12,0 -4.16,-1.72 -8.49,-8.49 -1.72,-4.16'
  return (
    <g fill={color}>
      <polygon points={pts} />
      <circle r={2.5} />
    </g>
  )
}

/** Curry / bay leaf — elongated oval with centre vein */
function CurryLeaf({ color = '#1a5c2a' }: { color?: string }) {
  return (
    <g>
      <path
        d="M0,-13 C5,-10 7,-3 6,4 C5,9 2,13 0,14 C-2,13 -5,9 -6,4 C-7,-3 -5,-10 0,-13 Z"
        fill={color}
      />
      <line
        x1="0" y1="-12" x2="0" y2="13"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </g>
  )
}

/** Chili pepper — curved teardrop with thin stem */
function Chili({ color = '#8B0000' }: { color?: string }) {
  return (
    <g>
      <path
        d="M0,13 C5,10 7,4 6,-3 C5,-9 2,-13 0,-14 C-2,-13 -5,-9 -6,-3 C-7,4 -5,10 0,13 Z"
        fill={color}
      />
      <path
        d="M0,-14 C1,-17 3,-19 2,-21"
        stroke="#5a3e1b"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  )
}

/** Cardamom pod — ribbed oval */
function CardamomPod({ color = '#2d5c35' }: { color?: string }) {
  return (
    <g>
      <ellipse rx={5} ry={10} fill={color} />
      {([-5, -2, 1, 4] as const).map((y, i) => (
        <line
          key={i}
          x1={-3.5} y1={y} x2={3.5} y2={y}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.8"
        />
      ))}
    </g>
  )
}

/** Clove — round head on thin stem */
function Clove({ color = '#3a1a06' }: { color?: string }) {
  return (
    <g fill={color}>
      <circle cy={-9} r={4} />
      <rect x={-1.2} y={-5.5} width={2.4} height={14} rx={1.2} />
    </g>
  )
}

/** Small anise / cumin seed — tiny oval */
function Seed({ color = '#9B3A00' }: { color?: string }) {
  return <ellipse rx={3} ry={5.5} fill={color} />
}

// ─── Placement map ───────────────────────────────────────────────────────────
// x, y: percentage of viewport (0–100), freely chosen so shapes feel
// intentionally scattered — not a mechanical grid or tile pattern.

type SpiceEl = {
  type: 'star' | 'leaf' | 'chili' | 'cardamom' | 'clove' | 'seed'
  x: number   // % of viewport width
  y: number   // % of viewport height
  scale: number
  rotate: number
  opacity: number
}

const SPICE_ELEMENTS: SpiceEl[] = [
  // ── Star anise (6) ──
  { type: 'star',     x: 3,   y: 8,   scale: 1.0,  rotate: 18,  opacity: 0.35 },
  { type: 'star',     x: 87,  y: 17,  scale: 0.90, rotate: -28, opacity: 0.32 },
  { type: 'star',     x: 51,  y: 56,  scale: 1.0,  rotate: 42,  opacity: 0.30 },
  { type: 'star',     x: 17,  y: 80,  scale: 0.85, rotate: -12, opacity: 0.33 },
  { type: 'star',     x: 93,  y: 67,  scale: 1.0,  rotate: 65,  opacity: 0.31 },
  { type: 'star',     x: 68,  y: 94,  scale: 0.85, rotate: 30,  opacity: 0.32 },

  // ── Curry leaves (7) ──
  { type: 'leaf',     x: 24,  y: 23,  scale: 1.0,  rotate: 35,  opacity: 0.36 },
  { type: 'leaf',     x: 71,  y: 5,   scale: 0.85, rotate: -50, opacity: 0.33 },
  { type: 'leaf',     x: 7,   y: 50,  scale: 0.90, rotate: 65,  opacity: 0.34 },
  { type: 'leaf',     x: 82,  y: 42,  scale: 1.1,  rotate: -22, opacity: 0.34 },
  { type: 'leaf',     x: 37,  y: 87,  scale: 0.95, rotate: 20,  opacity: 0.33 },
  { type: 'leaf',     x: 58,  y: 30,  scale: 0.8,  rotate: -75, opacity: 0.31 },
  { type: 'leaf',     x: 96,  y: 36,  scale: 1.0,  rotate: 40,  opacity: 0.33 },

  // ── Chili peppers (4) ──
  { type: 'chili',    x: 46,  y: 12,  scale: 0.90, rotate: -40, opacity: 0.34 },
  { type: 'chili',    x: 29,  y: 63,  scale: 1.0,  rotate: 55,  opacity: 0.32 },
  { type: 'chili',    x: 80,  y: 77,  scale: 0.85, rotate: -25, opacity: 0.33 },
  { type: 'chili',    x: 62,  y: 46,  scale: 0.80, rotate: 72,  opacity: 0.30 },

  // ── Cardamom pods (4) ──
  { type: 'cardamom', x: 35,  y: 33,  scale: 0.90, rotate: 22,  opacity: 0.33 },
  { type: 'cardamom', x: 75,  y: 57,  scale: 1.0,  rotate: -35, opacity: 0.33 },
  { type: 'cardamom', x: 14,  y: 93,  scale: 0.85, rotate: 50,  opacity: 0.31 },
  { type: 'cardamom', x: 90,  y: 10,  scale: 0.80, rotate: -15, opacity: 0.32 },

  // ── Cloves (3) ──
  { type: 'clove',    x: 55,  y: 71,  scale: 1.0,  rotate: 0,   opacity: 0.34 },
  { type: 'clove',    x: 20,  y: 40,  scale: 0.90, rotate: 45,  opacity: 0.33 },
  { type: 'clove',    x: 85,  y: 60,  scale: 1.1,  rotate: -30, opacity: 0.33 },

  // ── Small seeds (5) ──
  { type: 'seed',     x: 43,  y: 48,  scale: 1.0,  rotate: 25,  opacity: 0.38 },
  { type: 'seed',     x: 65,  y: 18,  scale: 0.90, rotate: -55, opacity: 0.36 },
  { type: 'seed',     x: 10,  y: 72,  scale: 1.1,  rotate: 40,  opacity: 0.38 },
  { type: 'seed',     x: 78,  y: 88,  scale: 0.90, rotate: 10,  opacity: 0.35 },
  { type: 'seed',     x: 30,  y: 12,  scale: 1.0,  rotate: -30, opacity: 0.36 },
]

function renderSpice(type: SpiceEl['type']) {
  switch (type) {
    case 'star':     return <StarAnise />
    case 'leaf':     return <CurryLeaf />
    case 'chili':    return <Chili />
    case 'cardamom': return <CardamomPod />
    case 'clove':    return <Clove />
    case 'seed':     return <Seed />
    default:         return null
  }
}

/**
 * Fully code-drawn spice decoration layer.
 * — z-45: above main content (z-10) AND the sticky header (z-40)
 *   so spice motifs are visible in ALL areas including the header.
 * — pointer-events:none — never blocks any click or scroll.
 * — position:fixed — stays in place as page scrolls (watermark effect).
 */
function SpiceDecorBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      {SPICE_ELEMENTS.map((el, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            transform: `translate(-50%, -50%) rotate(${el.rotate}deg) scale(${el.scale})`,
            opacity: el.opacity,
          }}
        >
          <svg
            width={44}
            height={44}
            viewBox="-16 -16 32 32"
            xmlns="http://www.w3.org/2000/svg"
            overflow="visible"
            style={{ display: 'block' }}
          >
            {renderSpice(el.type)}
          </svg>
        </div>
      ))}
    </div>
  )
}
