'use client'

import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import {
  collection, onSnapshot, query, orderBy,
  doc, addDoc, updateDoc
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { clientDb } from '@/lib/firebase-client'
import { type Stock } from '@/lib/products'
import {
  Plus, Trash2, Package, X, Check, Upload, Download,
  FileSpreadsheet, AlertCircle, Loader2, Pencil, Save,
  CheckSquare, Square, ChevronDown, ChevronUp, Search, RefreshCw
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const STOCK_OPTIONS: Stock[] = ['In Stock', 'Low Stock', 'Sold Out']
const CATEGORIES = ['Rice & Atta', 'Spices', 'Lentils & Pulses', 'Frozen Foods', 'Sweets', 'Tea & Drinks', 'Condiments', 'Snacks', 'Other']
const CSV_COLUMNS = ['name', 'brand', 'category', 'origin', 'price', 'unit', 'stock', 'dietary', 'image', 'description']
const CSV_EXAMPLE_ROWS = [
  ['Royal Basmati Rice', 'Royal', 'Rice & Atta', 'India', '8.99', '5kg', 'In Stock', 'Halal', 'https://example.com/basmati.jpg', 'Premium aged basmati rice'],
  ['Everest Garam Masala', 'Everest', 'Spices', 'India', '3.49', '100g', 'In Stock', '"Vegan,Halal"', 'https://example.com/garam.jpg', 'Authentic spice blend'],
]

type ParsedRow = { [key: string]: string; _row: string }
type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error'
type AdminProduct = { id: string; [key: string]: any }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function stockBadge(s: string) {
  if (s === 'In Stock') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  if (s === 'Low Stock') return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  return 'text-red-400 bg-red-400/10 border-red-400/20'
}
function inputCls(extra = '') {
  return `w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all ${extra}`
}
function selectCls(extra = '') {
  return `w-full rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1.5 text-sm text-white outline-none focus:border-orange-500/50 transition-all ${extra}`
}
function downloadTemplate() {
  const csv = [CSV_COLUMNS.join(','), ...CSV_EXAMPLE_ROWS.map(r => r.join(','))].join('\n')
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: 'IndianMarket_Products_Template.csv',
  })
  a.click()
}
function parseCSV(text: string): { data: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { data: [], errors: ['Need at least a header row + one data row.'] }
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const errors: string[] = []
  const data: ParsedRow[] = []
  lines.slice(1).forEach((line, i) => {
    const values: string[] = []
    let inQuote = false, cur = ''
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = '' }
      else cur += ch
    }
    values.push(cur.trim())
    const row: ParsedRow = { _row: String(i + 2) }
    header.forEach((col, idx) => { row[col] = (values[idx] ?? '').replace(/^"|"$/g, '').trim() })
    if (!row.name) { errors.push(`Row ${i + 2}: "name" is empty — skipped`); return }
    data.push(row)
  })
  return { data, errors }
}

