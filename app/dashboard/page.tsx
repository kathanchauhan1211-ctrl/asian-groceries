'use client'

import { CustomerDashboard } from '@/components/customer-dashboard'
import { useRouter } from 'next/navigation'
import type { Tab } from '@/components/site-header'

export default function DashboardPage() {
  const router = useRouter()

  const handleSelectTab = (tab: Tab) => {
    if (tab === 'shop') router.push('/')
    else router.push(`/${tab}`)
  }

  return (
    <CustomerDashboard onSelectTab={handleSelectTab} />
  )
}
