'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminPortalAuth } from '@/lib/firebase-admin-client'
import { Search, User, Phone, MapPin, Mail, ShoppingBag, Bell, CheckCircle2, XCircle, Loader2, Edit3, Trash2, ShieldOff, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { adminPortalDb } from '@/lib/firebase-admin-client'
import { Button } from '@/components/ui/button'

type UserRequest = {
  id: string
  userId: string
  userEmail: string
  type: 'UPDATE_PROFILE' | 'CHANGE_EMAIL' | 'DELETE_ACCOUNT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  payload?: any
  createdAt: string
}

export default function AdminCustomersPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'notifications' | 'management'>('directory')
  
  // Customers State
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [search, setSearch] = useState('')

  // Requests State
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const currentUser = adminPortalAuth.currentUser
      if (!currentUser) return
      const token = await currentUser.getIdToken()
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { users: data } = await res.json()
      const fetchedUsers = data ?? []
      
      // Clean up phone numbers to prevent duplicate country codes (e.g., +370 +370...)
      const cleaned = fetchedUsers.map((u: any) => ({
        ...u,
        phone: u.phone ? u.phone.replace(/^(\+\d{1,4})\s*\1/, '$1') : u.phone
      }))

      // Sort by creation time (oldest first) to maintain sequence
      const sorted = cleaned.sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });

      // Assign sequential ID (001, 002, etc.)
      const withIds = sorted.map((u: any, i: number) => ({
        ...u,
        sequentialId: String(i + 1).padStart(3, '0')
      }));

      setUsers(withIds)
    } catch (err) {
      console.error('[AdminCustomersPage] Failed to fetch users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    const id = setInterval(fetchUsers, 60_000)
    return () => clearInterval(id)
  }, [fetchUsers])

  // Fetch Requests
  useEffect(() => {
    const q = query(collection(adminPortalDb, 'userRequests'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      const reqs: UserRequest[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as UserRequest))
      setRequests(reqs)
      setLoadingRequests(false)
    }, (err) => {
      console.error(err)
      setLoadingRequests(false)
    })
    return () => unsubscribe()
  }, [])

  // Request Handlers
  const handleMarkDone = async (req: UserRequest) => {
    setProcessingId(req.id)
    try {
      await updateDoc(doc(adminPortalDb, 'userRequests', req.id), { status: 'APPROVED' })
      alert('Request marked as resolved.')
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (req: UserRequest) => {
    if (!confirm('Reject this request?')) return
    setProcessingId(req.id)
    try {
      await updateDoc(doc(adminPortalDb, 'userRequests', req.id), { status: 'REJECTED' })
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = users.filter(u => {
    const s = search.toLowerCase()
    return !s || (u.email || '').toLowerCase().includes(s) || (u.name || u.displayName || '').toLowerCase().includes(s) || (u.phone || '').toLowerCase().includes(s)
  })

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const completedRequests = requests.filter(r => r.status !== 'PENDING')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customers Control Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Manage users, approve requests, and take administrative actions.</p>
        </div>

        {activeTab !== 'notifications' && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button onClick={() => setActiveTab('directory')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'directory' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
          Directory
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
          Requests {pendingRequests.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
        </button>
        <button onClick={() => setActiveTab('management')} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'management' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
          Management Actions
        </button>
      </div>

      {/* Section 1: Directory */}
      {activeTab === 'directory' && (
        <div>
          {loadingUsers ? (
             <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-white/5 bg-slate-900/50">
              <User className="size-12 text-slate-600 mb-4" />
              <p className="text-slate-300 font-semibold text-lg">No customers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(u => (
                <div key={u.id} className="rounded-2xl border border-white/5 bg-slate-900 p-5 hover:border-orange-500/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 overflow-hidden border border-white/10">
                      {u.photoURL ? <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" /> : <User className="size-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">#{u.sequentialId}</span>
                        <h3 className="font-bold text-white text-base truncate">{u.name || u.displayName || 'Unnamed User'}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1 truncate"><Mail className="size-3.5 shrink-0" /><span className="truncate">{u.email || 'No email provided'}</span></div>
                      {u.phone && <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1"><Phone className="size-3.5 shrink-0" />{u.phone}</div>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                    <Link href={`/admin/orders?search=${encodeURIComponent(u.email || u.id)}`} className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-all">
                      <ShoppingBag className="size-3.5" /> View Orders
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Notifications / Requests */}
      {activeTab === 'notifications' && (
        <div className="space-y-8 max-w-5xl">
          {loadingRequests ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-slate-400" /></div>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-bold text-white mb-4">Pending Requests</h2>
                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900 rounded-2xl border border-white/5"><p className="text-slate-400">No pending requests.</p></div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map(req => (
                      <div key={req.id} className="p-5 rounded-2xl border border-orange-500/30 bg-slate-900/80 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400">{new Date(req.createdAt).toLocaleString()}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">PENDING</span>
                          </div>
                          <p className="text-sm font-semibold text-white"><span className="text-slate-400">User:</span> {req.userEmail}</p>
                          <p className="text-base font-bold text-orange-400 mt-1">
                            {req.type === 'DELETE_ACCOUNT' && 'Request Account Deletion'}
                            {req.type === 'CHANGE_EMAIL' && `Request Email Change to: ${req.payload?.newEmail}`}
                            {req.type === 'UPDATE_PROFILE' && 'Request Profile Info Update'}
                          </p>
                          {req.type === 'UPDATE_PROFILE' && req.payload && (
                            <div className="mt-2 text-xs text-slate-400 bg-black/20 p-2 rounded">Name: {req.payload.displayName} | Phone: {req.payload.phone}</div>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => handleReject(req)} disabled={processingId === req.id} className="text-slate-300 hover:text-red-400 hover:bg-red-500/10"><XCircle className="size-4 mr-1.5" /> Reject</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleMarkDone(req)} disabled={processingId === req.id} className="text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10"><CheckCircle2 className="size-4 mr-1.5" /> Mark Done</Button>
                          <Button variant="default" size="sm" onClick={() => { 
                            setActiveTab('management'); 
                            setTimeout(() => {
                              document.getElementById('user-' + req.userId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              document.getElementById('user-' + req.userId)?.classList.add('ring-2', 'ring-orange-500');
                              setTimeout(() => document.getElementById('user-' + req.userId)?.classList.remove('ring-2', 'ring-orange-500'), 2000);
                            }, 100);
                          }} className="bg-orange-600 hover:bg-orange-500 text-white"> Take Action →</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 className="text-lg font-bold text-white mb-4">Past Requests</h2>
                <div className="space-y-4">
                  {completedRequests.slice(0, 10).map(req => (
                    <div key={req.id} className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 flex flex-col sm:flex-row gap-4 justify-between items-center">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400">{new Date(req.createdAt).toLocaleString()}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{req.status}</span>
                          </div>
                          <p className="text-sm font-semibold text-white"><span className="text-slate-400">User:</span> {req.userEmail}</p>
                          <p className="text-base font-bold text-slate-300 mt-1">{req.type}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* Section 3: Management Actions */}
      {activeTab === 'management' && (
        <div>
          {loadingUsers ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-4">
              {filtered.map(u => (
                <ManagementUserCard key={u.id} u={u} onRefresh={fetchUsers} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ManagementUserCard({ u, onRefresh }: { u: any, onRefresh: () => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(u.name || u.displayName || '')
  const [email, setEmail] = useState(u.email || '')
  const [phone, setPhone] = useState(u.phone || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentUser = adminPortalAuth.currentUser
      if (!currentUser) throw new Error('Not authenticated as admin')
      const token = await currentUser.getIdToken()

      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          userId: u.id, 
          data: { 
            displayName: name.trim(), 
            email: email.trim(), 
            phone: phone.trim(),
            ...(password.trim() ? { password: password.trim() } : {})
          }
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update user')
      }

      setIsEditing(false)
      setPassword('')
      onRefresh()
      alert('User successfully updated!')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const [actionPrompt, setActionPrompt] = useState<{ action: 'suspend' | 'ban' | 'delete' | 'activate' } | null>(null)
  const [confirmEmail, setConfirmEmail] = useState('')

  const handleActionConfirm = async () => {
    if (!actionPrompt) return
    const action = actionPrompt.action
    
    if (confirmEmail !== (u.email || u.id)) {
      alert('Email did not match. Action cancelled.')
      return
    }

    setActionPrompt(null)
    setConfirmEmail('')
    setSaving(true)
    
    try {
      const currentUser = adminPortalAuth.currentUser
      if (!currentUser) throw new Error('Not authenticated as admin')
      const token = await currentUser.getIdToken()

      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: u.id, action })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `Failed to ${action} user`)
      }

      onRefresh()
      // Optional success alert, or just let UI update
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const isSuspendedOrBanned = u.disabled || u.status === 'suspended' || u.status === 'banned'

  return (
    <>
      <div className={`rounded-2xl border ${isSuspendedOrBanned ? 'border-orange-500/50 bg-orange-950/20' : 'border-red-500/20 bg-slate-900/40'} p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-500`} id={`user-${u.id}`}>
         <div className="flex-1 min-w-0 w-full">
            {isEditing ? (
              <div className="space-y-2 max-w-sm">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500" />
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500" />
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password (leave blank to keep current)" className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
            ) : (
              <>
                <h3 className="font-bold text-white text-base truncate flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">#{u.sequentialId}</span>
                  {u.name || u.displayName || 'Unnamed User'}
                  {isSuspendedOrBanned && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-orange-500/20 text-orange-400">{u.status || 'Disabled'}</span>}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1 truncate"><Mail className="size-3.5 shrink-0" /><span className="truncate">{u.email || 'No email provided'}</span></div>
                {u.phone && <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-1"><Phone className="size-3.5 shrink-0" />{u.phone}</div>}
              </>
            )}
         </div>
         <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-slate-400">Cancel</Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white">Save</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                  <Edit3 className="size-4 mr-1.5" /> Edit
                </Button>
                
                {isSuspendedOrBanned ? (
                  <Button variant="ghost" size="sm" onClick={() => setActionPrompt({ action: 'activate' })} disabled={saving} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                    <CheckCircle2 className="size-4 mr-1.5" /> Reactivate
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setActionPrompt({ action: 'suspend' })} disabled={saving} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                      <ShieldOff className="size-4 mr-1.5" /> Suspend
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setActionPrompt({ action: 'ban' })} disabled={saving} className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10">
                      <ShieldAlert className="size-4 mr-1.5" /> Ban
                    </Button>
                  </>
                )}
                
                <Button variant="ghost" size="sm" onClick={() => setActionPrompt({ action: 'delete' })} disabled={saving} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 className="size-4 mr-1.5" /> Delete
                </Button>
              </>
            )}
         </div>
      </div>

      {/* ── Custom Action Popup Modal ── */}
      {actionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-10 rounded-full items-center justify-center bg-red-500/20 text-red-500">
                  <ShieldAlert className="size-5" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{actionPrompt.action} User</h2>
              </div>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                You are about to securely <strong>{actionPrompt.action}</strong> this customer. This action will take effect immediately.
                <br /><br />
                To confirm, please type their exact email address (or ID): <strong className="text-white select-all">{u.email || u.id}</strong>
              </p>
              
              <input 
                type="text" 
                value={confirmEmail} 
                onChange={e => setConfirmEmail(e.target.value)} 
                placeholder="Type to confirm" 
                autoFocus
                className="w-full rounded-xl border border-red-500/30 bg-black/50 py-3 px-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all mb-6"
                onKeyDown={(e) => e.key === 'Enter' && handleActionConfirm()}
              />

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => { setActionPrompt(null); setConfirmEmail('') }} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                  Cancel
                </Button>
                <Button variant="default" onClick={handleActionConfirm} disabled={confirmEmail !== (u.email || u.id) || saving} className="bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-900/20">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : 'Confirm Action'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
