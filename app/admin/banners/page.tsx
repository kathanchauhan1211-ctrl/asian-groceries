'use client'

import React, { useState, useEffect } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy
} from 'firebase/firestore'
import { adminPortalDb as clientDb } from '@/lib/firebase-admin-client'
import { Plus, Trash2, Check, X, Loader2, Edit3, Image as ImageIcon } from 'lucide-react'
import { type BannerConfig, type BannerPosition } from '@/lib/use-banners'

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

const POSITIONS: { value: BannerPosition; label: string }[] = [
  { value: 'main', label: 'Main Banner (Left)' },
  { value: 'secondary_top', label: 'Secondary Banner (Top Right)' },
  { value: 'secondary_bottom', label: 'Secondary Banner (Bottom Right)' },
]

export default function BannersPage() {
  const [docs, setDocs] = useState<BannerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Modal state
  const [position, setPosition] = useState<BannerPosition>('main')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [image, setImage] = useState('')
  const [link, setLink] = useState('')
  const [bgColor, setBgColor] = useState('#4A2323')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [active, setActive] = useState(true)
  const [order, setOrder] = useState(1)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(clientDb, 'banners'), orderBy('order', 'asc')), snap => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as BannerConfig)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  function openNew() {
    setEditingId('new')
    setPosition('main')
    setTitle('')
    setSubtitle('')
    setTagline('')
    setImage('')
    setLink('/shop')
    setBgColor('#4A2323')
    setTextColor('#FFFFFF')
    setActive(true)
    setOrder(docs.length + 1)
  }

  function openEdit(d: BannerConfig) {
    setEditingId(d.id)
    setPosition(d.position)
    setTitle(d.title)
    setSubtitle(d.subtitle || '')
    setTagline(d.tagline || '')
    setImage(d.image)
    setLink(d.link)
    setBgColor(d.bgColor)
    setTextColor(d.textColor)
    setActive(d.active)
    setOrder(d.order || 1)
  }

  function closeEdit() {
    setEditingId(null)
  }

  async function handleSave() {
    if (!title.trim() || !image.trim()) return alert('Title and Image are required')
    setSaving(true)
    try {
      const isNew = editingId === 'new'
      const id = isNew ? `banner-${Date.now().toString().slice(-6)}` : editingId!

      const payload: BannerConfig = {
        id,
        position,
        title: title.trim(),
        subtitle: subtitle.trim(),
        tagline: tagline.trim(),
        image: image.trim(),
        link: link.trim(),
        bgColor: bgColor.trim(),
        textColor: textColor.trim(),
        active,
        order: Number(order) || 1,
      }

      await setDoc(doc(clientDb, 'banners', id), payload, { merge: true })
      closeEdit()
    } catch (e) {
      console.error(e)
      alert('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner? It will disappear from the storefront.')) return
    await deleteDoc(doc(clientDb, 'banners', id))
  }

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="size-6 animate-spin text-orange-500" /></div>
  }

  return (
    <div className="mx-auto max-w-[860px] space-y-4 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight">Homepage Banners</h2>
          <p className="text-[13px] text-gray-400 mt-1">Manage the dynamic banner grid shown below the collections.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          <Plus className="size-4" />
          Add Banner
        </button>
      </div>

      {docs.length === 0 && (
        <div className="rounded-2xl border p-12 text-center" style={{ borderColor: C.border, background: C.surface }}>
          <ImageIcon className="size-10 text-gray-500 mx-auto mb-3" />
          <p className="text-white font-bold">No banners configured</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">The storefront will display the hardcoded fallback banners.</p>
          <button onClick={openNew} className="text-orange-500 font-semibold text-sm hover:underline">Create your first banner</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {docs.map(d => (
          <div key={d.id} className="flex flex-col rounded-xl border overflow-hidden transition-all hover:bg-white/5" style={{ borderColor: C.border, background: C.surface }}>
            {/* Header / Preview strip */}
            <div className="flex items-center gap-4 p-4 border-b" style={{ borderColor: C.border }}>
              {/* Mini Preview Square */}
              <div 
                className="size-14 rounded-lg bg-cover bg-center shrink-0 border" 
                style={{ backgroundImage: `url(${d.image})`, borderColor: C.border }} 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-bold text-white truncate">{d.title}</h3>
                  {!d.active && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">HIDDEN</span>}
                </div>
                <p className="text-[12px] truncate" style={{ color: C.muted }}>
                  {POSITIONS.find(p => p.value === d.position)?.label} • {d.link}
                </p>
              </div>
              <div className="flex items-center gap-2 pr-2">
                <button onClick={() => openEdit(d)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                  <Edit3 className="size-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(d.id)} className="flex size-7 items-center justify-center rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh]" style={{ background: C.bg, borderColor: C.border }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
              <h3 className="text-[15px] font-bold text-white">
                {editingId === 'new' ? 'Create Banner' : 'Edit Banner'}
              </h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-white transition-colors">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Position & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Position</label>
                  <select 
                    value={position} 
                    onChange={e => setPosition(e.target.value as BannerPosition)}
                    className={inputCls} 
                    style={inputStyle}
                  >
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Sort Order</label>
                  <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className={inputCls} style={inputStyle} />
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Primary Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. FRESH VEGGIES" />
                </div>
                <div>
                  <label className={labelCls}>Subtitle / Badge Label</label>
                  <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. GUARANTEED" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Tagline (Optional)</label>
                  <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Bring home blessings and prosperity today." />
                </div>
              </div>

              {/* Media & Link */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className={labelCls}>Image URL (Paste direct image link here)</label>
                  <div className="flex gap-3">
                    <input type="text" value={image} onChange={e => setImage(e.target.value)} className={inputCls} style={inputStyle} placeholder="https://..." />
                    {image && (
                      <div className="size-9 shrink-0 rounded border bg-cover bg-center" style={{ backgroundImage: `url(${image})`, borderColor: C.border }} />
                    )}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Destination Link</label>
                  <input type="text" value={link} onChange={e => setLink(e.target.value)} className={inputCls} style={inputStyle} placeholder="/shop?category=..." />
                </div>
              </div>

              {/* Colors & Visibility */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className={labelCls}>Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="size-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className={inputCls} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Text Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="size-8 rounded cursor-pointer bg-transparent border-0 p-0" />
                    <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)} className={inputCls} style={inputStyle} />
                  </div>
                </div>
                <div>
                   <label className={labelCls}>Visibility</label>
                   <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded size-4" style={{ accentColor: '#F97316' }} />
                    <span className="text-sm font-medium text-white">Active</span>
                   </label>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 border-t p-4" style={{ borderColor: C.border, background: C.surface }}>
              <button onClick={closeEdit} className="px-4 py-2 text-[13px] font-bold text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
