'use client'

import { CustomerDashboard } from '@/components/customer-dashboard'
import { PageHero } from '@/components/page-hero'
import { useRouter } from 'next/navigation'
import type { Tab } from '@/components/site-header'
import { User } from 'lucide-react'
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
        <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  const handleSelectTab = (tab: Tab) => {
    if (tab === 'shop') router.push('/')
    else router.push(`/${tab}`)
  }

  return (
    <div>
      <PageHero
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <User className="size-3" /> Account Hub
          </span>
        }
        title={<>Manage your <span className="text-accent">Orders & Settings</span></>}
        subtitle="Manage tickets, saved transit terminal preferences, and loyalty program progress"
      />
      <div className="py-6">
        <CustomerDashboard onSelectTab={handleSelectTab} />
      </div>
    </div>
  )
}
