/**
 * app/auth/layout.tsx
 *
 * Auth pages get their own minimal layout —
 * no global SiteHeader, SiteFooter, FloatingNavigation, or CartSheet.
 * The auth-page-content.tsx renders its own lightweight brand bar.
 *
 * AuthProvider is still available because ClientLayout (root) wraps it,
 * but we bypass the site chrome by exporting a dedicated layout here.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Asian Groceries',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
