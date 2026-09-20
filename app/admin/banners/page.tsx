'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, onSnapshot, setDoc, query, orderBy
} from 'firebase/firestore'
import { adminPortalDb as clientDb } from '@/lib/firebase-admin-client'
import { Plus, Trash2, Check, X, Loader2, Edit3, ChevronDown, ChevronUp, Image as ImageIcon, Settings2 } from 'lucide-react'
import { type BannerSlot, type BannerSlide, type BannerSlotPosition, FALLBACK_SLOTS } from '@/lib/use-banners'

// ── Shared Glassmorphism Classes ──────────────────────────────────────────────
const glassCard = "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden"
const glassInput = "w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-white bg-black/20 backdrop-blur-md outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Heavy Blur Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_0_60px_-15px_rgba(255,255,255,0.1)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 bg-white/[0.02]">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Settings2 className="size-5 text-orange-400" />
            {slide?.id ? 'Edit Slide Details' : 'Configure New Slide'}
          </h3>
          <button onClick={onClose} className="rounded-full p-2 bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls}>Primary Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className={glassInput} placeholder="e.g. Premium Ganesh Idols" />
            </div>
            <div>
              <label className={labelCls}>Subtitle / Badge</label>
              <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
                className={glassInput} placeholder="e.g. FESTIVE LAUNCH" />
            </div>
            <div>
              <label className={labelCls}>Tagline (optional)</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                className={glassInput} placeholder="Short catchy phrase..." />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Image URL *</label>
              <div className="flex gap-4 items-center">
                <input type="text" value={image} onChange={e => setImage(e.target.value)}
                  className={glassInput} placeholder="https://..." />
                {image && (
                  <div className="size-12 shrink-0 rounded-xl border border-white/10 bg-cover bg-center shadow-inner"
                    style={{ backgroundImage: `url(${image})` }} />
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Destination Link</label>
              <input type="text" value={link} onChange={e => setLink(e.target.value)}
                className={glassInput} placeholder="/shop?category=..." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Background</label>
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/10">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="size-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="w-full text-xs text-white bg-transparent outline-none uppercase" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Text Color</label>
              <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/10">
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="size-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)}
                  className="w-full text-xs text-white bg-transparent outline-none uppercase" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Visibility</label>
              <label className="flex items-center gap-3 h-[48px] px-4 rounded-xl border border-white/10 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)}
                  className="rounded size-4 accent-orange-500" />
                <span className="text-sm font-bold text-white">Active</span>
              </label>
            </div>
          </div>

          {/* Mini Preview */}
          {image && (
            <div className="pt-2">
              <label className={labelCls}>Dynamic Preview</label>
              <div className="relative h-24 rounded-2xl overflow-hidden border border-white/10 shadow-inner flex items-center"
                style={{ backgroundColor: bgColor }}>
                <div className="absolute inset-y-0 right-0 w-[55%] bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${image})`,
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)',
                    maskImage: 'linear-gradient(to right, transparent, black 30%)',
                  }} />
                <div className="relative z-10 px-5 max-w-[65%]">
                  <p className="text-sm font-black leading-tight drop-shadow-md" style={{ color: textColor }}>{title || 'Title'}</p>
                  {subtitle && <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-1 drop-shadow-md" style={{ color: textColor }}>{subtitle}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5 bg-white/[0.02]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            <Check className="size-4" />
            Save Slide Config
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
      <div className={glassCard}>
        {/* Header Toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/5 transition-colors relative overflow-hidden"
        >
          {/* Subtle glow behind badge */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full blur-xl opacity-30" style={{ background: badgeColor }} />
          
          <span className="relative z-10 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg border border-white/20"
            style={{ background: `linear-gradient(135deg, ${badgeColor}, ${badgeColor}99)`, color: '#fff' }}>
            {badge}
          </span>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-[15px] font-bold text-white tracking-wide">{label}</p>
            <p className="text-[12px] text-white/50 font-medium">
              {slot.slides.length} slide{slot.slides.length !== 1 ? 's' : ''} · {slot.autoIntervalMs / 1000}s interval
            </p>
          </div>
          <div className="relative z-10 size-8 rounded-full bg-black/20 border border-white/10 flex items-center justify-center backdrop-blur-md">
            {expanded ? <ChevronUp className="size-4 text-white/70" /> : <ChevronDown className="size-4 text-white/70" />}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-white/10 bg-black/20 p-5 space-y-4">
            {/* Interval setting */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-2">Transition Speed</label>
              <select
                value={intervalMs}
                onChange={e => setIntervalMs(Number(e.target.value))}
                className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-white bg-black/40 outline-none focus:border-white/30 transition-all appearance-none"
              >
                <option value={2000}>2 seconds (Fast)</option>
                <option value={3000}>3 seconds</option>
                <option value={4000}>4 seconds</option>
                <option value={5000}>5 seconds (Default)</option>
                <option value={6000}>6 seconds</option>
                <option value={8000}>8 seconds</option>
                <option value={10000}>10 seconds (Slow)</option>
              </select>
              <button onClick={handleIntervalSave} disabled={saving}
                className="px-4 py-2 text-[12px] font-bold rounded-xl text-white transition-all hover:bg-white/10 border border-white/10 bg-white/5">
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
              </button>
            </div>

            {/* Slides list */}
            <div className="space-y-2.5">
              {slot.slides.length === 0 && (
                <div className="text-center py-8 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <ImageIcon className="size-10 text-white/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white/40">No slides configured for this zone</p>
                </div>
              )}

              {slot.slides.map((s, i) => (
                <div key={s.id} className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 pr-4 transition-all hover:bg-white/10 hover:border-white/20 overflow-hidden">
                  {/* Glass reflection */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Thumbnail */}
                  <div className="size-14 rounded-xl shrink-0 bg-cover bg-center border border-white/10 shadow-inner"
                    style={{ backgroundImage: `url(${s.image})`, backgroundColor: s.bgColor }} />

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-white truncate">{s.title}</p>
                      {!s.active && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/20">Hidden</span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-white/50 truncate mt-0.5">
                      {s.subtitle && <span className="text-white/70 uppercase tracking-wider">{s.subtitle}</span>}
                      {s.subtitle && <span className="mx-1.5 opacity-40">•</span>}
                      {s.link}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 z-10">
                    <button onClick={() => openEditSlide(s)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white/70 bg-black/20 hover:bg-white/10 hover:text-white transition-all border border-transparent hover:border-white/10">
                      <Edit3 className="size-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDeleteSlide(s.id)}
                      className="flex size-9 items-center justify-center rounded-xl bg-black/20 text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={openNewSlide}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3.5 text-[13px] font-bold text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-inner group">
              <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <Plus className="size-4" />
              </div>
              Add New Slide
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
          <Loader2 className="size-8 animate-spin text-white" />
        </div>
      </div>
    )
  }

  const heroSlot = slots.find(s => s.slotPosition === 'main')
  const topSlot = slots.find(s => s.slotPosition === 'secondary_top')
  const bottomSlot = slots.find(s => s.slotPosition === 'secondary_bottom')

  return (
    <div className="mx-auto max-w-[900px] space-y-8 pb-16 pt-4">
      {/* Heavy Header */}
      <div className="relative rounded-3xl p-8 border border-white/10 bg-black/20 backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Dynamic Banner OS</h2>
          <p className="text-[14px] text-white/60 font-medium max-w-xl leading-relaxed">
            Manage your storefront's spatial banner zones. Each zone acts as an independent carousel widget that automatically transitions through slides.
          </p>
        </div>
        
        {/* Mini Layout map */}
        <div className="relative z-10 mt-8 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Spatial Map Preview</p>
          <div className="grid grid-cols-3 gap-3 h-24">
            <div className="col-span-2 rounded-xl flex items-center justify-center text-[11px] font-black tracking-widest text-white shadow-lg border border-white/20"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.8), rgba(234,88,12,0.8))', backdropFilter: 'blur(10px)' }}>
              HERO ZONE
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex-1 rounded-xl flex items-center justify-center text-[10px] font-black tracking-widest text-white shadow-lg border border-white/20 bg-amber-500/80 backdrop-blur-md">
                SLOT B
              </div>
              <div className="flex-1 rounded-xl flex items-center justify-center text-[10px] font-black tracking-widest text-white shadow-lg border border-white/20 bg-emerald-500/80 backdrop-blur-md">
                SLOT C
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Banner Section ── */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500/50" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400 drop-shadow-md">Hero Zone</span>
          <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 via-white/5 to-transparent" />
        </div>
        
        {heroSlot ? (
          <SlotCard
            slot={heroSlot}
            label="Hero Carousel (Left Column)"
            badge="HERO"
            badgeColor="#F97316"
            onSaveSlot={saveSlot}
            saving={saving}
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md">
            <p className="text-sm text-white/50 font-medium">No hero slot found in configuration.</p>
          </div>
        )}
      </div>

      {/* ── Small Banners Section ── */}
      <div className="relative">
        <div className="flex items-center gap-3 mb-5 mt-10">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-sky-500/50" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 drop-shadow-md">Secondary Zones</span>
          <div className="h-px flex-1 bg-gradient-to-r from-sky-500/50 via-white/5 to-transparent" />
        </div>
        
        <div className="space-y-5">
          {topSlot && (
            <SlotCard
              slot={topSlot}
              label="Secondary Banner (Top Right)"
              badge="SLOT B"
              badgeColor="#F59E0B"
              onSaveSlot={saveSlot}
              saving={saving}
            />
          )}
          {bottomSlot && (
            <SlotCard
              slot={bottomSlot}
              label="Secondary Banner (Bottom Right)"
              badge="SLOT C"
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

