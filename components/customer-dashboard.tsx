'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import {
  User,
  MapPin,
  Clock,
  TrendingUp,
  Truck,
  Download,
  LayoutDashboard,
  ShoppingCart,
  Activity,
  Settings,
  Camera,
  Phone,
  Mail,
  LogOut,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Save,
  X,
  ShoppingBag,
  Zap,
  ChevronRight,
  Menu,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type LiveOrder = {
  id: string
  ticketNumber: string
  createdAt: string
  grandTotal: number
  subtotal: number
  deliveryFee: number
  items: Array<{ productName: string; quantity: number; price: number; variantLabel: string }>
  status: string
  transitHub: string
  paymentMethod: string
  customerPhone: string
}

type DashboardSection = 'overview' | 'profile' | 'address' | 'orders' | 'basket' | 'activity'

const TERMINAL_OPTIONS = [
  { id: 'kaunas',    label: 'Kaunas Bus Station',    price: 4.5 },
  { id: 'klaipeda', label: 'Klaipėda Bus Station',  price: 6.0 },
  { id: 'siauliai', label: 'Šiauliai Bus Station',   price: 5.0 },
  { id: 'panevezys',label: 'Panevėžys Bus Station',  price: 4.5 },
  { id: 'alytus',   label: 'Alytus Bus Station',     price: 4.0 },
]

// ─── Shared style helpers (use CSS vars so dark mode works automatically) ────

// Card: uses var(--card) / var(--card-foreground) which flip in dark mode
const card  = 'bg-card text-card-foreground border border-border rounded-2xl shadow-sm'
// Muted surface
const muted = 'bg-muted text-muted-foreground'
// Input field
const inputCls = 'w-full rounded-xl border border-border bg-background text-foreground text-sm pl-9 pr-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-all'
// Read-only display row
const displayRow = 'flex items-center gap-2 rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground'

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s.includes('delivered'))
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3" />{status}</span>
  if (s.includes('pending'))
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"><Clock className="size-3" />{status}</span>
  if (s.includes('dispatch') || s.includes('transit'))
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/25 px-2.5 py-0.5 text-[10px] font-bold" style={{ color: 'var(--im-navy-light)' }}><Truck className="size-3" />{status}</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground"><AlertCircle className="size-3" />{status}</span>
}

