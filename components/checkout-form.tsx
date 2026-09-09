'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import { LiquidGlassBox } from '@/components/ui/liquid-glass-box'
import {
  Bus,
  Phone,
  MapPin,
  ClipboardCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Weight,
  Download,
  Building2,
  User,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { PaymentMethodSelector, type PaymentMethod, BANK_DETAILS } from './payment-method-selector'
import { generateInvoice } from '@/lib/invoice'
import { DESTINATIONS, getDestinationById } from '@/lib/destinations'

export function CheckoutForm({ onComplete }: { onComplete: (ticketNum: string) => void }) {
  const { lines, subtotal, totalWeight, clearCart } = useCart()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('+370 ')
  const [transitHub, setTransitHub] = useState(DESTINATIONS[0].id)
  const [instructions, setInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [finalStatus, setFinalStatus] = useState('')
  // Surfaces server-side errors (e.g. out of stock) gracefully in the UI
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  const [whatsappLink, setWhatsappLink] = useState('')

  useEffect(() => {
    if (orderCreated) {
      getDoc(doc(clientDb, 'settings', 'store'))
        .then((snap) => {
          if (snap.exists() && snap.data().whatsappGroup) {
            setWhatsappLink(snap.data().whatsappGroup)
          }
        })
        .catch(err => console.error('Failed to load whatsapp settings:', err))
    }
  }, [orderCreated])

  // Name comes from auth profile; unauthenticated users enter it manually
  const [guestName, setGuestName] = useState('')
  const [profileName, setProfileName] = useState('')

  useEffect(() => {
    if (user) {
      getDoc(doc(clientDb, 'users', user.uid)).then(d => {
        if (d.exists()) {
          const data = d.data()
          if (data.phone && phone === '+370 ') setPhone(data.phone)
          if (data.displayName) setProfileName(data.displayName)
          else if (data.firstName) setProfileName(`${data.firstName} ${data.surname || ''}`.trim())
          
          if (data.preferredTerminal) {
            setTransitHub(data.preferredTerminal)
          }
        }
      }).catch(console.error)
    }
  }, [user, phone])

  const customerName = user ? (profileName || user.displayName || 'Customer') : guestName

  // Handle phone input formatting to respect the mask +370 XXXXXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value
    if (!input.startsWith('+370 ')) {
      input = '+370 ' + input.replace(/\D/g, '')
    }
    const suffix = input.substring(5).replace(/\D/g, '')
    const limitedSuffix = suffix.substring(0, 8)
    setPhone('+370 ' + limitedSuffix)
  }

  const selectedTransit = getDestinationById(transitHub) || DESTINATIONS[0]
  // Bus delivery always applies — no free delivery
  const deliveryPrice = selectedTransit.price
  const grandTotal = subtotal + deliveryPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Build a safe payload — no client-side prices sent.
      // The server recalculates all prices from the database.
      const safePayload = {
        items: lines.map((l) => ({
          productId: l.product.id,
          variantLabel: l.variant.label,
          quantity: l.quantity,
        })),
        customerName,
        customerPhone: phone,
        customerEmail: user?.email ?? null,
        transitHub,
        // deliveryFee intentionally omitted — server calculates it from transitHub
        orderNotes: instructions,
        paymentMethod,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safePayload),
      })

      const json = await res.json()

      if (!res.ok) {
        // Surface the server's error message (e.g. "Insufficient stock for X") to the user
        throw new Error(json.error ?? `Server error (${res.status}). Please try again.`)
      }

      const { ticketNumber: serverTicket } = json

      setTicketNumber(serverTicket)
      setFinalStatus('Pending Payment - Awaiting Bank Transfer')
      setOrderCreated(true)
      clearCart()
    } catch (err: unknown) {
      console.error('Order submission error:', err)
      setSubmitError((err as Error).message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleDownloadInvoice = () => {
    generateInvoice({
      ticketNum: ticketNumber,
      date: new Date().toLocaleDateString(),
      customerName,
      phone,
      destination: selectedTransit.label,
      items: lines,
      subtotal,
      deliveryFee: deliveryPrice,
      totalWeight,
      grandTotal,
      paymentMethod,
      paymentStatus: finalStatus,
      documentType: 'TAX INVOICE'
    })
  }

  const handlePrintBill = () => {
    generateInvoice({
      ticketNum: 'PENDING',
      date: new Date().toLocaleDateString(),
      customerName: customerName || 'Guest',
      phone: phone,
      destination: selectedTransit.label,
      items: lines,
      subtotal,
      deliveryFee: deliveryPrice,
      totalWeight,
      grandTotal,
      paymentMethod,
      paymentStatus: 'Pending Confirmation',
      documentType: 'BILL'
    })
  }

  if (orderCreated) {
    return (
      <LiquidGlassBox size="xl" className="mx-auto p-6 text-center" style={{ background: 'rgba(15,20,35,0.85)' }}>
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-950 text-emerald-500 border border-emerald-800/40">
          <CheckCircle2 className="size-10" />
        </span>
        <h2 className="mt-4 text-2xl font-bold font-sans text-white">Order Dispatched to Courier!</h2>
        <p className="mt-2 text-sm text-white/60">
          We prepared your parcel from <strong className="text-white">Šaltinių g. 22, Vilnius</strong>. It will go on the next bus dispatch.
        </p>

        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-left">
          <div className="flex justify-between border-b border-white/10 pb-2.5 text-xs text-white/50">
            <span>Ticket Number</span>
            <span className="font-bold text-accent">{ticketNumber}</span>
          </div>
          <div className="flex justify-between py-2 text-xs text-white/50">
            <span>Customer</span>
            <span className="font-bold text-white">{customerName}</span>
          </div>
          <div className="flex justify-between py-2 text-xs text-white/50">
            <span>Destination Hub</span>
            <span className="font-bold text-white">{selectedTransit.label.split(' - ')[0]}</span>
          </div>
          <div className="flex justify-between py-2 text-xs text-white/50">
            <span>Bus Station Dispatch (excl.)</span>
            <span className="font-bold text-white">€{deliveryPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-xs text-white/50">
            <span>Payment Status</span>
            <span className="font-bold text-amber-400">{finalStatus}</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-white/10 text-xs font-bold text-white">
            <span>Amount Due (EUR)</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {paymentMethod === 'bank_transfer' && (
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Bank Transfer Details — Payment in EUR</h4>
            <p className="text-sm text-blue-900 mb-2">Please transfer <strong>€{grandTotal.toFixed(2)}</strong> to:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold text-xs">Receiver</span>
                <span className="font-bold text-slate-800 text-xs">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold text-xs">Bank</span>
                <span className="font-bold text-slate-800 text-xs">{BANK_DETAILS.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold text-xs">BIC / SWIFT</span>
                <span className="font-bold text-slate-800 text-xs font-mono">{BANK_DETAILS.bic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold text-xs">Currency</span>
                <span className="font-bold text-emerald-700 text-xs">{BANK_DETAILS.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-semibold text-xs">IBAN</span>
                <span className="font-bold text-slate-800 text-xs font-mono bg-white px-2 py-0.5 rounded border border-blue-200">{BANK_DETAILS.iban}</span>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-3 font-semibold">
              ⚠️ Reference: <span className="font-mono text-blue-900">{ticketNumber}</span> — include this in the transfer description.
            </p>
          </div>
        )}

        {whatsappLink && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 border-l-4 border-l-emerald-500 text-left">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <MessageCircle className="size-3.5 text-emerald-600" /> Join Our WhatsApp Group
            </h4>
            <p className="text-[11px] text-slate-600 mb-3">
              Get real-time updates on dispatch times and restocks directly in Vilnius.
            </p>
            <Button
              asChild
              variant="emerald"
              size="sm"
              className="w-full font-bold shadow-sm"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4 mr-2" /> Join WhatsApp Group
              </a>
            </Button>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="glass-dark"
            onClick={handleDownloadInvoice}
            className="flex-1 rounded-full"
          >
            <Download className="size-4" /> Save Invoice
          </Button>
          <Button
            onClick={() => onComplete(ticketNumber)}
            variant="emerald"
            className="flex-1 rounded-full"
          >
            Track Delivery
          </Button>
        </div>
      </LiquidGlassBox>
    )
  }

  if (lines.length === 0) {
    return (
      <LiquidGlassBox size="xl" className="mx-auto p-8 text-center" style={{ background: 'rgba(15,20,35,0.85)' }}>
        <span className="text-4xl">🛒</span>
        <h3 className="mt-4 text-lg font-bold text-white">Your Basket is Empty</h3>
        <p className="text-sm text-white/50 mt-1">
          Please add products to your basket before checking out.
        </p>
      </LiquidGlassBox>
    )
  }

  return (
    <LiquidGlassBox size="xl" className="mx-auto p-6" style={{ background: 'rgba(15,20,35,0.85)' }}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-sans text-xl font-bold text-white flex items-center gap-2">
          <Bus className="size-5 text-accent" /> Checkout
        </h2>
        <span className="text-xs font-semibold text-white/40">Step {step} of 3</span>
      </div>

      <div className="mb-8 flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-slate-100'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-slate-100'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-accent' : 'bg-slate-100'}`} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Bus className="size-3.5 text-accent" /> Step 1: Delivery Info
            </h3>

            {/* Customer name — read-only from profile OR editable for guests */}
            {user ? (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                  <User className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivering to</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{customerName}</p>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="checkout-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="checkout-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="checkout-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number (for delivery updates)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+370 XXXXXXX"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 font-mono outline-none transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="checkout-destination" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Bus Station
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="checkout-destination"
                  value={transitHub}
                  onChange={(e) => setTransitHub(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50"
                >
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label.split(' - ')[0]} — €{d.price.toFixed(2)} excl.
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Bus station dispatch fee: <strong className="text-slate-700">€{deliveryPrice.toFixed(2)}</strong> (excl. from product prices)
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="xl"
              disabled={phone.length < 13}
              onClick={() => setStep(2)}
              className="w-full rounded-full"
            >
              Continue to Payment <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Building2 className="size-3.5 text-accent" /> Step 2: Payment Method
            </h3>

            <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="xl"
                onClick={() => setStep(1)}
                className="rounded-full w-1/3 text-white/70"
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                type="button"
                variant="default"
                size="xl"
                onClick={() => setStep(3)}
                className="flex-1 rounded-full"
              >
                Continue to Review <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <ClipboardCheck className="size-3.5 text-accent" /> Step 3: Order Summary
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {lines.map((line, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-slate-900">{line.quantity}x</span>{' '}
                    <span className="text-slate-700">{line.product.name}</span>
                    <p className="text-xs text-slate-500 ml-5">{line.variant.label}</p>
                  </div>
                  <span className="font-medium text-slate-900">€{(line.variant.price * line.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 mt-4">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Items Subtotal</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Bus Station Dispatch (excl.)</span>
                <span className="font-semibold">€{deliveryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 items-center">
                <span className="flex items-center gap-1">
                  <Weight className="size-3.5 text-emerald-600" /> Total Package Weight
                </span>
                <span className="font-semibold text-slate-900">{totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Due (EUR)</span>
                <span className="text-accent">€{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100">
              Payment Method: <strong className="uppercase">{paymentMethod.replace('_', ' ')}</strong>
            </div>

            {/* Server-side error banner — e.g. "Insufficient stock for X" */}
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                ⚠️ {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                onClick={() => setStep(2)}
                className="rounded-full text-white/70"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="glass-dark"
                size="lg"
                onClick={handlePrintBill}
                className="rounded-full whitespace-nowrap"
              >
                <Download className="size-4" /> Save Bill
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="xl"
                disabled={isSubmitting}
                className="flex-1 rounded-full"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </LiquidGlassBox>
  )
}
