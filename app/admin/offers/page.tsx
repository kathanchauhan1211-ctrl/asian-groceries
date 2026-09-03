'use client'

import { useState, useEffect } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query,
} from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import {
  Plus, Trash2, Edit3, Save, X, GripVertical, Eye, EyeOff,
  Tag, Link2, Type, AlignLeft, ArrowUp, ArrowDown, Check,
  Flame, Layers, Leaf, Coffee, Candy, Milk,
  type LucideIcon,
} from 'lucide-react'
import { OFFER_ICON_MAP, type Offer } from '@/components/offers-strip'

// ─── Icon picker options ───────────────────────────────────────────────────────
const ICON_OPTIONS: { key: string; Icon: LucideIcon; label: string }[] = [
  { key: 'Flame',  Icon: Flame,  label: 'Spices / Hot' },
  { key: 'Layers', Icon: Layers, label: 'Grains / Rice' },
  { key: 'Leaf',   Icon: Leaf,   label: 'Lentils / Fresh' },
  { key: 'Coffee', Icon: Coffee, label: 'Beverages / Tea' },
  { key: 'Candy',  Icon: Candy,  label: 'Sweets' },
  { key: 'Milk',   Icon: Milk,   label: 'Dairy' },
  { key: 'Tag',    Icon: Tag,    label: 'General offer' },
]

// ─── Default form state ────────────────────────────────────────────────────────
const DEFAULT_OFFER: Omit<Offer, 'id'> = {
  icon: 'Tag',
  title: '',
  subtitle: '',
  badgeColor: '#F97316',
  href: '/',
  order: 0,
  enabled: true,
}

// ─── Color presets ─────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  '#F97316', '#EF4444', '#FBBF24', '#10B981',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
]

// ─── OfferPreviewCard ──────────────────────────────────────────────────────────
function OfferPreviewCard({ icon, title, subtitle, badgeColor }: Pick<Offer, 'icon' | 'title' | 'subtitle' | 'badgeColor'>) {
  const hex = badgeColor || '#F97316'
  const Icon = OFFER_ICON_MAP[icon] ?? Tag
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl overflow-hidden"
      style={{
        width: 120,
        minHeight: 108,
        background: `linear-gradient(145deg, ${hex}1A 0%, ${hex}0D 100%)`,
        border: `1.5px solid ${hex}33`,
        padding: '12px 8px',
      }}
    >
      <span
        className="absolute top-1 left-1/2 -translate-x-1/2 rounded-full blur-xl opacity-40"
        style={{ width: 44, height: 44, background: hex }}
      />
      <span
        className="relative z-10 flex items-center justify-center rounded-xl p-2"
        style={{ background: `${hex}22` }}
      >
        <Icon className="size-5 shrink-0" style={{ color: hex }} strokeWidth={2} />
      </span>
      <span className="relative z-10 text-center font-bold text-[11px] leading-tight" style={{ color: 'var(--foreground)' }}>
        {title || 'Offer title'}
      </span>
      <span
        className="relative z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
        style={{ background: hex }}
      >
        {subtitle || 'Discount'}
      </span>
    </div>
  )
}

