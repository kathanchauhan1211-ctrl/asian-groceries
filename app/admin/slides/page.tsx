'use client'

import { useState, useEffect, useRef } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query,
} from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import {
  Plus, Trash2, Edit3, Save, X, GripVertical, Eye, EyeOff,
  Image as ImageIcon, Link2, Type, AlignLeft, ArrowLeft, ArrowRight, Check,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Slide {
  id?: string
  img: string
  brand: string
  label: string
  headline: string
  sub: string
  cta: string
  href: string
  order: number
  enabled: boolean
}

const DEFAULT_SLIDE: Omit<Slide, 'id'> = {
  img: '',
  brand: '',
  label: '',
  headline: '',
  sub: '',
  cta: 'Shop Now',
  href: '/',
  order: 0,
  enabled: true,
}

// ─── Fallback / seed slides — mirrors promo-slider.tsx FALLBACK_SLIDES ─────────
const SEED_SLIDES: Omit<Slide, 'id'>[] = [
  {
    img:      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
    brand:    'Aashirvaad',
    label:    'Atta & Flour',
    headline: "India's Most Loved Flour",
    sub:      'Soft rotis every time — authentic stone-ground atta',
    cta:      'Shop Flour',
    href:     '/?category=Rice+%26+Grains',
    order:    0,
    enabled:  true,
  },
  {
    img:      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=1600&q=80',
    brand:    'MDH',
    label:    'Spices & Masalas',
    headline: 'Real Taste, Real Spice',
    sub:      'MDH — trusted by generations across South Asia',
    cta:      'Shop Spices',
    href:     '/?category=Spices',
    order:    1,
    enabled:  true,
  },
  {
    img:      'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&q=80',
    brand:    'TRS',
    label:    'Lentils & Pulses',
    headline: 'Premium Quality Pulses',
    sub:      "TRS — the UK's #1 South Asian ingredient brand",
    cta:      'Shop Lentils',
    href:     '/?category=Lentils+%26+Pulses',
    order:    2,
    enabled:  true,
  },
]

// ─── SlideForm ────────────────────────────────────────────────────────────────
function SlideForm({
  slide,
  onSave,
  onCancel,
  saving,
}: {
  slide: Partial<Slide>
  onSave: (data: Omit<Slide, 'id'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Omit<Slide, 'id'>>({
    ...DEFAULT_SLIDE,
    ...slide,
  })

  function field(key: keyof typeof form, value: string | boolean | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="rounded-2xl border bg-card shadow-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      {/* Preview */}
      <div className="relative w-full overflow-hidden" style={{ height: 180 }}>
        {form.img ? (
          <>
            <img src={form.img} alt="preview" className="w-full h-full object-cover" />
            <div
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2">
              <div className="flex flex-col min-w-0">
                {form.label && <span className="mb-0.5 w-fit rounded-sm bg-[#F97316] px-1.5 py-0.5 text-[8px] font-bold text-white uppercase">{form.label}</span>}
                <div className="flex items-center gap-1.5 min-w-0">
                  {form.headline && <p className="text-[11px] font-bold text-white truncate">{form.headline}</p>}
                  {form.sub && <span className="text-[10px] text-white/70 truncate border-l border-white/20 pl-1.5">{form.sub}</span>}
                </div>
              </div>
              {form.cta && <span className="ml-2 shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-slate-900">{form.cta} →</span>}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-100" style={{ background: 'var(--muted)' }}>
            <div className="text-center">
              <ImageIcon className="size-8 mx-auto mb-1" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Enter an image URL below to preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Image URL — full width */}
        <div className="sm:col-span-2">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <ImageIcon className="size-3.5" /> Image URL
          </label>
          <input
            type="url"
            placeholder="https://example.com/banner.jpg"
            value={form.img}
            onChange={e => field('img', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Type className="size-3.5" /> Brand Name
          </label>
          <input
            placeholder="e.g. Aashirvaad"
            value={form.brand}
            onChange={e => field('brand', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Type className="size-3.5" /> Category Label (pill)
          </label>
          <input
            placeholder="e.g. Atta & Flour"
            value={form.label}
            onChange={e => field('label', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Type className="size-3.5" /> Headline
          </label>
          <input
            placeholder="e.g. India's Most Loved Flour"
            value={form.headline}
            onChange={e => field('headline', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <AlignLeft className="size-3.5" /> Subtitle
          </label>
          <input
            placeholder="Short description..."
            value={form.sub}
            onChange={e => field('sub', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Type className="size-3.5" /> CTA Button Text
          </label>
          <input
            placeholder="e.g. Shop Flour"
            value={form.cta}
            onChange={e => field('cta', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Link2 className="size-3.5" /> CTA Link
          </label>
          <input
            placeholder="e.g. /?category=Spices"
            value={form.href}
            onChange={e => field('href', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Active toggle */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => field('enabled', !form.enabled)}
            className="relative flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            style={{ background: form.enabled ? '#F97316' : '#D1D5DB' }}
          >
            <span
              className="absolute size-5 rounded-full bg-white shadow transition-transform duration-300"
              style={{ transform: form.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {form.enabled ? 'Slide is active (shown on storefront)' : 'Slide is hidden'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-5 pb-5">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-slate-50"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <X className="size-4" /> Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.img || !form.headline}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: '#F97316' }}
        >
          {saving ? 'Saving…' : <><Save className="size-4" /> Save Slide</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const slidesRef = collection(clientDb, 'slides')

  // ── Load slides ──
  async function loadSlides() {
    setLoading(true)
    try {
      const snap = await getDocs(query(slidesRef, orderBy('order', 'asc')))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Slide))
      // If no slides in Firestore yet, seed with defaults
      setSlides(data)
    } catch {
      setSlides([])
    }
    setLoading(false)
  }

  useEffect(() => { loadSlides() }, [])

  // ── Save (create or update) ──
  async function handleSave(data: Omit<Slide, 'id'>) {
    setSaving(true)
    try {
      if (editingId === 'new') {
        const newOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) + 1 : 0
        await addDoc(slidesRef, { ...data, order: newOrder })
      } else if (editingId) {
        await updateDoc(doc(clientDb, 'slides', editingId), data as Record<string, unknown>)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setEditingId(null)
      await loadSlides()
    } catch (err) {
      console.error('Failed to save slide:', err)
    }
    setSaving(false)
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    if (!confirm('Delete this slide?')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(clientDb, 'slides', id))
      await loadSlides()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
    setDeleting(null)
  }

  // ── Move order ──
  async function moveSlide(id: string, dir: 'up' | 'down') {
    const idx = slides.findIndex(s => s.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === slides.length - 1)) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = slides[idx], b = slides[swapIdx]
    await updateDoc(doc(clientDb, 'slides', a.id!), { order: b.order } as Record<string, unknown>)
    await updateDoc(doc(clientDb, 'slides', b.id!), { order: a.order } as Record<string, unknown>)
    await loadSlides()
  }

  // ── Toggle enabled ──
  async function toggleEnabled(id: string, current: boolean) {
    await updateDoc(doc(clientDb, 'slides', id), { enabled: !current } as Record<string, unknown>)
    await loadSlides()
  }

  const editingSlide = editingId && editingId !== 'new'
    ? slides.find(s => s.id === editingId)
    : undefined

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            🎞️ Promo Slides
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Manage the banner slides shown on the storefront. Changes go live immediately.
          </p>
        </div>
        {!editingId && (
          <button
            onClick={() => setEditingId('new')}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90"
            style={{ background: '#F97316' }}
          >
            <Plus className="size-4" /> Add Slide
          </button>
        )}
      </div>

      {/* New slide form */}
      {editingId === 'new' && (
        <div className="mb-6">
          <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--foreground)' }}>New Slide</h2>
          <SlideForm
            slide={DEFAULT_SLIDE}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
            saving={saving}
          />
        </div>
      )}

      {/* Slides list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" style={{ background: 'var(--muted)' }} />
          ))}
        </div>
      ) : slides.length === 0 && editingId !== 'new' ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: 'var(--border)' }}>
          <ImageIcon className="size-10 mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>No slides yet</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted-foreground)' }}>Add a slide manually or load the 3 built-in default slides.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setEditingId('new')}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: '#F97316' }}
            >
              <Plus className="size-4" /> Add Slide
            </button>
            <button
              onClick={async () => {
                setSaving(true)
                try {
                  for (const slide of SEED_SLIDES) {
                    await addDoc(collection(clientDb, 'slides'), slide)
                  }
                  await loadSlides()
                } catch (e) { console.error(e) }
                setSaving(false)
              }}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              {saving ? 'Loading…' : '✨ Load default slides'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, i) => (
            <div key={slide.id}>
              {/* Edit form inline */}
              {editingId === slide.id ? (
                <SlideForm
                  slide={slide}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                /* Slide row */
                <div
                  className="flex items-center gap-3 rounded-2xl border p-3 transition-all"
                  style={{
                    background: slide.enabled ? 'var(--card)' : 'var(--muted)',
                    borderColor: 'var(--border)',
                    opacity: slide.enabled ? 1 : 0.6,
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0 size-16 rounded-xl overflow-hidden bg-slate-100">
                    {slide.img
                      ? <img src={slide.img} alt={slide.brand} className="w-full h-full object-cover" />
                      : <div className="flex h-full items-center justify-center"><ImageIcon className="size-6 text-slate-400" /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                        {slide.brand || 'Untitled'}
                      </span>
                      {slide.label && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase">
                          {slide.label}
                        </span>
                      )}
                      {!slide.enabled && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {slide.headline}
                    </p>
                  </div>

                  {/* Order controls */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveSlide(slide.id!, 'up')}
                      disabled={i === 0}
                      className="flex size-6 items-center justify-center rounded-md hover:bg-slate-100 transition-colors disabled:opacity-30"
                    >
                      <ArrowLeft className="size-3.5 rotate-90" style={{ color: 'var(--muted-foreground)' }} />
                    </button>
                    <button
                      onClick={() => moveSlide(slide.id!, 'down')}
                      disabled={i === slides.length - 1}
                      className="flex size-6 items-center justify-center rounded-md hover:bg-slate-100 transition-colors disabled:opacity-30"
                    >
                      <ArrowRight className="size-3.5 rotate-90" style={{ color: 'var(--muted-foreground)' }} />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleEnabled(slide.id!, slide.enabled)}
                      className="flex size-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                      title={slide.enabled ? 'Hide slide' : 'Show slide'}
                    >
                      {slide.enabled
                        ? <Eye className="size-4 text-emerald-600" />
                        : <EyeOff className="size-4 text-slate-400" />
                      }
                    </button>
                    <button
                      onClick={() => setEditingId(slide.id!)}
                      className="flex size-8 items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <Edit3 className="size-4 text-orange-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id!)}
                      disabled={deleting === slide.id}
                      className="flex size-8 items-center justify-center rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Live note */}
      <div className="mt-6 rounded-xl border p-4 flex items-start gap-3" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
        <span className="text-xl">💡</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Changes are live instantly</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            The storefront fetches slides from Firestore on each page load. Use the eye icon to temporarily hide a slide without deleting it. Drag the arrows to reorder.
          </p>
        </div>
      </div>
    </div>
  )
}
