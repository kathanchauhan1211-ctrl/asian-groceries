'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot, setDoc, query, orderBy
} from 'firebase/firestore'
import { adminPortalDb as clientDb } from '@/lib/firebase-admin-client'
import { Plus, Trash2, Check, X, Loader2, Edit3, ChevronDown, ChevronUp, GripVertical, Image as ImageIcon } from 'lucide-react'
import { type BannerSlot, type BannerSlide, type BannerSlotPosition, FALLBACK_SLOTS } from '@/lib/use-banners'

// ── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#080C14',
  surface: '#0C1118',
  subtle: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.12)',
  muted: '#6B7280',
  orange: '#F97316',
  white: '#ffffff',
}

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm text-white bg-transparent outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
const inputStyle = { borderColor: C.border, background: C.subtle }
const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"

// ── Slide Editor Modal ────────────────────────────────────────────────────────

interface SlideEditorProps {
  slide: Partial<BannerSlide> | null
  onSave: (slide: BannerSlide) => void
  onClose: () => void
}

function SlideEditor({ slide, onSave, onClose }: SlideEditorProps) {
  const [title, setTitle] = useState(slide?.title ?? '')
  const [subtitle, setSubtitle] = useState(slide?.subtitle ?? '')
  const [tagline, setTagline] = useState(slide?.tagline ?? '')
  const [image, setImage] = useState(slide?.image ?? '')
  const [link, setLink] = useState(slide?.link ?? '/shop')
  const [bgColor, setBgColor] = useState(slide?.bgColor ?? '#1E293B')
  const [textColor, setTextColor] = useState(slide?.textColor ?? '#FFFFFF')
  const [active, setActive] = useState(slide?.active ?? true)

  function handleSave() {
    if (!title.trim()) return alert('Title is required')
    if (!image.trim()) return alert('Image URL is required')
    onSave({
      id: slide?.id ?? `slide-${Date.now()}`,
      order: slide?.order ?? 99,
      title: title.trim(),
      subtitle: subtitle.trim(),
      tagline: tagline.trim(),
      image: image.trim(),
      link: link.trim(),
      bgColor,
      textColor,
      active,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh]"
        style={{ background: C.bg, borderColor: C.border }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <h3 className="text-[15px] font-bold text-white">
            {slide?.id ? 'Edit Slide' : 'Add Slide'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Text */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="e.g. Ganesh Idols" />
            </div>
            <div>
              <label className={labelCls}>Subtitle / Badge</label>
              <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="e.g. FESTIVE SEASON" />
            </div>
            <div>
              <label className={labelCls}>Tagline (optional)</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Short description..." />
            </div>
          </div>

          {/* Image & Link */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Image URL *</label>
              <div className="flex gap-3 items-center">
                <input type="text" value={image} onChange={e => setImage(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="https://..." />
                {image && (
                  <div className="size-10 shrink-0 rounded border bg-cover bg-center"
                    style={{ backgroundImage: `url(${image})`, borderColor: C.border }} />
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Destination Link</label>
              <input type="text" value={link} onChange={e => setLink(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="/shop?category=..." />
            </div>
          </div>

          {/* Colors & Active */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Background</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="size-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Text Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="size-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Visibility</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                  className="rounded size-4" style={{ accentColor: '#F97316' }} />
                <span className="text-sm font-medium text-white">Active</span>
              </label>
            </div>
          </div>

          {/* Preview swatch */}
          {image && (
            <div>
              <label className={labelCls}>Preview</label>
              <div className="relative h-20 rounded-xl overflow-hidden flex items-center"
                style={{ backgroundColor: bgColor }}>
                <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${image})`,
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)',
                    maskImage: 'linear-gradient(to right, transparent, black 30%)',
                  }} />
                <div className="relative z-10 px-4">
                  <p className="text-xs font-black" style={{ color: textColor }}>{title || 'Title'}</p>
                  {subtitle && <p className="text-[9px] font-bold opacity-70" style={{ color: textColor }}>{subtitle}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t p-4"
          style={{ borderColor: C.border, background: C.surface }}>
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Check className="size-4" />
            Save Slide
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Slot Card — shows one banner zone with its slides ─────────────────────────

interface SlotCardProps {
  slot: BannerSlot
  label: string
  badge: string
  badgeColor: string
  onSaveSlot: (updated: BannerSlot) => Promise<void>
  saving: boolean
}

function SlotCard({ slot, label, badge, badgeColor, onSaveSlot, saving }: SlotCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingSlide, setEditingSlide] = useState<Partial<BannerSlide> | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [intervalMs, setIntervalMs] = useState(slot.autoIntervalMs)

  function openNewSlide() {
    setEditingSlide({ order: slot.slides.length + 1 })
    setIsEditorOpen(true)
  }

  function openEditSlide(s: BannerSlide) {
    setEditingSlide(s)
    setIsEditorOpen(true)
  }

  async function handleSaveSlide(saved: BannerSlide) {
    const existing = slot.slides.findIndex(s => s.id === saved.id)
    let newSlides: BannerSlide[]
    if (existing >= 0) {
      newSlides = slot.slides.map(s => s.id === saved.id ? saved : s)
    } else {
      newSlides = [...slot.slides, saved]
    }
    await onSaveSlot({ ...slot, slides: newSlides, autoIntervalMs: intervalMs })
    setIsEditorOpen(false)
  }

  async function handleDeleteSlide(id: string) {
    if (!confirm('Remove this slide from the banner?')) return
    const newSlides = slot.slides.filter(s => s.id !== id)
    await onSaveSlot({ ...slot, slides: newSlides })
  }

  async function handleIntervalSave() {
    await onSaveSlot({ ...slot, autoIntervalMs: intervalMs })
  }

  return (
    <>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border, background: C.surface }}>
        {/* Header */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors"
        >
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: badgeColor, color: '#fff' }}>
            {badge}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-white">{label}</p>
            <p className="text-[12px]" style={{ color: C.muted }}>
              {slot.slides.length} slide{slot.slides.length !== 1 ? 's' : ''} · {slot.autoIntervalMs / 1000}s interval
            </p>
          </div>
          {expanded ? <ChevronUp className="size-4 text-gray-500" /> : <ChevronDown className="size-4 text-gray-500" />}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: C.border }}>
            {/* Interval setting */}
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: C.border }}>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Auto-Interval</label>
              <select
                value={intervalMs}
                onChange={e => setIntervalMs(Number(e.target.value))}
                className="rounded-lg border px-2 py-1.5 text-sm text-white bg-transparent outline-none focus:border-orange-500/60 transition-all"
                style={{ borderColor: C.border, background: C.subtle }}
              >
                <option value={2000}>2 seconds</option>
                <option value={3000}>3 seconds</option>
                <option value={4000}>4 seconds</option>
                <option value={5000}>5 seconds</option>
                <option value={6000}>6 seconds</option>
                <option value={8000}>8 seconds</option>
                <option value={10000}>10 seconds</option>
              </select>
              <button onClick={handleIntervalSave} disabled={saving}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                {saving ? <Loader2 className="size-3 animate-spin" /> : 'Save'}
              </button>
            </div>

            {/* Slides list */}
            {slot.slides.length === 0 && (
              <div className="text-center py-6">
                <ImageIcon className="size-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No slides yet</p>
              </div>
            )}

            {slot.slides.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border p-3 transition-all hover:bg-white/5"
                style={{ borderColor: C.border }}>
                {/* Thumbnail */}
                <div className="size-12 rounded-lg shrink-0 bg-cover bg-center border"
                  style={{ backgroundImage: `url(${s.image})`, borderColor: C.border, backgroundColor: s.bgColor }} />

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate">{s.title}</p>
                  <p className="text-[11px] truncate" style={{ color: C.muted }}>
                    {s.subtitle && `${s.subtitle} · `}{s.link}
                  </p>
                </div>

                {!s.active && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">hidden</span>
                )}

                <div className="flex items-center gap-1">
                  <button onClick={() => openEditSlide(s)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                    <Edit3 className="size-3" /> Edit
                  </button>
                  <button onClick={() => handleDeleteSlide(s.id)}
                    className="flex size-7 items-center justify-center rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button onClick={openNewSlide}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-[12px] font-bold text-gray-500 hover:text-orange-400 hover:border-orange-500/40 transition-all"
              style={{ borderColor: C.border }}>
              <Plus className="size-3.5" /> Add Slide
            </button>
          </div>
        )}
      </div>

      {/* Slide editor modal */}
      {isEditorOpen && (
        <SlideEditor
          slide={editingSlide}
          onSave={handleSaveSlide}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BannersPage() {
  const [slots, setSlots] = useState<BannerSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(clientDb, 'banners'), orderBy('order', 'asc')), snap => {
      if (snap.empty) {
        setSlots(FALLBACK_SLOTS)
      } else {
        setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as BannerSlot)))
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const saveSlot = useCallback(async (updated: BannerSlot) => {
    setSaving(true)
    try {
      await setDoc(doc(clientDb, 'banners', updated.id), updated, { merge: true })
    } catch (e) {
      console.error(e)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="size-6 animate-spin text-orange-500" />
      </div>
    )
  }

  const heroSlot = slots.find(s => s.slotPosition === 'main')
  const topSlot = slots.find(s => s.slotPosition === 'secondary_top')
  const bottomSlot = slots.find(s => s.slotPosition === 'secondary_bottom')

  return (
    <div className="mx-auto max-w-[860px] space-y-6 pb-12">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[20px] font-bold text-white tracking-tight">Homepage Banners</h2>
        <p className="text-[13px] text-gray-400 mt-1">
          Manage 3 independent banner zones. Each zone has its own carousel of slides that auto-swipe on the homepage.
        </p>
      </div>

      {/* Layout preview */}
      <div className="rounded-2xl border p-4 mb-2" style={{ borderColor: C.border, background: C.subtle }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Live Layout Preview</p>
        <div className="grid grid-cols-3 gap-2 h-20">
          <div className="col-span-2 rounded-xl flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            HERO BANNER
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex-1 rounded-xl flex items-center justify-center text-[9px] font-bold text-white bg-amber-500">
              SMALL TOP
            </div>
            <div className="flex-1 rounded-xl flex items-center justify-center text-[9px] font-bold text-white bg-emerald-500">
              SMALL BOTTOM
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Banner Section ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1" style={{ background: C.border }} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400">Hero Banner</span>
          <div className="h-px flex-1" style={{ background: C.border }} />
        </div>
        <p className="text-[12px] text-gray-500 mb-3">
          The large left banner. Add multiple slides — e.g. Ganesh Idols, Pooja items, seasonal offers. Slides auto-swipe automatically.
        </p>
        {heroSlot ? (
          <SlotCard
            slot={heroSlot}
            label="Hero Banner (Large Left)"
            badge="HERO"
            badgeColor="#F97316"
            onSaveSlot={saveSlot}
            saving={saving}
          />
        ) : (
          <p className="text-sm text-gray-500 italic">No hero slot found in Firestore. Re-seed the database.</p>
        )}
      </div>

      {/* ── Small Banners Section ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1" style={{ background: C.border }} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">Small Banners</span>
          <div className="h-px flex-1" style={{ background: C.border }} />
        </div>
        <p className="text-[12px] text-gray-500 mb-3">
          Two stacked banners on the right. Each has its own independent slides — e.g. Veggies/Fruits in top, Delivery options in bottom.
        </p>
        <div className="space-y-3">
          {topSlot && (
            <SlotCard
              slot={topSlot}
              label="Small Banner — Top Right"
              badge="TOP"
              badgeColor="#F59E0B"
              onSaveSlot={saveSlot}
              saving={saving}
            />
          )}
          {bottomSlot && (
            <SlotCard
              slot={bottomSlot}
              label="Small Banner — Bottom Right"
              badge="BOTTOM"
              badgeColor="#10B981"
              onSaveSlot={saveSlot}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  )
}
