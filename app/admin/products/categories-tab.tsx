'use client'

/**
 * app/admin/products/categories-tab.tsx
 *
 * Pipeline: category-filter-pipeline
 *
 * Admin UI for managing dynamic product filter categories.
 * Writes to `settings/categoryFilters` in Firestore via adminPortalDb.
 * Storefront reads this in real-time via useCategoryFilters() hook.
 *
 * Rules (ADMIN_FINAL_BLOCK.md):
 * - No dumb data: validate before every Firestore write
 * - No mock data: all reads/writes are real Firestore operations
 * - Category IDs are derived from the label (slug), never random
 */

import { useState, useEffect, useRef } from 'react'
import {
  collection, doc, onSnapshot, setDoc, getDoc,
} from 'firebase/firestore'
import { adminPortalDb } from '@/lib/firebase-admin-client'
import { CATEGORY_GROUPS } from '@/lib/products'
import {
  Plus, Trash2, Check, X, Loader2, ChevronUp, ChevronDown,
  AlertCircle, Pencil, Save, GripVertical,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = {
  id: string
  label: string
  icon: string
  match: string[]   // raw Firestore product.category values
  active: boolean
  order: number
  createdAt?: number
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:      '#080C14',
  surface: '#0D1117',
  card:    '#111827',
  border:  'rgba(255,255,255,0.07)',
  muted:   '#4B5563',
  subtle:  '#1F2937',
  orange:  '#F97316',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function validateCategory(label: string, icon: string, matchRaw: string): string | null {
  const trimLabel = label.trim()
  const trimIcon  = icon.trim()
  const matches   = matchRaw.split(',').map(s => s.trim()).filter(Boolean)

  if (trimLabel.length < 2)  return 'Label must be at least 2 characters.'
  if (trimLabel.length > 60) return 'Label must be under 60 characters.'
  if (trimIcon.length === 0) return 'Please enter an icon (emoji or letter).'
  if (matches.length === 0)  return 'At least one match value is required.'
  if (matches.some(m => m.length < 2)) return 'Each match value must be at least 2 characters.'
  return null
}

const SETTINGS_DOC = doc(adminPortalDb, 'settings', 'categoryFilters')

// ── Inline edit form ───────────────────────────────────────────────────────────
function CategoryForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Category>
  onSave: (label: string, icon: string, match: string[]) => void
  onCancel: () => void
  saving: boolean
}) {
  const [label,    setLabel]    = useState(initial?.label ?? '')
  const [icon,     setIcon]     = useState(initial?.icon  ?? '📦')
  const [matchRaw, setMatchRaw] = useState(initial?.match?.join(', ') ?? '')
  const [err,      setErr]      = useState<string | null>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => { labelRef.current?.focus() }, [])

  function handleSave() {
    const validErr = validateCategory(label, icon, matchRaw)
    if (validErr) { setErr(validErr); return }
    const matches = matchRaw.split(',').map(s => s.trim()).filter(Boolean)
    onSave(label.trim(), icon.trim(), matches)
  }

  const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm text-white bg-transparent outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all'
  const inputStyle = { borderColor: C.border, background: C.subtle }

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: C.surface, borderColor: C.orange + '40' }}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="shrink-0">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Icon</label>
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            maxLength={4}
            className="w-14 rounded-lg border px-2 py-2 text-xl text-center bg-transparent outline-none focus:border-orange-500/60 transition-all"
            style={{ borderColor: C.border, background: C.subtle }}
            placeholder="📦"
          />
        </div>
        {/* Label */}
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category Label *</label>
          <input
            ref={labelRef}
            value={label}
            onChange={e => setLabel(e.target.value)}
            className={inputCls}
            style={inputStyle}
            placeholder="e.g. Spices & Masala"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
      </div>

      {/* Match values */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Match Values * <span className="normal-case font-normal text-slate-600">(comma-separated product category names from Firestore)</span>
        </label>
        <input
          value={matchRaw}
          onChange={e => setMatchRaw(e.target.value)}
          className={inputCls}
          style={inputStyle}
          placeholder="e.g. Spices, Masala, Condiments"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
          These must exactly match the <code className="text-orange-400">category</code> field values on your products in Firestore.
        </p>
      </div>

      {/* Error */}
      {err && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="size-4 shrink-0" />
          {err}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all disabled:opacity-60"
          style={{ background: C.orange }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? 'Saving…' : 'Save Category'}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:bg-white/5"
          style={{ borderColor: C.border, color: C.muted }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [showForm,   setShowForm]   = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)

  // ── Real-time Firestore subscription ──────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        if (snap.exists()) {
          const raw: Category[] = snap.data().categories ?? []
          setCategories(raw.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)))
        } else {
          // First run: seed from static CATEGORY_GROUPS
          setCategories([])
        }
        setLoading(false)
      },
      (err) => {
        console.error('[CategoriesTab] Firestore error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Write helper (all writes go through here) ─────────────────────────────
  async function writeCategories(next: Category[]) {
    setSaving(true)
    try {
      await setDoc(SETTINGS_DOC, { categories: next }, { merge: true })
    } catch (e: any) {
      console.error('[CategoriesTab] Write error:', e)
      showToast('Failed to save. Check console.', false)
    } finally {
      setSaving(false)
    }
  }

  // ── Add / Edit save handler ───────────────────────────────────────────────
  async function handleSave(label: string, icon: string, match: string[]) {
    const id = editId ?? slugify(label)

    // Check duplicate ID (only for new categories)
    if (!editId && categories.some(c => c.id === id)) {
      showToast(`A category with the ID "${id}" already exists.`, false)
      return
    }

    const existing = editId ? categories.find(c => c.id === editId) : null

    const entry: Category = {
      id,
      label,
      icon,
      match,
      active:    existing?.active ?? true,
      order:     existing?.order  ?? categories.length,
      createdAt: existing?.createdAt ?? Date.now(),
    }

    const next = editId
      ? categories.map(c => c.id === editId ? entry : c)
      : [...categories, entry]

    await writeCategories(next)
    setShowForm(false)
    setEditId(null)
    showToast(editId ? 'Category updated.' : 'Category created.')
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const next = categories.filter(c => c.id !== id).map((c, i) => ({ ...c, order: i }))
    await writeCategories(next)
    setDeleteId(null)
    showToast('Category deleted.')
  }

  // ── Toggle active ──────────────────────────────────────────────────────────
  async function toggleActive(id: string) {
    const next = categories.map(c => c.id === id ? { ...c, active: !c.active } : c)
    await writeCategories(next)
  }

  // ── Reorder ────────────────────────────────────────────────────────────────
  async function move(id: string, dir: -1 | 1) {
    const idx = categories.findIndex(c => c.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= categories.length) return
    const next = [...categories]
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    const reordered = next.map((c, i) => ({ ...c, order: i }))
    await writeCategories(reordered)
  }

  // ── Seed from static defaults ──────────────────────────────────────────────
  async function seedDefaults() {
    const defaults: Category[] = CATEGORY_GROUPS.map((g, i) => ({
      id:        slugify(g.label),
      label:     g.label,
      icon:      g.icon,
      match:     [...g.match],
      active:    true,
      order:     i,
      createdAt: Date.now(),
    }))
    await writeCategories(defaults)
    showToast('Loaded default categories from code.')
  }

  const editingCat = editId ? categories.find(c => c.id === editId) : undefined

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Filter Categories</h2>
          <p className="mt-0.5 text-sm" style={{ color: C.muted }}>
            Create and manage the category filters shown on the storefront. Changes go live instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {categories.length === 0 && !loading && (
            <button
              onClick={seedDefaults}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-50"
              style={{ borderColor: C.border, color: C.muted }}
            >
              Load Defaults
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditId(null) }}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: C.orange }}
          >
            <Plus className="size-4" />
            New Category
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{
            background:   toast.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            borderColor:  toast.ok ? 'rgba(16,185,129,0.2)'  : 'rgba(239,68,68,0.2)',
            color:        toast.ok ? '#10B981'                : '#EF4444',
          }}
        >
          {toast.ok ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {/* New category form */}
      {showForm && !editId && (
        <CategoryForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm" style={{ color: C.muted }}>
          <Loader2 className="size-4 animate-spin" /> Loading categories…
        </div>
      )}

      {/* Empty state */}
      {!loading && categories.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border py-16 text-center" style={{ borderColor: C.border, background: C.surface }}>
          <div className="text-4xl mb-3">🗂️</div>
          <p className="font-semibold text-white mb-1">No filter categories yet</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>Create your first one, or load the defaults from code.</p>
          <button
            onClick={seedDefaults}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: C.orange }}
          >
            Load Defaults
          </button>
        </div>
      )}

      {/* Category list */}
      {!loading && categories.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: C.subtle, borderBottom: `1px solid ${C.border}` }}>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Order</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Icon</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Label</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: C.muted }}>Matches</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Active</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <>
                  <tr
                    key={cat.id}
                    style={{
                      background: idx % 2 === 0 ? C.surface : C.bg,
                      borderBottom: `1px solid ${C.border}`,
                      opacity: cat.active ? 1 : 0.5,
                    }}
                  >
                    {/* Order controls */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => move(cat.id, -1)}
                          disabled={idx === 0 || saving}
                          className="flex size-5 items-center justify-center rounded transition-colors hover:bg-white/10 disabled:opacity-20"
                        >
                          <ChevronUp className="size-3" style={{ color: C.muted }} />
                        </button>
                        <button
                          onClick={() => move(cat.id, 1)}
                          disabled={idx === categories.length - 1 || saving}
                          className="flex size-5 items-center justify-center rounded transition-colors hover:bg-white/10 disabled:opacity-20"
                        >
                          <ChevronDown className="size-3" style={{ color: C.muted }} />
                        </button>
                      </div>
                    </td>

                    {/* Icon */}
                    <td className="px-4 py-3">
                      <span className="text-xl">{cat.icon}</span>
                    </td>

                    {/* Label */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white">{cat.label}</span>
                      <span className="ml-2 text-[10px] font-mono" style={{ color: C.muted }}>#{cat.id}</span>
                    </td>

                    {/* Match values */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {cat.match.map(m => (
                          <span
                            key={m}
                            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                            style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(cat.id)}
                        disabled={saving}
                        className="relative flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                        style={{ background: cat.active ? C.orange : C.subtle }}
                        title={cat.active ? 'Shown on storefront' : 'Hidden from storefront'}
                      >
                        <span
                          className="absolute size-4 rounded-full bg-white shadow-sm transition-transform"
                          style={{ transform: cat.active ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditId(cat.id); setShowForm(true) }}
                          className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" style={{ color: C.muted }} />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline edit row */}
                  {editId === cat.id && showForm && (
                    <tr key={`${cat.id}-edit`} style={{ background: C.surface }}>
                      <td colSpan={6} className="px-4 py-4">
                        <CategoryForm
                          initial={cat}
                          onSave={handleSave}
                          onCancel={() => { setEditId(null); setShowForm(false) }}
                          saving={saving}
                        />
                      </td>
                    </tr>
                  )}

                  {/* Delete confirm row */}
                  {deleteId === cat.id && (
                    <tr key={`${cat.id}-delete`} style={{ background: 'rgba(239,68,68,0.05)' }}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center gap-3 text-sm">
                          <AlertCircle className="size-4 text-red-400 shrink-0" />
                          <span style={{ color: C.muted }}>
                            Delete <span className="font-bold text-white">"{cat.label}"</span>? Products in this category will still exist but won't appear under this filter.
                          </span>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            disabled={saving}
                            className="ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-60"
                            style={{ background: '#EF4444' }}
                          >
                            {saving ? 'Deleting…' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/5"
                            style={{ borderColor: C.border, color: C.muted }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: C.border, background: C.surface }}>
        <p className="font-semibold text-white mb-1">💡 How it works</p>
        <ul className="space-y-1 list-disc pl-4" style={{ color: C.muted }}>
          <li>Every category you create or edit is saved to <code className="text-orange-400">settings/categoryFilters</code> in Firestore.</li>
          <li>The storefront subscribes to this in real-time — changes appear instantly, no redeploy needed.</li>
          <li><strong className="text-white">Match values</strong> must exactly match the <code className="text-orange-400">category</code> field on your products (e.g. <code>"Spices"</code>).</li>
          <li>Inactive categories are hidden from the storefront but kept in Firestore.</li>
        </ul>
      </div>
    </div>
  )
}
