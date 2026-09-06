/**
 * app/auth/layout.tsx
 *
 * Auth pages get their own minimal layout —
 * no global SiteHeader, SiteFooter, FloatingNavigation, or CartSheet.
 * The auth-page-content.tsx renders its own lightweight brand bar.
 *
 * AuthProvider is still available because ClientLayout (root) wraps it,
 * but we bypass the site chrome by exporting a dedicated layout here.
 *
 * Force dark class on <html> for the auth pages so the page is always
 * dark-mode first regardless of the system theme.
 */

import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Sign In — IndianMarket',
  description: 'Sign in or create your IndianMarket account to order authentic Asian groceries.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
       * Inline script sets `dark` class on <html> immediately, before paint,
       * preventing any light-mode flash on the auth page.
       */}
      <Script id="auth-dark-init" strategy="beforeInteractive">
        {`document.documentElement.classList.add('dark')`}
      </Script>
      {children}
    </>
  )
}