// ─── Server-side delete via Admin SDK API route ───────────────────────────────
// Bypasses Firestore Security Rules completely — works on live hosting.
async function serverDeleteProducts(ids: string[]): Promise<void> {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken(/* forceRefresh */ true)
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'delete', ids }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Server error ${res.status}`)
  }
}

function buildProductDoc(data: Record<string, any>) {
  const price = parseFloat(data.price) || 0
  const unit = data.unit || '1 unit'
  const dietary = data.dietary
    ? data.dietary.split(',').map((d: string) => d.trim()).filter(Boolean)
    : []
  return {
    name: data.name || 'Unnamed Product',
    brand: data.brand || '',
    category: data.category || 'Other',
    origin: data.origin || 'India',
    price,
    unit,
    stock: data.stock || 'In Stock',
    dietary,
    diet: dietary,
    image: data.image || '',
    description: data.description || '',
    variants: [{ label: unit, size: unit, price }],
  }
}

// ─── Admin-specific real-time hook ───────────────────────────────────────────
// Uses onSnapshot so the admin sees changes instantly (unlike the storefront
// which uses a one-time getDocs for performance).
function useAdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(clientDb, 'products'), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error('Admin products error:', err)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Optimistic helpers — update local state immediately for instant feedback
  const removeLocally = useCallback((ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)))
  }, [])

  const updateLocally = useCallback((id: string, fields: Record<string, any>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
  }, [])

  const addLocally = useCallback((product: AdminProduct) => {
    setProducts(prev => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  return { products, loading, removeLocally, updateLocally, addLocally }
}

// ─── Inline Editable Row ──────────────────────────────────────────────────────
function EditableRow({
  product,
  selected,
  onSelect,
  onSaved,
  onDelete,
}: {
  product: AdminProduct
  selected: boolean
  onSelect: (v: boolean) => void
  onSaved: (fields: Record<string, any>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    name: product.name ?? '',
    brand: product.brand ?? '',
    category: product.category ?? 'Other',
    origin: product.origin ?? 'India',
    price: String(product.price ?? ''),
    unit: product.unit ?? '',
    stock: product.stock ?? 'In Stock',
    image: product.image ?? '',
    dietary: Array.isArray(product.diet) ? product.diet.join(', ')
           : Array.isArray(product.dietary) ? product.dietary.join(', ') : '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    setSaving(true)
    const fields = buildProductDoc({ ...form })
    try {
      await updateDoc(doc(clientDb, 'products', product.id), fields)
      onSaved(fields)   // optimistic update
      setEditing(false)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"?`)) return
    setDeleting(true)
    onDelete()          // optimistic: remove from list immediately
    try {
      await serverDeleteProducts([product.id])
    } catch (err: any) {
      console.error('Delete failed:', err.message)
    }
  }

  if (editing) {
    return (
      <tr className="bg-slate-800/60">
        <td className="px-3 py-2">
          <input type="checkbox" checked={selected} onChange={e => onSelect(e.target.checked)}
            className="rounded border-white/20 bg-white/5 text-orange-500" />
        </td>
        <td className="px-3 py-2 min-w-[130px]">
          <input value={form.name} onChange={set('name')} placeholder="Name" className={inputCls()} />
        </td>
        <td className="px-3 py-2 min-w-[100px]">
          <input value={form.brand} onChange={set('brand')} placeholder="Brand" className={inputCls()} />
        </td>
        <td className="px-3 py-2 min-w-[140px]">
          <select value={form.category} onChange={set('category')} className={selectCls()}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
        <td className="px-3 py-2 min-w-[80px]">
          <input value={form.price} onChange={set('price')} type="number" step="0.01" placeholder="0.00" className={inputCls()} />
        </td>
        <td className="px-3 py-2 min-w-[80px]">
          <input value={form.unit} onChange={set('unit')} placeholder="5kg" className={inputCls()} />
        </td>
        <td className="px-3 py-2 min-w-[120px]">
          <select value={form.stock} onChange={set('stock')} className={selectCls()}>
            {STOCK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td className="px-3 py-2 min-w-[180px]">
          <input value={form.image} onChange={set('image')} placeholder="https://..." className={inputCls()} />
        </td>
        <td className="px-3 py-2 min-w-[150px]">
          <input value={form.dietary} onChange={set('dietary')} placeholder="Halal, Vegan" className={inputCls()} />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-400 hover:text-white transition-all">
              <X className="size-3" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={`transition-colors group ${deleting ? 'opacity-0 scale-95 transition-all duration-300' : ''} ${selected ? 'bg-orange-500/5' : 'hover:bg-white/[0.02]'}`}>
      <td className="px-3 py-3">
        <input type="checkbox" checked={selected} onChange={e => onSelect(e.target.checked)}
          className="rounded border-white/20 bg-transparent text-orange-500 cursor-pointer" />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy"
              className="size-9 rounded-lg object-cover border border-white/10 shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div className="size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Package className="size-4 text-slate-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate max-w-[160px]">{product.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{product.brand || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-slate-400">{product.category || '—'}</td>
      <td className="px-3 py-3 font-semibold text-white text-sm">€{Number(product.price || 0).toFixed(2)}</td>
      <td className="px-3 py-3 text-xs text-slate-400">{product.unit || '—'}</td>
      <td className="px-3 py-3">
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stockBadge(product.stock)}`}>
          {product.stock}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-lg border border-orange-500/20 bg-orange-500/10 px-2.5 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 transition-all">
            <Pencil className="size-3" />Edit
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
            {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            Del
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Bulk Import Panel ────────────────────────────────────────────────────────
function BulkImportPanel({ onDone }: { onDone: (n: number) => void }) {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setStatus('parsing')
    const reader = new FileReader()
    reader.onload = e => {
      const { data, errors: pe } = parseCSV(e.target?.result as string)
      setErrors(pe)
      if (data.length === 0) { setStatus('error'); return }
      setPreview(data); setStatus('preview')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setStatus('importing'); setProgress(0)
    const BATCH_SIZE = 400
    let done = 0
    for (let i = 0; i < preview.length; i += BATCH_SIZE) {
      const batch = writeBatch(clientDb)
      preview.slice(i, i + BATCH_SIZE).forEach(row => {
        batch.set(doc(collection(clientDb, 'products')), buildProductDoc(row))
      })
      await batch.commit()
      done += Math.min(BATCH_SIZE, preview.length - i)
      setProgress(Math.round((done / preview.length) * 100))
    }
    setStatus('done')
    onDone(preview.length)
  }

  const reset = () => { setStatus('idle'); setPreview([]); setErrors([]) }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-orange-400" />
          <h3 className="text-sm font-bold text-white">Bulk Import via CSV</h3>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all">
          <Download className="size-3.5" />Download Template
        </button>
      </div>

      <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-blue-400">Only "name" is required — everything else is optional</p>
        <p>• Multiple dietary tags → comma-separated: <code className="text-slate-300">Halal, Vegan</code></p>
        <p>• Image → any public URL</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <AlertCircle className="size-3.5" />{errors.length} warning{errors.length > 1 ? 's' : ''}
          </div>
          {errors.map((e, i) => <p key={i} className="text-[11px] text-amber-300/70 ml-5">{e}</p>)}
        </div>
      )}

      {(status === 'idle' || status === 'error') && (
        <div onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={e => e.preventDefault()} onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/10 py-10 cursor-pointer hover:border-orange-500/40 hover:bg-white/[0.02] transition-all group">
          <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all">
            <Upload className="size-6 text-orange-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Drop CSV here or click to browse</p>
            <p className="text-xs text-slate-500 mt-0.5">Missing columns get smart defaults</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.tsv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {status === 'parsing' && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
          <Loader2 className="size-5 animate-spin text-orange-400" />Parsing…
        </div>
      )}

      {(status === 'preview' || status === 'importing' || status === 'done') && preview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{preview.length} products ready</p>
            {status === 'preview' && <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Start over</button>}
          </div>
          <div className="max-h-56 overflow-auto rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-800">
                <tr>{['Name','Brand','Category','Price','Stock','Image'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-medium text-white max-w-[140px] truncate">{row.name}</td>
                    <td className="px-3 py-2 text-slate-400">{row.brand || '—'}</td>
                    <td className="px-3 py-2 text-slate-400">{row.category || 'Other'}</td>
                    <td className="px-3 py-2 text-white font-semibold">€{(parseFloat(row.price)||0).toFixed(2)}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockBadge(row.stock||'In Stock')}`}>{row.stock||'In Stock'}</span></td>
                    <td className="px-3 py-2">
                      {row.image
                        ? <img src={row.image} loading="lazy" alt="" className="size-6 rounded object-cover border border-white/10" onError={e=>{(e.target as HTMLImageElement).style.opacity='0.2'}} />
                        : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {status === 'importing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Uploading to Firestore…</span>
                <span className="font-semibold text-white">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {status === 'done' && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
              <Check className="size-4" />{preview.length} products now live on storefront!
            </div>
          )}
          {status === 'preview' && (
            <button onClick={handleImport}
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20">
              Confirm — Import {preview.length} Products
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Products Page ─────────────────────────────────────────────────
export default function AdminProductsPage() {
  const { products, loading, removeLocally, updateLocally } = useAdminProducts()

  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    name: '', brand: '', category: 'Rice & Atta', origin: 'India',
    price: '', unit: '', stock: 'In Stock', dietary: '', image: '', description: '',
  })

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Filtered + grouped
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p =>
      (categoryFilter === 'All' || p.category === categoryFilter) &&
      (!q || (p.name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q))
    )
  }, [products, search, categoryFilter])

  const grouped = useMemo(() => {
    const m = new Map<string, AdminProduct[]>()
    filtered.forEach(p => {
      const cat = p.category || 'Other'
      if (!m.has(cat)) m.set(cat, [])
      m.get(cat)!.push(p)
    })
    return m
  }, [filtered])

  const allIds = filtered.map(p => p.id)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }
  function toggleOne(id: string, v: boolean) {
    setSelected(s => { const n = new Set(s); v ? n.add(id) : n.delete(id); return n })
  }
  function toggleCategory(cat: string) {
    const ids = (grouped.get(cat) || []).map(p => p.id)
    const allCatSel = ids.every(id => selected.has(id))
    setSelected(s => {
      const n = new Set(s)
      ids.forEach(id => allCatSel ? n.delete(id) : n.add(id))
      return n
    })
  }
  function toggleCollapse(cat: string) {
    setCollapsed(s => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n })
  }

  // Bulk delete via server API — optimistic first
  async function handleDeleteSelected() {
    const ids = [...selected]
    if (!confirm(`Permanently delete ${ids.length} product${ids.length > 1 ? 's' : ''}?`)) return
    setBulkDeleting(true)
    removeLocally(ids)          // instant UI removal
    setSelected(new Set())
    try {
      await serverDeleteProducts(ids)
      showToast(`${ids.length} product${ids.length > 1 ? 's' : ''} deleted.`)
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Delete entire category via server API
  async function handleDeleteCategory(cat: string) {
    const ids = (grouped.get(cat) || []).map(p => p.id)
    if (!ids.length) return
    if (!confirm(`Delete all ${ids.length} products in "${cat}"?`)) return
    removeLocally(ids)
    try {
      await serverDeleteProducts(ids)
      showToast(`All "${cat}" products deleted.`)
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error')
    }
  }

  // Create single product
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const data = buildProductDoc(form)
      await addDoc(collection(clientDb, 'products'), data)
      showToast(`"${form.name}" added!`)
      setForm({ name: '', brand: '', category: 'Rice & Atta', origin: 'India', price: '', unit: '', stock: 'In Stock', dietary: '', image: '', description: '' })
      setShowForm(false)
    } catch (err) {
      showToast('Failed to add product.', 'error')
    } finally {
      setCreating(false)
    }
  }

  const uniqueCategories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Other')))]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Product Inventory</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {loading ? 'Loading…' : `${products.length} products`} — live sync with storefront
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl border border-white/10 bg-slate-900 p-1 text-xs font-semibold">
            <button onClick={() => { setMode('single'); setShowForm(false) }}
              className={`rounded-lg px-3 py-1.5 transition-all ${mode === 'single' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              Single
            </button>
            <button onClick={() => { setMode('bulk'); setShowForm(false) }}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition-all ${mode === 'bulk' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              <FileSpreadsheet className="size-3.5" />Bulk CSV
            </button>
          </div>
          {mode === 'single' && (
            <button onClick={() => setShowForm(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${showForm ? 'bg-white/10 text-slate-300' : 'bg-orange-500 text-white hover:bg-orange-400 shadow-lg shadow-orange-500/20'}`}>
              {showForm ? <><X className="size-4" />Cancel</> : <><Plus className="size-4" />Add Product</>}
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
          toast.type === 'error'
            ? 'border-red-500/20 bg-red-500/10 text-red-400'
            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <X className="size-4" /> : <Check className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Bulk Import */}
      {mode === 'bulk' && <BulkImportPanel onDone={n => showToast(`${n} products imported!`)} />}

      {/* Single Add Form */}
      {mode === 'single' && showForm && (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Package className="size-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">New Product</h3>
            <span className="text-[10px] text-slate-500 ml-1">— only Name is required</span>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { k: 'name', label: 'Name *', placeholder: 'e.g. Royal Basmati Rice', required: true },
              { k: 'brand', label: 'Brand', placeholder: 'e.g. Royal' },
              { k: 'price', label: 'Price (€)', placeholder: '0.00', type: 'number' },
              { k: 'unit', label: 'Unit / Size', placeholder: 'e.g. 5kg, 500g' },
              { k: 'image', label: 'Image URL', placeholder: 'https://…' },
              { k: 'origin', label: 'Origin', placeholder: 'India' },
              { k: 'dietary', label: 'Dietary Tags', placeholder: 'Halal, Vegan' },
              { k: 'description', label: 'Description', placeholder: 'Short description' },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{f.label}</label>
                <input required={f.required} type={f.type || 'text'} step={f.type === 'number' ? '0.01' : undefined}
                  value={(form as any)[f.k]} onChange={e => setF(f.k, e.target.value)}
                  placeholder={f.placeholder} className={inputCls()} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setF('category', e.target.value)} className={selectCls()}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Stock Status</label>
              <select value={form.stock} onChange={e => setF('stock', e.target.value)} className={selectCls()}>
                {STOCK_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" disabled={creating}
                className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-400 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20">
                {creating ? <><Loader2 className="inline size-4 animate-spin mr-2" />Adding…</> : 'Add Product → Live Storefront'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: search + filters + bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 flex-1 min-w-[180px] max-w-xs">
          <Search className="size-4 shrink-0 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
          {search && <button onClick={() => setSearch('')}><X className="size-3.5 text-slate-500 hover:text-white" /></button>}
        </div>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-all">
          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {selected.size > 0 && (
          <button onClick={handleDeleteSelected} disabled={bulkDeleting}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
            {bulkDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete {selected.size} selected
          </button>
        )}

        <button onClick={toggleAll}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all">
          {allSelected ? <CheckSquare className="size-4 text-orange-400" /> : <Square className="size-4" />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900 p-8 text-center">
          <Loader2 className="size-6 animate-spin text-orange-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading inventory…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900 p-10 text-center">
          <Package className="mx-auto mb-3 size-8 text-slate-600" />
          <p className="text-sm text-slate-500">{products.length === 0 ? 'No products yet.' : 'No products match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([cat, catProducts]) => {
            const catIds = catProducts.map(p => p.id)
            const allCatSel = catIds.length > 0 && catIds.every(id => selected.has(id))
            const isCollapsed = collapsed.has(cat)
            return (
              <div key={cat} className="rounded-2xl border border-white/5 bg-slate-900 overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleCategory(cat)}
                      className={`flex items-center transition-colors ${allCatSel ? 'text-orange-400' : 'text-slate-600 hover:text-slate-400'}`}>
                      {allCatSel ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    </button>
                    <button onClick={() => toggleCollapse(cat)}
                      className="flex items-center gap-2 text-sm font-bold text-white hover:text-orange-400 transition-colors">
                      {isCollapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                      {cat}
                      <span className="text-xs font-normal text-slate-500">({catProducts.length})</span>
                    </button>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat)}
                    className="flex items-center gap-1 rounded-lg border border-red-500/15 bg-red-500/5 px-2.5 py-1 text-[11px] font-semibold text-red-400/70 hover:bg-red-500/15 hover:text-red-400 transition-all">
                    <Trash2 className="size-3" />Delete all
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[820px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          {['', 'Product', 'Category', 'Price', 'Unit', 'Stock', 'Actions'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {catProducts.map(product => (
                          <EditableRow
                            key={product.id}
                            product={product}
                            selected={selected.has(product.id)}
                            onSelect={v => toggleOne(product.id, v)}
                            onSaved={fields => {
                              updateLocally(product.id, fields)
                              showToast(`"${product.name}" updated!`)
                            }}
                            onDelete={() => {
                              removeLocally([product.id])
                              setSelected(s => { const n = new Set(s); n.delete(product.id); return n })
                              showToast(`"${product.name}" deleted.`)
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
