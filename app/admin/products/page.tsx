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
  ChevronDown, ChevronUp, Search, Filter, MoreHorizontal, CheckSquare, Square, Star
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────
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

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:      '#080C14',
  surface: '#0D1117',
  card:    '#111827',
  border:  'rgba(255,255,255,0.07)',
  muted:   '#374151',
  subtle:  '#1F2937',
}

// ─── Stock badge ─────────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: string }) {
  const map: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    'In Stock':    { bg: 'rgba(16,185,129,0.1)',  color: '#10B981', dot: '#10B981', label: 'In Stock' },
    'Low Stock':   { bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B', dot: '#F59E0B', label: 'Low Stock' },
    'Out of Stock':{ bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', dot: '#EF4444', label: 'Out of Stock' },
    'Sold Out':    { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', dot: '#EF4444', label: 'Sold Out' },
  }
  const s = map[stock] ?? map['In Stock']
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}22` }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

// ─── Category pill ───────────────────────────────────────────────────────────
function CatPill({ cat }: { cat: string }) {
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: 'rgba(249,115,22,0.08)', color: '#F97316', border: '1px solid rgba(249,115,22,0.15)' }}
    >
      {cat || 'Other'}
    </span>
  )
}

// ─── Icon button ─────────────────────────────────────────────────────────────
function IconBtn({
  onClick, disabled, title, danger = false, children, loading = false
}: {
  onClick: () => void; disabled?: boolean; title: string; danger?: boolean; children: React.ReactNode; loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className="flex size-7 items-center justify-center rounded-md transition-all disabled:opacity-40"
      style={{
        color: danger ? '#EF4444' : '#6B7280',
        background: 'transparent',
        border: '1px solid transparent',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)'
        e.currentTarget.style.color = danger ? '#EF4444' : '#F9FAFB'
        e.currentTarget.style.borderColor = danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = danger ? '#EF4444' : '#6B7280'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : children}
    </button>
  )
}

// ─── Input helpers ───────────────────────────────────────────────────────────
const inputCls = `w-full rounded-md border bg-transparent px-2.5 py-1.5 text-[13px] text-white outline-none transition-all placeholder:text-gray-600`
const inputStyle = { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }
const inputFocus = {
  border: '1px solid rgba(249,115,22,0.4)',
  boxShadow: '0 0 0 3px rgba(249,115,22,0.08)',
}
const selectStyle = { border: '1px solid rgba(255,255,255,0.1)', background: '#161B22', color: 'white' }

function FInput({ value, onChange, placeholder, type = 'text', required = false, step }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; step?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type} step={step} required={required}
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
      style={focused ? { ...inputFocus } : { ...inputStyle }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function FSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] outline-none appearance-none"
      style={selectStyle}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── Server delete helper ────────────────────────────────────────────────────
async function serverDeleteProducts(ids: string[]): Promise<void> {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken(true)
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

// ─── CSV helpers ─────────────────────────────────────────────────────────────
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

function buildProductDoc(data: Record<string, any>) {
  const price = parseFloat(data.price) || 0
  const unit = data.unit || '1 unit'
  const dietary = data.dietary
    ? data.dietary.split(',').map((d: string) => d.trim()).filter(Boolean)
    : []
  return {
    name:       data.name || 'Unnamed Product',
    brand:      data.brand || '',
    category:   data.category || 'Other',
    origin:     data.origin || 'India',
    price,
    unit,
    stock:      data.stock || 'In Stock',
    dietary,
    diet:       dietary,
    image:      data.image || '',
    tagline:    data.tagline || '',
    description: data.description || '',
    bestseller: Boolean(data.bestseller),
    variants:   [{ label: unit, size: unit, price }],
  }
}

// ─── Real-time admin hook ────────────────────────────────────────────────────
function useAdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(clientDb, 'products'), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  const removeLocally = useCallback((ids: string[]) => {
    setProducts(prev => prev.filter(p => !ids.includes(p.id)))
  }, [])

  const updateLocally = useCallback((id: string, fields: Record<string, any>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
  }, [])

  return { products, loading, removeLocally, updateLocally }
}

// ─── Editable Table Row ───────────────────────────────────────────────────────
function ProductRow({
  product, selected, onSelect, onSaved, onDelete, index
}: {
  product: AdminProduct; selected: boolean; onSelect: (v: boolean) => void
  onSaved: (fields: Record<string, any>) => void; onDelete: () => void; index: number
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    name:       product.name ?? '',
    brand:      product.brand ?? '',
    category:   product.category ?? 'Other',
    origin:     product.origin ?? 'India',
    price:      String(product.price ?? ''),
    unit:       product.unit ?? '',
    stock:      product.stock ?? 'In Stock',
    image:      product.image ?? '',
    tagline:    product.tagline ?? '',
    bestseller: Boolean(product.bestseller),
    dietary: Array.isArray(product.diet) ? product.diet.join(', ')
           : Array.isArray(product.dietary) ? product.dietary.join(', ') : '',
  })

  async function handleSave() {
    setSaving(true)
    const fields = buildProductDoc({ ...form })
    try {
      await updateDoc(doc(clientDb, 'products', product.id), fields)
      onSaved(fields)
      setEditing(false)
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"?`)) return
    setDeleting(true)
    onDelete()
    try { await serverDeleteProducts([product.id]) } catch (err: any) { console.error(err.message) }
  }

  const rowBg = selected ? 'rgba(249,115,22,0.04)' : 'transparent'

  if (editing) {
    return (
      <tr style={{ background: 'rgba(249,115,22,0.03)', borderBottom: `1px solid ${C.border}` }}>
        <td className="pl-4 pr-2 py-2.5">
          <input type="checkbox" checked={selected} onChange={e => onSelect(e.target.checked)}
            className="rounded" style={{ accentColor: '#F97316' }} />
        </td>
        <td className="px-3 py-2.5 min-w-[160px]"><FInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Product name" /></td>
        <td className="px-3 py-2.5 min-w-[110px]"><FInput value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="Brand" /></td>
        <td className="px-3 py-2.5 min-w-[150px]"><FSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={CATEGORIES} /></td>
        <td className="px-3 py-2.5 min-w-[90px]"><FInput value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" step="0.01" placeholder="0.00" /></td>
        <td className="px-3 py-2.5 min-w-[90px]"><FInput value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} placeholder="5kg" /></td>
        <td className="px-3 py-2.5 min-w-[130px]"><FSelect value={form.stock} onChange={v => setForm(f => ({ ...f, stock: v }))} options={STOCK_OPTIONS} /></td>
        <td className="px-3 py-2.5 min-w-[200px]"><FInput value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} placeholder="https://…" /></td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            {/* Bestseller toggle in edit row */}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, bestseller: !f.bestseller }))}
              title={form.bestseller ? 'Bestseller — click to unmark' : 'Mark as bestseller'}
              className="flex size-7 items-center justify-center rounded-md transition-all"
              style={{ color: form.bestseller ? '#F59E0B' : '#374151', background: form.bestseller ? 'rgba(245,158,11,0.1)' : 'transparent', border: '1px solid transparent' }}
            >
              <Star className="size-3.5" fill={form.bestseller ? '#F59E0B' : 'none'} />
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              {saving ? 'Saving' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex size-7 items-center justify-center rounded-md transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr
      className="group transition-colors"
      style={{
        background: rowBg,
        borderBottom: `1px solid ${C.border}`,
        opacity: deleting ? 0.3 : 1,
        transition: 'opacity 0.3s, background 0.1s',
      }}
    >
      <td className="pl-4 pr-2 py-3">
        <input type="checkbox" checked={selected} onChange={e => onSelect(e.target.checked)}
          className="rounded cursor-pointer" style={{ accentColor: '#F97316' }} />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          {product.image ? (
            <img
              src={product.image} alt={product.name} loading="lazy"
              className="size-9 rounded-md object-cover shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md" style={{ background: C.subtle }}>
              <Package className="size-4" style={{ color: '#374151' }} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13px] font-semibold text-white max-w-[180px]">{product.name}</p>
              {product.bestseller && (
                <Star className="size-3 shrink-0" style={{ color: '#F59E0B' }} fill="#F59E0B" />
              )}
            </div>
            {product.brand && <p className="text-[11px] mt-0.5" style={{ color: '#4B5563' }}>{product.brand}</p>}
          </div>
        </div>
      </td>
      <td className="px-3 py-3"><CatPill cat={product.category} /></td>
      <td className="px-3 py-3">
        <span className="text-[13px] font-semibold text-white tabular-nums">€{Number(product.price || 0).toFixed(2)}</span>
      </td>
      <td className="px-3 py-3 text-[12px]" style={{ color: '#4B5563' }}>{product.unit || '—'}</td>
      <td className="px-3 py-3"><StockBadge stock={product.stock} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn onClick={() => setEditing(true)} title="Edit product">
            <Pencil className="size-3.5" />
          </IconBtn>
          <IconBtn onClick={handleDelete} disabled={deleting} danger title="Delete product" loading={deleting}>
            <Trash2 className="size-3.5" />
          </IconBtn>
        </div>
      </td>
    </tr>
  )
}