// ─── Navy section icon (matches header/footer brand blue) ────────────────────
function SectionIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: 'var(--im-navy-mid)' }}>
      {icon}
    </span>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
  section, onSection, user, photoURL, orders, cartCount, onSignOut, isOpen, onClose,
}: {
  section: DashboardSection
  onSection: (s: DashboardSection) => void
  user: { displayName: string | null; email: string | null }
  photoURL: string | null
  orders: LiveOrder[]
  cartCount: number
  onSignOut: () => void
  isOpen: boolean
  onClose: () => void
}) {
  const nav: Array<{ id: DashboardSection; icon: React.ReactNode; label: string; count?: number }> = [
    { id: 'overview',  icon: <LayoutDashboard className="size-4" />, label: 'Overview' },
    { id: 'profile',   icon: <User className="size-4" />,            label: 'Profile' },
    { id: 'address',   icon: <MapPin className="size-4" />,          label: 'Address' },
    { id: 'orders',    icon: <Package className="size-4" />,         label: 'Orders',  count: orders.length },
    { id: 'basket',    icon: <ShoppingCart className="size-4" />,    label: 'Basket',  count: cartCount || undefined },
    { id: 'activity',  icon: <Activity className="size-4" />,        label: 'Activity' },
  ]

  const totalSpent = orders.reduce((s, o) => s + (o.grandTotal || 0), 0)

  const content = (
    <aside className="flex h-full flex-col bg-card border-r border-border overflow-hidden">
      {/* Header — navy gradient matching site header/footer */}
      <div className="relative shrink-0 p-5 pb-14" style={{ background: 'linear-gradient(135deg, var(--im-navy) 0%, var(--im-navy-mid) 100%)' }}>
        {/* Orange accent stripe top */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--im-orange), var(--im-gold), var(--im-orange))' }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-center gap-3">
          <div className="relative size-14 shrink-0">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="size-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
            ) : (
              <div className="size-14 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center shadow-lg">
                <User className="size-7 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-snug truncate">{user.displayName || 'Customer'}</p>
            <p className="text-white/60 text-[11px] truncate mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats strip — sits on top of gradient bottom */}
      <div className="grid grid-cols-2 -mt-8 mx-4 rounded-xl border border-border bg-card shadow-md overflow-hidden z-10 relative">
        <div className="p-3 text-center border-r border-border">
          <p className="text-xl font-bold text-foreground">{orders.length}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Orders</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xl font-bold text-foreground">€{totalSpent.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Spent</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 mt-4">
        {nav.map((item) => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => { onSection(item.id); onClose() }}
              className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                active
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              style={active ? { background: 'var(--im-orange)' } : {}}
            >
              <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5 ${active ? 'bg-white/20 text-white' : 'bg-border text-muted-foreground'}`}>
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="shrink-0 p-3 border-t border-border">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="size-4" /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72 z-50" onClick={e => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <div className="hidden md:block w-72 shrink-0 self-stretch">
        {content}
      </div>
    </>
  )
}

// ─── Overview Section ────────────────────────────────────────────────────────
function OverviewSection({ orders, user, onSection }: {
  orders: LiveOrder[]
  user: { displayName: string | null }
  onSection: (s: DashboardSection) => void
}) {
  const totalSpent = orders.reduce((s, o) => s + (o.grandTotal || 0), 0)
  const pending = orders.filter(o => o.status.toLowerCase().includes('pending')).length
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, var(--im-navy) 0%, var(--im-navy-mid) 65%, #2563EB 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--im-orange), var(--im-gold), var(--im-orange))' }} />
        <div className="absolute right-6 bottom-4 text-7xl opacity-[0.08] select-none">🛒</div>
        <div className="relative">
          <p className="text-blue-200 text-sm font-medium mb-1">Welcome back 👋</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{user.displayName || 'Customer'}</h2>
          <p className="text-blue-200 text-sm mt-2">
            <span className="text-white font-bold">{orders.length}</span> order{orders.length !== 1 ? 's' : ''} placed &nbsp;·&nbsp; <span className="text-white font-bold">€{totalSpent.toFixed(2)}</span> total spent
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Orders',  value: String(orders.length), icon: <Package className="size-4" />, accentColor: 'var(--im-navy-mid)', accentBg: 'rgba(30,58,138,0.1)' },
          { label: 'Total Spent',   value: `€${totalSpent.toFixed(2)}`, icon: <TrendingUp className="size-4" />, accentColor: '#059669', accentBg: 'rgba(5,150,105,0.1)' },
          { label: 'Awaiting',      value: String(pending),  icon: <Clock className="size-4" />, accentColor: 'var(--im-orange)', accentBg: 'rgba(249,115,22,0.1)' },
        ].map(stat => (
          <div key={stat.label} className={`${card} p-5`}>
            <div className="flex size-9 items-center justify-center rounded-xl mb-3" style={{ background: stat.accentBg }}>
              <span style={{ color: stat.accentColor }}>{stat.icon}</span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1" style={{ color: stat.accentColor }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'View Orders',  icon: <Package className="size-4" />,      section: 'orders'  as DashboardSection },
          { label: 'Edit Profile', icon: <Settings className="size-4" />,     section: 'profile' as DashboardSection },
          { label: 'View Basket',  icon: <ShoppingCart className="size-4" />, section: 'basket'  as DashboardSection },
        ].map(link => (
          <button
            key={link.label}
            onClick={() => onSection(link.section)}
            className={`${card} flex items-center gap-3 p-4 text-sm font-semibold text-foreground hover:border-primary/40 hover:shadow-md transition-all duration-200 group`}
          >
            <span className="flex size-8 items-center justify-center rounded-lg transition-colors" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--im-orange)' }}>
              {link.icon}
            </span>
            {link.label}
            <ChevronRight className="size-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className={card}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <SectionIcon icon={<Clock className="size-3.5" />} /> Recent Orders
          </h3>
          <button onClick={() => onSection('orders')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--im-orange)' }}>View all →</button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No orders yet</div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-foreground font-mono">{order.ticketNumber}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{order.createdAt}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <p className="text-sm font-bold text-foreground">€{(order.grandTotal || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profile Section ─────────────────────────────────────────────────────────
function ProfileSection({ user, photoURL, onPhotoUpdate }: {
  user: { uid: string; displayName: string | null; email: string | null }
  photoURL: string | null
  onPhotoUpdate: (url: string) => void
}) {
  const [firstName, setFirstName] = useState(() => (user.displayName || '').split(' ')[0] || '')
  const [surname,   setSurname]   = useState(() => (user.displayName || '').split(' ').slice(1).join(' ') || '')
  const [phone,     setPhone]     = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getDoc(doc(clientDb, 'users', user.uid)).then(d => {
      if (d.exists()) {
        const data = d.data()
        if (data.phone)     setPhone(data.phone)
        if (data.firstName) setFirstName(data.firstName)
        if (data.surname)   setSurname(data.surname)
      }
    }).catch(console.error)
  }, [user.uid])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(clientDb, 'users', user.uid), {
        firstName: firstName.trim(),
        surname: surname.trim(),
        phone: phone.trim(),
        displayName: `${firstName.trim()} ${surname.trim()}`.trim(),
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      setSaved(true); setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      await setDoc(doc(clientDb, 'users', user.uid), { photoURL: base64 }, { merge: true })
      onPhotoUpdate(base64)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <SectionIcon icon={<User className="size-4" />} /> Profile Settings
        </h2>
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5">
            <Edit3 className="size-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="gap-1.5">
              <X className="size-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
            </Button>
          </div>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" /> Profile saved successfully!
        </div>
      )}

      {/* Photo */}
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-bold text-foreground mb-5">Profile Picture</h3>
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="size-24 rounded-2xl object-cover border border-border shadow-sm" />
            ) : (
              <div className="size-24 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, var(--im-navy), var(--im-navy-mid))' }}>
                <User className="size-11 text-white" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? <Loader2 className="size-5 text-white animate-spin" /> : <Camera className="size-5 text-white" />}
            </button>
          </div>
          <div>
            <p className="font-semibold text-foreground">Upload a profile photo</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF · Max 2MB</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
              {uploading ? 'Uploading…' : 'Change Photo'}
            </Button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      {/* Fields */}
      <div className={`${card} p-6 space-y-5`}>
        <h3 className="text-sm font-bold text-foreground">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">First Name</label>
            {isEditing ? (
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} placeholder="First name" />
              </div>
            ) : (
              <div className={displayRow}><User className="size-4 text-muted-foreground shrink-0" /><span className="font-medium">{firstName || '—'}</span></div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Surname</label>
            {isEditing ? (
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="text" value={surname} onChange={e => setSurname(e.target.value)} className={inputCls} placeholder="Surname" />
              </div>
            ) : (
              <div className={displayRow}><User className="size-4 text-muted-foreground shrink-0" /><span className="font-medium">{surname || '—'}</span></div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className={`${displayRow} opacity-70`}><Mail className="size-4 text-muted-foreground shrink-0" /><span>{user.email || '—'}</span><span className="ml-auto text-[10px] font-bold text-muted-foreground">FIXED</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Phone Number</label>
            {isEditing ? (
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+370 XXXXXXXX" />
              </div>
            ) : (
              <div className={displayRow}><Phone className="size-4 text-muted-foreground shrink-0" /><span className="font-mono font-medium">{phone || '—'}</span></div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Address Section ─────────────────────────────────────────────────────────
function AddressSection({ user }: { user: { uid: string } }) {
  const [preferredTerminal, setPreferredTerminal] = useState(TERMINAL_OPTIONS[0].id)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  useEffect(() => {
    getDoc(doc(clientDb, 'users', user.uid)).then(d => {
      if (d.exists() && d.data().preferredTerminal) setPreferredTerminal(d.data().preferredTerminal)
    }).catch(console.error)
  }, [user.uid])

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(clientDb, 'users', user.uid), { preferredTerminal }, { merge: true })
      setSaved(true); setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const terminal = TERMINAL_OPTIONS.find(t => t.id === preferredTerminal) || TERMINAL_OPTIONS[0]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <SectionIcon icon={<MapPin className="size-4" />} /> Delivery Address
      </h2>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" /> Preferred station saved!
        </div>
      )}

      <div className={`${card} p-6`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'rgba(249,115,22,0.12)' }}>
              <MapPin className="size-5" style={{ color: 'var(--im-orange)' }} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Preferred Bus Station</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Used for courier dispatch</p>
            </div>
          </div>
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5"><Edit3 className="size-3.5" /> Change</Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}><X className="size-3.5" /></Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2.5">
            {TERMINAL_OPTIONS.map(t => (
              <label key={t.id} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${preferredTerminal === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80 hover:bg-muted/50'}`}>
                <div className={`size-4 rounded-full border-2 flex items-center justify-center transition-colors ${preferredTerminal === t.id ? 'border-primary' : 'border-muted-foreground/40'}`}>
                  {preferredTerminal === t.id && <div className="size-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">€{t.price.toFixed(2)} dispatch fee (excl.)</p>
                </div>
                <input type="radio" name="terminal" value={t.id} checked={preferredTerminal === t.id} onChange={() => setPreferredTerminal(t.id)} className="hidden" />
              </label>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-muted border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">{terminal.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Via Autobusų Stotis Courier</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-semibold">Dispatch fee</p>
                <p className="text-base font-bold" style={{ color: 'var(--im-orange)' }}>€{terminal.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="size-3.5" /> Active preferred station
            </div>
          </div>
        )}
      </div>

      <div className={`${card} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'rgba(30,58,138,0.1)' }}>
            <ShoppingBag className="size-5" style={{ color: 'var(--im-navy-mid)' }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Store Location</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Where your order ships from</p>
          </div>
        </div>
        <p className="font-semibold text-foreground">Šaltinių g. 22, Vilnius</p>
        <p className="text-sm text-muted-foreground mt-0.5">Lithuania · IndianMarket</p>
      </div>
    </div>
  )
}

// ─── Orders Section ──────────────────────────────────────────────────────────
function OrdersSection({ orders, loading }: { orders: LiveOrder[]; loading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <SectionIcon icon={<Package className="size-4" />} /> Order History
        </h2>
        <span className="text-xs font-semibold text-muted-foreground bg-muted border border-border rounded-full px-3 py-1">{orders.length} orders</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className={`${card} py-16 text-center`}>
          <Package className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No orders yet</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: 'var(--im-orange)' }}>
            <ShoppingBag className="size-4" /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className={`${card} overflow-hidden`}>
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-muted border-b border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Ticket #</span>
                  <span className="text-sm font-bold text-foreground font-mono">{order.ticketNumber}</span>
                </div>
                <StatusBadge status={order.status} />
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Date</span>
                  <span className="text-sm text-foreground font-medium">{order.createdAt}</span>
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Items</p>
                <div className="space-y-2">
                  {order.items?.length > 0 ? order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-foreground"><span className="font-semibold">{item.quantity}×</span> {item.productName}
                        <span className="text-muted-foreground"> · {item.variantLabel}</span>
                      </span>
                      <span className="font-semibold text-foreground shrink-0 ml-3">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">Items not available</p>}
                  {order.items?.length > 3 && <p className="text-xs text-muted-foreground">+{order.items.length - 3} more items</p>}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4 border-t border-border bg-muted/30">
                <div className="space-y-0.5 text-sm text-muted-foreground">
                  <div>Subtotal: <strong className="text-foreground">€{(order.subtotal || 0).toFixed(2)}</strong></div>
                  <div>Bus dispatch (excl.): <strong className="text-foreground">€{(order.deliveryFee || 0).toFixed(2)}</strong></div>
                  <div className="text-base font-bold text-foreground">Total (EUR): €{(order.grandTotal || 0).toFixed(2)}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/track?ticket=${order.id}`} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: 'var(--im-navy-mid)' }}>
                    <Truck className="size-3" /> Track
                  </Link>
                  <button className="flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
                    <Download className="size-3" /> Invoice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Basket Section ──────────────────────────────────────────────────────────
