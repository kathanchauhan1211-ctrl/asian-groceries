import { fixCategoryMatches } from '@/app/actions/get-categories'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FixCategoriesPage() {
  const result = await fixCategoryMatches()
  redirect('/debug-categories')
}
