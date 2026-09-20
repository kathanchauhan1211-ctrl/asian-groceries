'use client'

import React, { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy
} from 'firebase/firestore'
import { adminPortalDb as clientDb } from '@/lib/firebase-admin-client'
import {
  Plus, Trash2, Check, X, Loader2, Edit3, GripVertical, Save, Image as ImageIcon, Tag
} from 'lucide-react'
import { type BrandDoc } from '@/lib/use-brands'

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

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [emoji, setEmoji] = useState('')
  const [image, setImage] = useState('')
  const [color, setColor] = useState('#92400e')
  const [textColor, setTextColor] = useState('#ffffff')
  const [href, setHref] = useState('')
  const [badge, setBadge] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    const q = query(collection(clientDb, 'brands'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() } as BrandDoc)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  function openNew() {
    setEditingId('new')
    setName('')
    setTagline('')
    setEmoji('✨')
    setImage('')
    setColor('#92400e')
    setTextColor('#ffffff')
    setHref('/?q=brand')
    setBadge('')
    setActive(true)
  }

  function openEdit(b: BrandDoc) {
    setEditingId(b.id)
    setName(b.name)
    setTagline(b.tagline)
    setEmoji(b.emoji)
    setImage(b.image || '')
    setColor(b.color)
    setTextColor(b.textColor)
    setHref(b.href)
    setBadge(b.badge || '')
    setActive(b.active ?? true)
  }

  async function handleSave() {
    if (!name.trim()) return alert("Brand Name is required")
    setSaving(true)
    try {
      const isNew = editingId === 'new'
      const id = isNew ? `brand_${Date.now()}` : editingId!
      const order = isNew ? brands.length : brands.find(b => b.id === id)?.order || 0
      
      const payload: BrandDoc = {
        id, order,
        name: name.trim(),
        tagline: tagline.trim(),
        emoji: emoji.trim(),
        image: image.trim() || '',
        color: color.trim(),
        textColor: textColor.trim(),
        href: href.trim() || `/?q=${encodeURIComponent(name.trim().toLowerCase())}`,
        badge: badge.trim() || '',
        active
      }

      await setDoc(doc(clientDb, 'brands', id), payload, { merge: true })
      setEditingId(null)
    } catch (e) {
      console.error(e)
      alert("Failed to save brand.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this brand?')) return
    try {
      await deleteDoc(doc(clientDb, 'brands', id))
    } catch (e) {
      console.error(e)
      alert("Failed to delete brand.")
    }
  }

  async function moveUp(index: number) {
    if (index === 0) return
    const newBrands = [...brands]
    const temp = newBrands[index].order
    newBrands[index].order = newBrands[index - 1].order
    newBrands[index - 1].order = temp
    await updateOrders(newBrands)
  }

  async function moveDown(index: number) {
    if (index === brands.length - 1) return
    const newBrands = [...brands]
    const temp = newBrands[index].order
    newBrands[index].order = newBrands[index + 1].order
    newBrands[index + 1].order = temp
    await updateOrders(newBrands)
  }

  async function updateOrders(updated: BrandDoc[]) {
    // Sort array by the new order property
    updated.sort((a, b) => a.order - b.order)
    // Normalize order index
    updated.forEach((b, i) => b.order = i)
    // Bulk write
    for (const b of updated) {
      await setDoc(doc(clientDb, 'brands', b.id), { order: b.order }, { merge: true })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 pt-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag className="size-6 text-orange-500" /> Brand OS
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage the brands displayed in the storefront catalog.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20">
          <Plus className="size-4" /> Add Brand
        </button>
      </div>

      {/* Brands List */}
      <div className="space-y-3">
        {brands.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/5">
            <ImageIcon className="size-10 text-white/20 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No brands configured yet.</p>
            <button onClick={openNew} className="mt-4 text-orange-400 font-medium text-sm hover:underline">Create your first brand</button>
          </div>
        )}

        {brands.map((b, idx) => (
          <div key={b.id} className="flex items-center gap-4 rounded-xl border p-3 transition-all hover:bg-white/[0.02]" style={{ borderColor: C.border, background: C.surface }}>
            {/* Sort handles */}
            <div className="flex flex-col gap-1 items-center px-1">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-slate-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">▲</button>
              <button onClick={() => moveDown(idx)} disabled={idx === brands.length - 1} className="text-slate-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">▼</button>
            </div>

            {/* Thumbnail */}
            <div className="size-16 rounded-lg bg-cover bg-center shrink-0 border border-white/10 flex items-center justify-center text-2xl relative overflow-hidden" 
                 style={{ 
                   backgroundColor: b.color, 
                   backgroundImage: b.image ? `url(${b.image})` : `linear-gradient(135deg, ${b.color}f0, ${b.color}99)`
                 }}>
              {b.image && <div className="absolute inset-0 bg-black/30" />}
              {!b.image && <span className="drop-shadow-md">{b.emoji}</span>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">{b.name}</h3>
                {b.badge && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-white">{b.badge}</span>}
                {!b.active && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-400">Hidden</span>}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{b.tagline}</p>
              <p className="text-[10px] text-slate-500 truncate mt-1">Links to: {b.href}</p>
            </div>

            <div className="flex items-center gap-2 pr-2">
              <button onClick={() => openEdit(b)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <Edit3 className="size-4" />
              </button>
              <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingId(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl border flex flex-col max-h-[90vh]" style={{ background: C.surface, borderColor: C.border }}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: C.border }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="size-5 text-orange-500" />
                {editingId === 'new' ? 'Create Brand' : 'Edit Brand'}
              </h2>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Brand Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Aashirvaad" />
                </div>
                <div>
                  <label className={labelCls}>Tagline</label>
                  <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Atta & Flour" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Emoji (Fallback)</label>
                  <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. 🌾" />
                </div>
                <div>
                  <label className={labelCls}>Badge (Optional)</label>
                  <input type="text" value={badge} onChange={e => setBadge(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Best Seller" />
                </div>
                <div className="flex flex-col justify-end">
                   <label className="flex items-center gap-3 h-[38px] px-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-colors" style={{ borderColor: C.border }}>
                    <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded size-4 accent-orange-500" />
                    <span className="text-sm font-bold text-white">Active</span>
                  </label>
                </div>
              </div>

              <div>
                <label className={labelCls}>Search Link</label>
                <input type="text" value={href} onChange={e => setHref(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. /?q=aashirvaad" />
              </div>

              <hr style={{ borderColor: C.border }} />

              <div>
                <label className={labelCls}>Background Image URL (Overrides Emoji & Gradient)</label>
                <input type="text" value={image} onChange={e => setImage(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. /images/brand-bg.jpg" />
                <p className="text-[10px] text-slate-500 mt-1.5">Leave empty to use Emoji + Color Gradient.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Base Color</label>
                  <div className="flex items-center gap-3 p-1.5 rounded-lg border" style={{ borderColor: C.border, background: C.subtle }}>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="size-7 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full text-sm text-white bg-transparent outline-none uppercase font-mono" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Text Color</label>
                  <div className="flex items-center gap-3 p-1.5 rounded-lg border" style={{ borderColor: C.border, background: C.subtle }}>
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="size-7 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full text-sm text-white bg-transparent outline-none uppercase font-mono" />
                  </div>
                </div>
              </div>

              {/* Dynamic Preview */}
              <div className="mt-4">
                 <label className={labelCls}>Card Preview</label>
                 <div className="w-[160px] h-[130px] relative rounded-2xl overflow-hidden bg-cover bg-center border"
                      style={{ 
                        borderColor: C.border,
                        backgroundColor: color, 
                        backgroundImage: image ? `url(${image})` : `linear-gradient(135deg, ${color}f0, ${color}99)`
                      }}>
                    {!image && <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.5) 0%, transparent 55%)' }} />}
                    {image && <div className="absolute inset-0 bg-black/40" />}
                    
                    {badge && (
                      <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-white border border-white/20">
                        {badge}
                      </div>
                    )}
                    
                    {!image && (
                      <div className="absolute top-3 left-3 text-3xl select-none drop-shadow-md">
                        {emoji}
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-black tracking-tight leading-none" style={{ color: textColor }}>{name || 'Brand Name'}</p>
                      <p className="text-[10px] mt-0.5 font-semibold opacity-75" style={{ color: textColor }}>{tagline || 'Tagline'}</p>
                    </div>
                 </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-black/20 rounded-b-2xl" style={{ borderColor: C.border }}>
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-600 text-sm font-bold text-white hover:bg-orange-500 disabled:opacity-50 transition-colors shadow-lg shadow-orange-500/20">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save Brand
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
