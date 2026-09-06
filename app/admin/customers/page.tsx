'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { Search, User, Phone, MapPin, Mail, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const q = query(collection(clientDb, 'users'))
    const unsub = onSnapshot(q,
      (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Users snapshot error:', err)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filtered = users.filter(u => {
    const s = search.toLowerCase()
    return !s
      || (u.email || '').toLowerCase().includes(s)
      || (u.name || u.displayName || '').toLowerCase().includes(s)
      || (u.phone || '').toLowerCase().includes(s)
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customers</h1>
          <p className="text-sm text-slate-400 mt-1">Manage registered users and their details.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/5 bg-slate-900/50">
          <User className="size-12 text-slate-600 mb-4" />
          <p className="text-slate-300 font-semibold text-lg">No customers found</p>
          <p className="text-slate-500 text-sm max-w-sm mt-1">
            {search ? 'Try adjusting your search filters.' : 'No users have registered yet or the users collection is empty.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(u => (
            <div key={u.id} className="rounded-2xl border border-white/5 bg-slate-900 p-5 hover:border-orange-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 overflow-hidden border border-white/10">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{u.name || u.displayName || 'Unnamed User'}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1 truncate">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{u.email || u.id}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                      <Phone className="size-3.5 shrink-0" />
                      {u.phone}
                    </div>
                  )}
                  {u.preferredTerminal && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1">
                      <MapPin className="size-3.5 shrink-0" />
                      DPD: {u.preferredTerminal}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                <Link
                  href={`/admin/orders?search=${encodeURIComponent(u.email || u.id)}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  <ShoppingBag className="size-3.5" /> View Orders
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
