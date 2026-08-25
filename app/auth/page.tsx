import { Suspense } from 'react'
import type { Metadata } from 'next'
import AuthPageContent from './auth-page-content'

export const metadata: Metadata = {
  title: 'Sign In / Sign Up — IndianMarket',
  description: 'Log in or create your IndianMarket account to track orders and shop faster.',
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  )
}
