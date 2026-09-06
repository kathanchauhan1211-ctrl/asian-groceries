'use client'

import { useState, useEffect } from 'react'
import { Check, Store, Shield, FileText, Bell, Loader2 } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { ADMIN_EMAIL } from '@/lib/admin-config'

const SETTINGS_DOC = doc(clientDb, 'settings', 'store')

const DEFAULT_FORM = {
  storeName: 'Asian Groceries',
  storeEmail: ADMIN_EMAIL,
  storePhone: '+370 600 00000',
  storeAddress: 'Šaltinių g. 22, Vilnius, Lithuania',
  storeDescription: 'Your local Asian grocery store in Vilnius — authentic products, delivered via bus courier.',
  whatsappGroup: '',
  orderNotify: true,
  stockNotify: true,
}

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(DEFAULT_FORM)

  // Load saved settings from Firestore on mount
  useEffect(() => {
    getDoc(SETTINGS_DOC)
      .then((snap) => {
        if (snap.exists()) {
          setForm((prev) => ({ ...prev, ...snap.data() }))
        }
      })
      .catch((err) => console.error('[Settings] Failed to load:', err))
      .finally(() => setLoading(false))
  }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(SETTINGS_DOC, form, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('[Settings] Failed to save:', err)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-white/5 bg-slate-900 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/5 px-6 py-4">
        <Icon className="size-4 text-orange-400" />
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )

  const Field = ({ label, id, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all" />
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-slate-400 text-sm">
        <Loader2 className="size-4 animate-spin" /> Loading settings…
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white">Store Settings</h2>
        <p className="mt-0.5 text-sm text-slate-400">Manage your store configuration and preferences</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
          <Check className="size-4" />Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Section title="Store Information" icon={Store}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Store Name" id="storeName" value={form.storeName} onChange={(v: string) => set('storeName', v)} />
            <Field label="Contact Email" id="storeEmail" value={form.storeEmail} onChange={(v: string) => set('storeEmail', v)} type="email" />
            <Field label="Phone Number" id="storePhone" value={form.storePhone} onChange={(v: string) => set('storePhone', v)} />
            <Field label="Address" id="storeAddress" value={form.storeAddress} onChange={(v: string) => set('storeAddress', v)} />
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Store Description</label>
              <textarea value={form.storeDescription} onChange={e => set('storeDescription', e.target.value)} rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 resize-none transition-all" />
            </div>
          </div>
        </Section>

        <Section title="Notifications" icon={Bell}>
          <div className="space-y-3">
            <Field label="WhatsApp Group Link" id="whatsappGroup" value={form.whatsappGroup} onChange={(v: string) => set('whatsappGroup', v)} placeholder="https://chat.whatsapp.com/..." />
            {[
              { k: 'orderNotify', label: 'Notify on new orders' },
              { k: 'stockNotify', label: 'Notify on low stock alerts' },
            ].map(({ k, label }) => (
              <label key={k} className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => set(k, !(form as any)[k])}
                  className={`relative size-5 rounded border-2 flex items-center justify-center transition-all ${(form as any)[k] ? 'bg-orange-500 border-orange-500' : 'border-white/20 bg-white/5 group-hover:border-orange-500/50'}`}>
                  {(form as any)[k] && <Check className="size-3 text-white" />}
                </div>
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Admin Access" icon={Shield}>
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credentials (read-only)</p>
            <p className="text-sm text-white">Email: <span className="text-orange-400">{ADMIN_EMAIL}</span></p>
            <p className="text-sm text-slate-400">Password: stored securely in Firebase Auth</p>
          </div>
        </Section>

        <Section title="Legal" icon={FileText}>
          <div className="space-y-3">
            {['Terms & Conditions', 'Privacy Policy', 'Refund Policy'].map(docName => (
              <button key={docName} type="button"
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                <span>{docName}</span>
                <span className="text-xs text-slate-500">Edit →</span>
              </button>
            ))}
          </div>
        </Section>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </form>
    </div>
  )
}
