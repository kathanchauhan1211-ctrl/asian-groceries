import { fetchCategoryFilters, fetchAllProductCategories } from '@/app/actions/get-categories'

export const dynamic = 'force-dynamic'

export default async function DebugCategoriesPage() {
  const [filters, productCats] = await Promise.all([
    fetchCategoryFilters(),
    fetchAllProductCategories(),
  ])

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, background: '#0a0a0a', color: '#e5e5e5', minHeight: '100vh' }}>
      <h1 style={{ color: '#f97316', marginBottom: 24 }}>🔍 Category Debug</h1>

      <h2 style={{ color: '#60a5fa' }}>Saved in Firestore (settings/categoryFilters):</h2>
      {filters ? (
        <pre style={{ background: '#111', padding: 16, borderRadius: 8, overflow: 'auto', marginBottom: 32 }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      ) : (
        <p style={{ color: '#ef4444' }}>⚠️ No data found at settings/categoryFilters — document does not exist yet.</p>
      )}

      <h2 style={{ color: '#60a5fa' }}>All product category values in Firestore ({productCats.length} unique):</h2>
      <pre style={{ background: '#111', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {productCats.join('\n')}
      </pre>

      <p style={{ marginTop: 24, color: '#6b7280', fontSize: 12 }}>
        For a category filter to appear on the storefront, its <code>match</code> array must contain at least one value from the product categories list above.
      </p>
    </div>
  )
}
