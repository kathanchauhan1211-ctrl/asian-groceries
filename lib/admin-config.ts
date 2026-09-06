/**
 * lib/admin-config.ts
 *
 * Single source of truth for the admin email address.
 *
 * CLIENT-SIDE (browser) reads from NEXT_PUBLIC_ADMIN_EMAIL.
 * SERVER-SIDE (API routes) reads from ADMIN_EMAIL (no NEXT_PUBLIC_ prefix).
 *
 * To change the admin email:
 *   1. Update NEXT_PUBLIC_ADMIN_EMAIL and ADMIN_EMAIL in .env.local
 *   2. Redeploy — no code changes needed.
 *
 * .env.local example:
 *   NEXT_PUBLIC_ADMIN_EMAIL=admin@yourstore.com
 *   ADMIN_EMAIL=admin@yourstore.com
 */

// Used by client components (layout.tsx, login/page.tsx)
export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'indianmarket@test.com'

// Used by server-side API routes (api/admin/*)
// Call this inside a function — never at module top-level in Next.js
export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'indianmarket@test.com'
}
