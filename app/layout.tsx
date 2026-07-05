import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Asian Groceries — Authentic Indian & South Asian Store in Vilnius',
  description:
    'Vilnius-based Indian & South Asian grocery store. Basmati, halal meat, paneer, spices and more, hand-delivered to your city bus station via Autobusų Stotis courier.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'light',
  themeColor: '#D4621A',
}

import { ClientLayout } from '@/components/client-layout'
import { TranslationProvider } from '@/lib/translation-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} bg-background`}>
      <body className="font-sans antialiased overflow-x-hidden">
        <TranslationProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </TranslationProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