// ─── OfferForm ─────────────────────────────────────────────────────────────────
function OfferForm({
  offer,
  onSave,
  onCancel,
  saving,
}: {
  offer: Partial<Offer>
  onSave: (data: Omit<Offer, 'id'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<Omit<Offer, 'id'>>({ ...DEFAULT_OFFER, ...offer })

  function field(key: keyof typeof form, value: string | boolean | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-lg"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      {/* Live Preview */}
      <div
        className="flex items-center justify-center gap-6 px-6 py-5"
        style={{ background: '#0D1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#4B5563' }}>
            Live Preview
          </p>
          <OfferPreviewCard
            icon={form.icon}
            title={form.title}
            subtitle={form.subtitle}
            badgeColor={form.badgeColor}
          />
        </div>
      </div>

      {/* Form fields */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Icon picker */}
        <div className="sm:col-span-2">
          <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Icon
          </label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(({ key, Icon, label }) => {
              const selected = form.icon === key
              return (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => field('icon', key)}
                  className="flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-[10px] font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: selected ? `${form.badgeColor}18` : 'var(--secondary)',
                    borderColor: selected ? form.badgeColor : 'var(--border)',
                    color: selected ? form.badgeColor : 'var(--muted-foreground)',
                    boxShadow: selected ? `0 0 0 2px ${form.badgeColor}33` : 'none',
                  }}
                >
                  <Icon className="size-5" strokeWidth={2} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Badge Color */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Tag className="size-3.5" /> Badge Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => field('badgeColor', c)}
                className="size-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
                style={{
                  background: c,
                  borderColor: form.badgeColor === c ? '#fff' : 'transparent',
                  boxShadow: form.badgeColor === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
            <input
              type="color"
              value={form.badgeColor}
              onChange={e => field('badgeColor', e.target.value)}
              className="size-7 rounded-full cursor-pointer border-0 outline-none"
              title="Custom color"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Type className="size-3.5" /> Title
          </label>
          <input
            placeholder="e.g. Spice Bundles"
            value={form.title}
            onChange={e => field('title', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <AlignLeft className="size-3.5" /> Discount Text
          </label>
          <input
            placeholder="e.g. Up to 30% off"
            value={form.subtitle}
            onChange={e => field('subtitle', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Link */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            <Link2 className="size-3.5" /> Link (href)
          </label>
          <input
            placeholder="e.g. /?category=Spices"
            value={form.href}
            onChange={e => field('href', e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Order */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
            Sort Order
          </label>
          <input
            type="number"
            min={0}
            value={form.order}
            onChange={e => field('order', Number(e.target.value))}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-400"
            style={{ background: 'var(--secondary)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Enabled toggle */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => field('enabled', !form.enabled)}
            className="relative flex h-6 w-11 items-center rounded-full transition-colors duration-300"
            style={{ background: form.enabled ? '#F97316' : '#374151' }}
            aria-checked={form.enabled}
            role="switch"
            aria-label="Enable this offer"
          >
            <span
              className="absolute size-5 rounded-full bg-white shadow transition-transform duration-300"
              style={{ transform: form.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {form.enabled ? 'Visible on storefront' : 'Hidden from storefront'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}
        >
          <X className="size-4" /> Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.title.trim()}
          className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
        >
          {saving
            ? <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <Save className="size-4" />}
          {saving ? 'Saving…' : 'Save Offer'}
        </button>
      </div>
    </div>
  )
}

// ─── OfferRow ──────────────────────────────────────────────────────────────────
function OfferRow({
  offer, onEdit, onDelete, onToggle, onMove, isFirst, isLast, deleting,
}: {
  offer: Offer
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onMove: (dir: 'up' | 'down') => void
  isFirst: boolean
  isLast: boolean
  deleting: boolean
}) {
  const hex = offer.badgeColor || '#F97316'
  const Icon = OFFER_ICON_MAP[offer.icon] ?? Tag
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <GripVertical className="size-4 shrink-0 cursor-grab" style={{ color: 'var(--muted-foreground)' }} />

      {/* Icon swatch */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${hex}1A`, border: `1px solid ${hex}2E` }}
      >
        <Icon className="size-5" style={{ color: hex }} strokeWidth={2} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--foreground)' }}>
          {offer.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide"
            style={{ background: hex }}
          >
            {offer.subtitle}
          </span>
          <span className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>
            → {offer.href}
          </span>
        </div>
      </div>

      {/* Order arrows */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMove('up')} disabled={isFirst}
          className="flex size-5 items-center justify-center rounded transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/20 disabled:opacity-20"
          aria-label="Move up"
        >
          <ArrowUp className="size-3" style={{ color: 'var(--muted-foreground)' }} />
        </button>
        <button
          onClick={() => onMove('down')} disabled={isLast}
          className="flex size-5 items-center justify-center rounded transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/20 disabled:opacity-20"
          aria-label="Move down"
        >
          <ArrowDown className="size-3" style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex size-8 items-center justify-center rounded-lg transition-colors"
        style={{
          background: offer.enabled ? 'rgba(249,115,22,0.1)' : 'var(--secondary)',
          color: offer.enabled ? '#F97316' : 'var(--muted-foreground)',
        }}
        aria-label={offer.enabled ? 'Hide offer' : 'Show offer'}
      >
        {offer.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>

      {/* Edit */}
      <button
        onClick={onEdit}
        className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-blue-500/10"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label="Edit offer"
      >
        <Edit3 className="size-4" />
      </button>

      {/* Delete */}
      <button
        onClick={onDelete} disabled={deleting}
        className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
        style={{ color: '#EF4444' }}
        aria-label="Delete offer"
      >
        {deleting
          ? <div className="size-3.5 rounded-full border-2 border-red-400/30 border-t-red-400 animate-spin" />
          : <Trash2 className="size-4" />}
      </button>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadOffers() {
    try {
      const q = query(collection(clientDb, 'offers'), orderBy('order', 'asc'))
      const snap = await getDocs(q)
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer)))
    } catch {
      showToast('Failed to load offers', 'err')
    }
    setLoading(false)
  }

  useEffect(() => { loadOffers() }, [])

  async function handleSave(data: Omit<Offer, 'id'>, id?: string) {
    setSaving(true)
    try {
      if (id) {
        await updateDoc(doc(clientDb, 'offers', id), data as Record<string, unknown>)
        showToast('Offer updated ✓')
      } else {
        await addDoc(collection(clientDb, 'offers'), { ...data, order: offers.length })
        showToast('Offer created ✓')
      }
      setAdding(false)
      setEditingId(null)
      await loadOffers()
    } catch {
      showToast('Save failed — check console', 'err')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteDoc(doc(clientDb, 'offers', id))
      showToast('Offer deleted')
      await loadOffers()
    } catch {
      showToast('Delete failed', 'err')
    }
    setDeletingId(null)
  }

  async function handleToggle(offer: Offer) {
    if (!offer.id) return
    try {
      await updateDoc(doc(clientDb, 'offers', offer.id), { enabled: !offer.enabled })
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, enabled: !o.enabled } : o))
    } catch {
      showToast('Update failed', 'err')
    }
  }

  async function handleMove(offer: Offer, dir: 'up' | 'down') {
    const idx = offers.findIndex(o => o.id === offer.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= offers.length) return
    const a = offers[idx], b = offers[swapIdx]
    if (!a.id || !b.id) return
    try {
      await updateDoc(doc(clientDb, 'offers', a.id), { order: b.order })
      await updateDoc(doc(clientDb, 'offers', b.id), { order: a.order })
      await loadOffers()
    } catch {
      showToast('Reorder failed', 'err')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl"
          style={{ background: toast.type === 'ok' ? '#10B981' : '#EF4444' }}
        >
          {toast.type === 'ok' ? <Check className="size-4" /> : <X className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            <Tag className="size-5" style={{ color: 'var(--primary)' }} />
            Offers &amp; Discounts
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Manage the offer cards shown on the storefront homepage.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)' }}
          >
            <Plus className="size-4" /> Add Offer
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <OfferForm
          offer={DEFAULT_OFFER}
          onSave={(data) => handleSave(data)}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      )}

      {/* Offer list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--muted)' }} />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <Tag className="mb-3 size-10" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>No offers yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Click "Add Offer" to create your first discount card.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {offers.map((offer, idx) =>
            editingId === offer.id ? (
              <OfferForm
                key={offer.id}
                offer={offer}
                onSave={(data) => handleSave(data, offer.id)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <OfferRow
                key={offer.id}
                offer={offer}
                onEdit={() => setEditingId(offer.id ?? null)}
                onDelete={() => handleDelete(offer.id!)}
                onToggle={() => handleToggle(offer)}
                onMove={(dir) => handleMove(offer, dir)}
                isFirst={idx === 0}
                isLast={idx === offers.length - 1}
                deleting={deletingId === offer.id}
              />
            )
          )}
        </div>
      )}

      {!loading && offers.length > 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {offers.filter(o => o.enabled).length} visible · {offers.filter(o => !o.enabled).length} hidden · {offers.length} total
        </p>
      )}
    </div>
  )
}
