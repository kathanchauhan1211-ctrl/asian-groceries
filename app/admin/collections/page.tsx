'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy
} from 'firebase/firestore'
import { adminPortalDb as clientDb } from '@/lib/firebase-admin-client'
import {
  Plus, Trash2, Check, X, Loader2, Edit3, GripVertical, Save, Package, Image as ImageIcon
} from 'lucide-react'
import { type FeaturedCollectionDoc, type AutoRule } from '@/lib/use-featured-collections'
import { CATEGORY_GROUPS } from '@/lib/products'

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#080C14',
  surface: '#0C1118',
  subtle: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  muted: '#6B7280',
  orange: '#F97316',
  white: '#ffffff',
}

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm text-white bg-transparent outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
const inputStyle = { borderColor: C.border, background: C.subtle }
const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"

const AUTO_RULES: { value: AutoRule | ''; label: string }[] = [
  { value: 'newest', label: 'Newest (Recently Added)' },
  { value: 'price_asc', label: 'Lowest Price (Deals)' },
  { value: 'bestseller', label: 'Bestsellers' },
  { value: 'low_stock', label: 'Low Stock' },
]

export default function CollectionsPage() {
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [docs, setDocs] = useState<FeaturedCollectionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Modal state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('')
  const [color, setColor] = useState('#F97316')
  const [image, setImage] = useState('')

  const [enabled, setEnabled] = useState(true)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [autoRule, setAutoRule] = useState<AutoRule | ''>('')
  const [maxItems, setMaxItems] = useState(15)
  const [productIds, setProductIds] = useState<string[]>([])
  const [viewAllHref, setViewAllHref] = useState('/?sort=default')

  const [productSearch, setProductSearch] = useState('')

  // Fetch Products & Collections
  useEffect(() => {
    const unsubProds = onSnapshot(collection(clientDb, 'products'), snap => {
      setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubCols = onSnapshot(query(collection(clientDb, 'feed'), orderBy('order', 'asc')), snap => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeaturedCollectionDoc)))
      setLoading(false)
    })
    return () => { unsubProds(); unsubCols() }
  }, [])

  function openNew() {
    setEditingId('new')
    setTitle('')
    setDescription('')
    setEmoji('📦')
    setColor('#F97316')
    setImage('/collections/new-arrivals.jpg')
    setEnabled(true)
    setMode('auto')
    setAutoRule('newest')
    setMaxItems(15)
    setProductIds([])
    setViewAllHref('/?sort=default')
  }

  function openEdit(d: FeaturedCollectionDoc) {
    setEditingId(d.id)
    setTitle(d.title)
    setDescription(d.description || '')
    setEmoji(d.emoji || '📦')
    setColor(d.color || '#F97316')
    setImage(d.image || '')
    setEnabled(d.enabled)
    setMode(d.mode)
    setAutoRule(d.autoRule)
    setMaxItems(d.maxItems || 15)
    setProductIds(d.productIds || [])
    setViewAllHref(d.viewAllHref || '/')
  }

  function closeEdit() {
    setEditingId(null)
  }

  async function handleSave() {
    if (!title.trim()) return alert('Title is required')
    setSaving(true)
    try {
      const isNew = editingId === 'new'
      const id = isNew ? title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4) : editingId!

      const payload: FeaturedCollectionDoc = {
        id,
        title: title.trim(),
        description: description.trim(),
        emoji,
        color,
        image: image.trim(),
        order: isNew ? docs.length : docs.find(d => d.id === id)?.order ?? 0,
        enabled,
        mode,
        autoRule,
        maxItems: Number(maxItems),
        productIds,
        viewAllHref: viewAllHref.trim(),
      }

      await setDoc(doc(clientDb, 'feed', id), payload, { merge: true })
      closeEdit()
    } catch (e) {
      console.error(e)
      alert('Failed to save collection')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection? It will instantly disappear from the storefront.')) return
    await deleteDoc(doc(clientDb, 'feed', id))
  }

  async function moveDoc(index: number, dir: -1 | 1) {
    const next = [...docs]
    const a = next[index]
    const b = next[index + dir]
    if (!a || !b) return
    next[index] = b
    next[index + dir] = a

    // Update order values sequentially
    const updates = next.map((d, i) => setDoc(doc(clientDb, 'feed', d.id), { order: i }, { merge: true }))
    await Promise.all(updates)
  }

  const searchResults = useMemo(() => {
    if (!productSearch) return []
    const q = productSearch.toLowerCase()
    return allProducts
      .filter(p => p.name?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, 10)
  }, [productSearch, allProducts])

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="size-6 animate-spin text-orange-500" /></div>
  }

  return (
    <div className="mx-auto max-w-[860px] space-y-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight">Storefront Feed</h2>
          <p className="text-[13px] text-gray-400 mt-1">Manage the 4 feed sections shown on the homepage in real-time.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          <Plus className="size-4" />
          Add Collection
        </button>
      </div>

      {docs.length === 0 && (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: C.border, background: C.surface }}>
          <ImageIcon className="size-10 text-gray-500 mx-auto mb-3" />
          <p className="text-white font-bold">No collections yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">The storefront will not show any category cards.</p>
          <button onClick={openNew} className="text-orange-500 font-semibold text-sm hover:underline">Create your first collection</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {docs.map((d, i) => (
          <div key={d.id} className="flex flex-col gap-2 rounded-xl border p-3 pl-2 transition-all hover:bg-white/5" style={{ borderColor: C.border, background: C.surface }}>
            {/* Feed Header */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveDoc(i, -1)} disabled={i === 0} className="disabled:opacity-20 text-gray-500 hover:text-white"><GripVertical className="size-3" /></button>
                <button onClick={() => moveDoc(i, 1)} disabled={i === docs.length - 1} className="disabled:opacity-20 text-gray-500 hover:text-white"><GripVertical className="size-3" /></button>
              </div>

              <div className="h-12 w-12 rounded-lg bg-gray-800 shrink-0 overflow-hidden relative border border-white/10 flex items-center justify-center">
                {d.image ? (
                  <img src={d.image} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-xl">{d.emoji}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[14px] text-white truncate">{d.title}</span>
                  {!d.enabled && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">HIDDEN</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[11px] font-bold rounded-full px-2 py-0.5"
                    style={
                      (d.productIds?.length || 0) > 0
                        ? { background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', color: '#4B5563', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                  >
                    {d.productIds?.length || 0} products
                  </span>
                  {(d.productIds?.length || 0) === 0 && (
                    <span className="text-[11px] text-gray-500">← pin from Products page</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(d)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"><Edit3 className="size-4" /></button>
                <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
              </div>
            </div>

            {/* Pinned Products Mini-Feed */}
            {(d.productIds?.length || 0) > 0 && (
              <div className="ml-10 mt-2 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {d.productIds.map(pid => {
                  const p = allProducts.find(x => x.id === pid)
                  if (!p) return null
                  return (
                    <div key={pid} className="group relative shrink-0 w-24 rounded-lg overflow-hidden border transition-all" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="aspect-square w-full bg-gray-900 relative">
                        {p.image ? (
                          <img src={p.image} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-700 text-xs">No img</div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={async () => {
                              if (!confirm(`Remove "${p.name}" from ${d.title}?`)) return
                              const nextIds = d.productIds.filter(id => id !== pid)
                              await setDoc(doc(clientDb, 'feed', d.id), { productIds: nextIds }, { merge: true })
                            }}
                            className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-transform hover:scale-110"
                            title="Remove from feed"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-[10px] text-white font-medium truncate">{p.name}</p>
                        <p className="text-[9px] text-orange-400 font-bold truncate">€{Number(p.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border flex flex-col max-h-[90vh] shadow-2xl" style={{ background: C.surface, borderColor: C.border }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white tracking-tight">{editingId === 'new' ? 'New Collection' : 'Edit Collection'}</h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-white"><X className="size-5" /></button>
            </div>

            <div className="space-y-5 overflow-y-auto p-5 scrollbar-thin">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Diwali Specials" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls}>Subtitle / Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Best items for Pooja" className={inputCls} style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Card Image URL</label>
                  <input value={image} onChange={e => setImage(e.target.value)} placeholder="/collections/sale.jpg or https://..." className={inputCls} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Emoji</label>
                    <input value={emoji} onChange={e => setEmoji(e.target.value)} className={inputCls} style={inputStyle} />
                  </div>
                  <div>
                    <label className={labelCls}>Color</label>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-[38px] w-full rounded border border-white/10 bg-black/20 p-1 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full" />

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelCls}>Population Mode</label>
                  <select value={mode} onChange={e => setMode(e.target.value as 'auto' | 'manual')} className={inputCls} style={inputStyle}>
                    <option value="auto">Auto (Rule based)</option>
                    <option value="manual">Manual (Pick products)</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className={labelCls}>Max Items</label>
                  <input type="number" min="1" max="30" value={maxItems} onChange={e => setMaxItems(Number(e.target.value))} className={inputCls} style={inputStyle} />
                </div>
              </div>

              {mode === 'auto' ? (
                <div>
                  <label className={labelCls}>Auto Rule</label>
                  <select value={autoRule} onChange={e => setAutoRule(e.target.value as AutoRule)} className={inputCls} style={inputStyle}>
                    <optgroup label="Standard Rules">
                      {AUTO_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </optgroup>
                    <optgroup label="By Category">
                      {CATEGORY_GROUPS.map(c => <option key={`category:${c.label}`} value={`category:${c.label}`}>{c.label}</option>)}
                    </optgroup>
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelCls} style={{ marginBottom: 0 }}>Pinned Products ({productIds.length})</label>
                    <span className="text-[10px] text-gray-500">Drag items to reorder</span>
                  </div>

                  {/* Pinned List */}
                  {productIds.length > 0 && (
                    <div className="flex flex-col gap-1.5 mb-3">
                      {productIds.map(id => {
                        const p = allProducts.find(x => x.id === id)
                        return (
                          <div key={id} className="flex items-center justify-between bg-black/30 rounded px-2 py-1.5 text-xs text-gray-300 border border-white/5">
                            <span className="truncate pr-2">{p?.name || id}</span>
                            <button onClick={() => setProductIds(prev => prev.filter(x => x !== id))} className="text-red-400 hover:text-red-300"><X className="size-3.5" /></button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Search to Add */}
                  <div className="relative mt-2">
                    <input
                      placeholder="Search to add product..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-[#0C1118] border-white/10 overflow-hidden z-10 max-h-40 overflow-y-auto shadow-2xl">
                        {searchResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (!productIds.includes(p.id)) setProductIds([...productIds, p.id])
                              setProductSearch('')
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-white hover:bg-orange-500/20"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>"View All" Button Link</label>
                <input value={viewAllHref} onChange={e => setViewAllHref(e.target.value)} placeholder="/?sort=default" className={inputCls} style={inputStyle} />
                <p className="text-[10px] text-gray-500 mt-1">URL when they click 'View All' in the popup. e.g. /?category=Pooja</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded bg-black/50 border-white/20 text-orange-500 focus:ring-orange-500/30 size-4" />
                <span className="text-sm font-semibold text-white">Enable Collection on Storefront</span>
              </label>
            </div>

            <div className="flex gap-3 p-5 border-t border-white/10 bg-black/20 rounded-b-2xl">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-lg"
                style={{ background: C.orange }}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? 'Saving...' : 'Save Collection'}
              </button>
              <button
                onClick={closeEdit}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
