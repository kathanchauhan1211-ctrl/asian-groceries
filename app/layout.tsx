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
  title: 'IndianMarket — Authentic Indian & South Asian Store in Vilnius',
  description:
    'Vilnius-based Indian & South Asian grocery store. Basmati, halal meat, paneer, spices and more, hand-delivered to your city bus station via Autobusų Stotis courier.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'light dark',
  themeColor: '#D4621A',
  viewportFit: 'cover', // Required for env(safe-area-inset-*) to activate on iOS
}

import { ClientLayout } from '@/components/client-layout'
import { TranslationProvider } from '@/lib/translation-context'
import { ThemeProvider } from '@/lib/theme-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} bg-background`}>
      <body className="font-sans antialiased overflow-x-hidden">
        <TranslationProvider>
          <ThemeProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ThemeProvider>
        </TranslationProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