function BasketSection() {
  const { lines, subtotal, totalWeight, removeItem } = useCart()

  if (lines.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <SectionIcon icon={<ShoppingCart className="size-4" />} /> Your Basket
        </h2>
        <div className={`${card} py-16 text-center`}>
          <ShoppingCart className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">Your basket is empty</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ background: 'var(--im-orange)' }}>
            <ShoppingBag className="size-4" /> Shop Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <SectionIcon icon={<ShoppingCart className="size-4" />} /> Your Basket
        </h2>
        <span className="text-xs font-semibold text-muted-foreground bg-muted border border-border rounded-full px-3 py-1">{lines.length} item{lines.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="divide-y divide-border">
          {lines.map(line => (
            <div key={line.key} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted shrink-0">
                <ShoppingBag className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{line.product.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{line.variant.label} · Qty: {line.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">€{(line.variant.price * line.quantity).toFixed(2)}</p>
                <button onClick={() => removeItem(line.key)} className="text-[11px] font-semibold text-destructive hover:text-destructive/80 mt-0.5 transition-colors">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 bg-muted/50 border-t border-border space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span><span className="font-semibold text-foreground">€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total Weight</span><span>{totalWeight.toFixed(2)} kg</span>
          </div>
        </div>
      </div>

      <Link href="/checkout" className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200" style={{ background: 'var(--im-orange)' }}>
        <Zap className="size-4" /> Proceed to Checkout
      </Link>
    </div>
  )
}

// ─── Activity Section ────────────────────────────────────────────────────────
function ActivitySection({ orders }: { orders: LiveOrder[] }) {
  const events = orders.flatMap(o => [
    { time: o.createdAt, label: `Order placed: ${o.ticketNumber}`, detail: `€${(o.grandTotal || 0).toFixed(2)} · ${o.items?.length || 0} items`, icon: <Package className="size-3" />, dotColor: 'var(--im-navy-mid)' },
    ...(o.status.toLowerCase().includes('delivered') ? [{ time: o.createdAt, label: `Delivered: ${o.ticketNumber}`, detail: `To ${o.transitHub}`, icon: <CheckCircle2 className="size-3" />, dotColor: '#059669' }] : []),
  ]).sort((a, b) => b.time.localeCompare(a.time))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <SectionIcon icon={<Activity className="size-4" />} /> Activity Timeline
      </h2>
      {events.length === 0 ? (
        <div className={`${card} py-16 text-center`}>
          <Activity className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[1.125rem] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {events.map((ev, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-11">
                <div className="absolute left-0 flex size-[18px] items-center justify-center rounded-full text-white shadow-sm" style={{ background: ev.dotColor, top: '14px' }}>
                  {ev.icon}
                </div>
                <div className={`${card} flex-1 p-4`}>
                  <p className="text-sm font-semibold text-foreground">{ev.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ev.detail}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function CustomerDashboard({ onSelectTab }: { onSelectTab: (tab: string) => void }) {
  const { lines }   = useCart()
  const { user, signOut } = useAuth()

  const [section,  setSection]  = useState<DashboardSection>('overview')
  const [orders,   setOrders]   = useState<LiveOrder[]>([])
  const [loading,  setLoading]  = useState(true)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(clientDb, 'users', user.uid)).then(d => {
      if (d.exists() && d.data().photoURL) setPhotoURL(d.data().photoURL)
    }).catch(console.error)
  }, [user])

  useEffect(() => {
    if (!user?.email) return
    const q = query(collection(clientDb, 'orders'), where('customerEmail', '==', user.email), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          ticketNumber: data.ticketNumber || d.id.slice(0, 8).toUpperCase(),
          createdAt: data.createdAt?.toDate?.()?.toLocaleDateString?.() || data.createdAt || 'Unknown',
          grandTotal: data.grandTotal || 0,
          subtotal:   data.subtotal   || 0,
          deliveryFee: data.deliveryFee || 0,
          items:       data.items      || [],
          status:      data.status     || 'Processing',
          transitHub:  data.transitHub || '',
          paymentMethod: data.paymentMethod || '',
          customerPhone: data.customerPhone || '',
        }
      }))
      setLoading(false)
    }, err => { console.error(err); setLoading(false) })
    return () => unsub()
  }, [user])

  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    onSelectTab('shop')
  }

  const sectionNames: Record<DashboardSection, string> = {
    overview: 'Overview', profile: 'Profile', address: 'Address',
    orders: 'Orders', basket: 'Basket', activity: 'Activity',
  }

  return (
    // Full-width, full-height — fills the <main> from client-layout
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-160px)] bg-background">
      <Sidebar
        section={section}
        onSection={setSection}
        user={user}
        photoURL={photoURL}
        orders={orders}
        cartCount={lines.length}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-8 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Menu className="size-4 text-foreground" />
          </button>
          <h1 className="font-bold text-foreground">{sectionNames[section]}</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {section === 'overview'  && <OverviewSection  orders={orders}  user={user}  onSection={setSection} />}
            {section === 'profile'   && <ProfileSection   user={user}  photoURL={photoURL} onPhotoUpdate={setPhotoURL} />}
            {section === 'address'   && <AddressSection   user={user} />}
            {section === 'orders'    && <OrdersSection    orders={orders}  loading={loading} />}
            {section === 'basket'    && <BasketSection />}
            {section === 'activity'  && <ActivitySection  orders={orders} />}
          </div>
        </div>
      </div>
    </div>
  )
}