// ─── Bulk CSV Import ──────────────────────────────────────────────────────────
function CSVImportPanel({ onDone, onClose }: { onDone: (n: number) => void; onClose: () => void }) {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
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

  async function handleImport() {
    setStatus('importing'); setProgress(0)
    const { writeBatch, doc: firestoreDoc } = await import('firebase/firestore')
    const BATCH_SIZE = 400
    let done = 0
    for (let i = 0; i < preview.length; i += BATCH_SIZE) {
      const batch = writeBatch(clientDb)
      preview.slice(i, i + BATCH_SIZE).forEach(row => {
        batch.set(firestoreDoc(collection(clientDb, 'products')), buildProductDoc(row))
      })
      await batch.commit()
      done += Math.min(BATCH_SIZE, preview.length - i)
      setProgress(Math.round((done / preview.length) * 100))
    }
    setStatus('done')
    onDone(preview.length)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="size-4" style={{ color: '#F97316' }} />
            <p className="text-[14px] font-semibold text-white">Import Products via CSV</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${C.border}` }}
            >
              <Download className="size-3.5" />
              Template
            </button>
            <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md" style={{ color: '#6B7280', background: 'rgba(255,255,255,0.05)' }}>
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Info bar */}
          <div className="flex items-start gap-3 rounded-md p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <AlertCircle className="size-4 mt-0.5 shrink-0" style={{ color: '#60A5FA' }} />
            <p className="text-[12px]" style={{ color: '#93C5FD' }}>
              Only <strong>name</strong> is required. Multiple dietary tags → comma separated.
              Download the template for the correct column format.
            </p>
          </div>

          {errors.length > 0 && (
            <div className="rounded-md p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              {errors.map((e, i) => <p key={i} className="text-[12px]" style={{ color: '#FCD34D' }}>{e}</p>)}
            </div>
          )}

          {/* Drop zone */}
          {(status === 'idle' || status === 'error') && (
            <div
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-3 rounded-lg py-10 cursor-pointer transition-all group"
              style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.background = 'rgba(249,115,22,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex size-11 items-center justify-center rounded-xl" style={{ background: 'rgba(249,115,22,0.1)' }}>
                <Upload className="size-5" style={{ color: '#F97316' }} />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-semibold text-white">Drop your CSV here</p>
                <p className="mt-0.5 text-[12px]" style={{ color: '#4B5563' }}>or click to browse — missing columns get smart defaults</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          {status === 'parsing' && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="size-5 animate-spin" style={{ color: '#F97316' }} />
              <span className="text-[13px]" style={{ color: '#6B7280' }}>Parsing CSV…</span>
            </div>
          )}

          {(status === 'preview' || status === 'importing' || status === 'done') && preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-white">{preview.length} products ready to import</p>
                {status === 'preview' && (
                  <button onClick={() => { setStatus('idle'); setPreview([]); setErrors([]) }}
                    className="text-[12px] transition-colors" style={{ color: '#4B5563' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
                    onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
                  >
                    ← Start over
                  </button>
                )}
              </div>

              {/* Preview table */}
              <div className="max-h-48 overflow-auto rounded-lg" style={{ border: `1px solid ${C.border}` }}>
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0" style={{ background: C.subtle }}>
                    <tr>
                      {['Name','Brand','Category','Price','Stock','Origin'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ background: C.surface }}>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2 font-medium text-white max-w-[140px] truncate">{row.name}</td>
                        <td className="px-3 py-2" style={{ color: '#6B7280' }}>{row.brand || '—'}</td>
                        <td className="px-3 py-2" style={{ color: '#6B7280' }}>{row.category || 'Other'}</td>
                        <td className="px-3 py-2 font-semibold text-white">€{(parseFloat(row.price)||0).toFixed(2)}</td>
                        <td className="px-3 py-2"><StockBadge stock={row.stock || 'In Stock'} /></td>
                        <td className="px-3 py-2" style={{ color: '#6B7280' }}>{row.origin || 'India'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress */}
              {status === 'importing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: '#6B7280' }}>Uploading to Firestore…</span>
                    <span className="font-semibold text-white">{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.subtle }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#F97316,#EA580C)' }} />
                  </div>
                </div>
              )}

              {status === 'done' && (
                <div className="flex items-center gap-2 rounded-md px-4 py-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Check className="size-4" style={{ color: '#10B981' }} />
                  <p className="text-[13px] font-semibold" style={{ color: '#10B981' }}>
                    {preview.length} products now live on the storefront!
                  </p>
                </div>
              )}

              {status === 'preview' && (
                <button
                  onClick={handleImport}
                  className="w-full rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 4px 14px rgba(249,115,22,0.25)' }}
                >
                  Import {preview.length} Products →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Add Product Drawer ───────────────────────────────────────────────────────
function AddProductDrawer({ onClose, onAdded }: { onClose: () => void; onAdded: (msg: string) => void }) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '', brand: '', category: 'Rice & Atta', origin: 'India',
    price: '', unit: '', stock: 'In Stock', dietary: '', image: '', description: '',
    tagline: '', bestseller: false,
  })


  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      await addDoc(collection(clientDb, 'products'), buildProductDoc(form))
      onAdded(`"${form.name}" added successfully`)
      onClose()
    } catch (err) { console.error(err) }
    finally { setCreating(false) }
  }

  const fields = [
    { k: 'name',        label: 'Product Name', placeholder: 'e.g. Royal Basmati Rice', required: true },
    { k: 'brand',       label: 'Brand',         placeholder: 'e.g. Royal' },
    { k: 'tagline',     label: 'Tagline',        placeholder: 'Short catchy line shown on card' },
    { k: 'price',       label: 'Price (€)',      placeholder: '0.00', type: 'number' },
    { k: 'unit',        label: 'Unit / Size',    placeholder: '5kg, 500g' },
    { k: 'origin',      label: 'Origin',         placeholder: 'India' },
    { k: 'dietary',     label: 'Dietary Tags',   placeholder: 'Halal, Vegan' },
    { k: 'image',       label: 'Image URL',      placeholder: 'https://…' },
    { k: 'description', label: 'Description',    placeholder: 'Short product description' },
  ]

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex" style={{ width: '420px' }}>
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative ml-auto flex h-full w-full flex-col overflow-hidden"
        style={{ background: C.surface, borderLeft: `1px solid ${C.border}` }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="text-[14px] font-semibold text-white">Add Product</p>
            <p className="mt-0.5 text-[12px]" style={{ color: '#4B5563' }}>Only name is required</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#6B7280' }}>
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer form */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.k} className={f.k === 'name' || f.k === 'image' || f.k === 'description' ? 'col-span-2' : ''}>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>
                  {f.label}{f.required && <span style={{ color: '#F97316' }}> *</span>}
                </label>
                <FInput
                  value={(form as any)[f.k]}
                  onChange={v => setForm(p => ({ ...p, [f.k]: v }))}
                  placeholder={f.placeholder}
                  type={f.type || 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  required={f.required}
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Category</label>
              <FSelect value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={CATEGORIES} />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4B5563' }}>Stock Status</label>
              <FSelect value={form.stock} onChange={v => setForm(p => ({ ...p, stock: v }))} options={STOCK_OPTIONS} />
            </div>

            {/* Bestseller toggle */}
            <div className="col-span-2">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, bestseller: !p.bestseller }))}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all"
                style={{
                  background: form.bestseller ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                  border: form.bestseller ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Star
                  className="size-4 shrink-0"
                  style={{ color: form.bestseller ? '#F59E0B' : '#374151' }}
                  fill={form.bestseller ? '#F59E0B' : 'none'}
                />
                <div className="text-left">
                  <p className="text-[13px] font-semibold" style={{ color: form.bestseller ? '#F59E0B' : '#9CA3AF' }}>
                    {form.bestseller ? '⭐ Marked as Bestseller' : 'Mark as Bestseller'}
                  </p>
                  <p className="text-[11px]" style={{ color: '#4B5563' }}>Appears in the Bestsellers carousel</p>
                </div>
              </button>
            </div>

          </div>

          <button
            type="submit" disabled={creating || !form.name.trim()}
            className="mt-5 w-full rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 4px 12px rgba(249,115,22,0.2)' }}
          >
            {creating ? <><Loader2 className="inline size-4 animate-spin mr-1.5" />Adding…</> : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProductsPage() {
  const { products, loading, removeLocally, updateLocally } = useAdminProducts()

  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [showCSV, setShowCSV] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

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

  async function handleDeleteSelected() {
    const ids = [...selected]
    if (!confirm(`Permanently delete ${ids.length} product${ids.length > 1 ? 's' : ''}?`)) return
    setBulkDeleting(true)
    removeLocally(ids)
    setSelected(new Set())
    try {
      await serverDeleteProducts(ids)
      showToast(`${ids.length} product${ids.length > 1 ? 's' : ''} deleted`)
    } catch (err: any) { showToast(`Delete failed: ${err.message}`, 'error') }
    finally { setBulkDeleting(false) }
  }

  async function handleDeleteCategory(cat: string) {
    const ids = (grouped.get(cat) || []).map(p => p.id)
    if (!ids.length) return
    if (!confirm(`Delete all ${ids.length} products in "${cat}"?`)) return
    removeLocally(ids)
    try {
      await serverDeleteProducts(ids)
      showToast(`All "${cat}" products deleted`)
    } catch (err: any) { showToast(`Delete failed: ${err.message}`, 'error') }
  }

  const uniqueCategories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Other'))).sort()]

  return (
    <div className="mx-auto max-w-[1280px] space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-bold text-white">Products</h1>
          <p className="mt-0.5 text-[13px]" style={{ color: '#4B5563' }}>
            {loading ? 'Loading…' : `${products.length} total products`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSV(true)}
            className="flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#D1D5DB', border: `1px solid ${C.border}` }}
          >
            <FileSpreadsheet className="size-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 2px 8px rgba(249,115,22,0.2)' }}
          >
            <Plus className="size-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-[13px] font-medium"
          style={{
            background: toast.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: toast.type === 'error' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
            color: toast.type === 'error' ? '#EF4444' : '#10B981',
          }}
        >
          {toast.type === 'error' ? <X className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg p-2"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
      >
        {/* Search */}
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-md px-3 py-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
          <Search className="size-3.5 shrink-0" style={{ color: '#4B5563' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-600"
          />
          {search && <button onClick={() => setSearch('')}><X className="size-3 text-gray-600 hover:text-gray-400" /></button>}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="cursor-pointer rounded-md px-3 py-1.5 text-[13px] outline-none"
          style={selectStyle}
        >
          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="h-5 w-px" style={{ background: C.border }} />

        {/* Select all */}
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all"
          style={{ color: allSelected ? '#F97316' : '#6B7280', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}
        >
          {allSelected ? <CheckSquare className="size-3.5 text-orange-400" /> : <Square className="size-3.5" />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>

        {/* Bulk delete */}
        {selected.size > 0 && (
          <button
            onClick={handleDeleteSelected} disabled={bulkDeleting}
            className="flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {bulkDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* ── Product table ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl py-20" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Loader2 className="size-6 animate-spin" style={{ color: '#F97316' }} />
          <p className="text-[13px]" style={{ color: '#4B5563' }}>Loading inventory…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl py-20" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Package className="size-8" style={{ color: '#1F2937' }} />
          <p className="text-[13px]" style={{ color: '#4B5563' }}>
            {products.length === 0 ? 'No products yet. Add your first product.' : 'No products match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([cat, catProducts]) => {
            const catIds = catProducts.map(p => p.id)
            const allCatSel = catIds.length > 0 && catIds.every(id => selected.has(id))
            const isCollapsed = collapsed.has(cat)

            return (
              <div
                key={cat}
                className="overflow-hidden rounded-xl"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}
              >
                {/* Category header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="transition-colors"
                      style={{ color: allCatSel ? '#F97316' : '#374151' }}
                    >
                      {allCatSel ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    </button>
                    <button
                      onClick={() => toggleCollapse(cat)}
                      className="flex items-center gap-2 text-[13px] font-semibold text-white transition-colors hover:text-orange-400"
                    >
                      {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
                      {cat}
                      <span className="text-[11px] font-normal" style={{ color: '#4B5563' }}>({catProducts.length})</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
                    style={{ color: '#6B7280', background: 'transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash2 className="size-3" />
                    Delete section
                  </button>
                </div>

                {/* Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ minWidth: '860px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {['', 'Product', 'Category', 'Price', 'Unit', 'Status', 'Actions'].map(h => (
                            <th
                              key={h}
                              className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                              style={{ color: '#374151' }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {catProducts.map((product, i) => (
                          <ProductRow
                            key={product.id}
                            index={i}
                            product={product}
                            selected={selected.has(product.id)}
                            onSelect={v => toggleOne(product.id, v)}
                            onSaved={fields => { updateLocally(product.id, fields); showToast(`"${product.name}" updated`) }}
                            onDelete={() => {
                              removeLocally([product.id])
                              setSelected(s => { const n = new Set(s); n.delete(product.id); return n })
                              showToast(`Product deleted`)
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

      {/* ── Modals ── */}
      {showCSV && <CSVImportPanel onDone={n => { showToast(`${n} products imported`); setShowCSV(false) }} onClose={() => setShowCSV(false)} />}
      {showAddDrawer && <AddProductDrawer onClose={() => setShowAddDrawer(false)} onAdded={msg => showToast(msg)} />}
    </div>
  )
}
