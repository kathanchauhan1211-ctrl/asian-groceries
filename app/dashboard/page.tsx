'use client'

import { CustomerDashboard } from '@/components/customer-dashboard'
import { useRouter } from 'next/navigation'
import type { Tab } from '@/components/site-header'
import { useAuth } from '@/lib/auth-context'
import { useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?tab=login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const handleSelectTab = (tab: Tab) => {
    if (tab === 'shop') router.push('/')
    else router.push(`/${tab}`)
  }

  // bg-background text-foreground — uses CSS vars that flip in dark mode
  return (
    <div className="bg-background text-foreground" style={{ minHeight: 'calc(100dvh - 120px)' }}>
      <CustomerDashboard onSelectTab={handleSelectTab} />
    </div>
  )
}
