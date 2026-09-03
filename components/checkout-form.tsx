'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import {
  Bus,
  User,
  Phone,
  MapPin,
  ClipboardCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Weight,
  Download,
  Building2,
} from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'
import { useAuth } from '@/lib/auth-context'
import { PaymentMethodSelector, type PaymentMethod, BANK_DETAILS } from './payment-method-selector'
import { generateInvoice } from '@/lib/invoice'

const DESTINATIONS = [
  { id: 'kaunas', label: 'Kaunas Bus Station - Via Autobusų Stotis Courier', price: 4.5 },
  { id: 'klaipeda', label: 'Klaipėda Bus Station - Via Autobusų Stotis Courier', price: 6.0 },
  { id: 'siauliai', label: 'Šiauliai Bus Station - Via Autobusų Stotis Courier', price: 5.0 },
  { id: 'panevezys', label: 'Panevėžys Bus Station - Via Autobusų Stotis Courier', price: 4.5 },
  { id: 'alytus', label: 'Alytus Bus Station - Via Autobusų Stotis Courier', price: 4.0 },
]

export function CheckoutForm({ onComplete }: { onComplete: (ticketNum: string) => void }) {
  const { lines, subtotal, totalWeight, setOpen, clearCart } = useCart()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+370 ')
  const [transitHub, setTransitHub] = useState(DESTINATIONS[0].id)
  const [instructions, setInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [finalStatus, setFinalStatus] = useState('')

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

  const selectedTransit = DESTINATIONS.find((d) => d.id === transitHub) || DESTINATIONS[0]
  const deliveryPrice = subtotal >= 25 ? 0 : selectedTransit.price
  const grandTotal = subtotal + deliveryPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate a short ticket number: AG + timestamp suffix
      const ticketNum = `AG-${Date.now().toString(36).toUpperCase()}`

      // Save order directly to Firestore via client SDK
      const orderData = {
        ticketNumber: ticketNum,
        customerName: name,
        customerPhone: phone,
        transitHub,
        orderNotes: instructions,
        paymentMethod,
        paymentStatus: 'Pending Payment - Bank Transfer',
        status: 'Pending Payment',
        items: lines.map(l => ({
          productId: l.product.id,
          productName: l.product.name,
          variantLabel: l.variant.label,
          price: l.variant.price,
          quantity: l.quantity,
        })),
        subtotal,
        deliveryFee: deliveryPrice,
        grandTotal,
        totalWeight,
        customerEmail: user?.email || null,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(clientDb, 'orders'), orderData)
      console.log('Order saved to Firestore:', docRef.id)

      setTicketNumber(ticketNum)
      setFinalStatus('Pending Payment - Awaiting Bank Transfer')
      setOrderCreated(true)
      clearCart()
    } catch (err: any) {
      console.error('Order submission error:', err)
      alert(err.message || 'An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleDownloadInvoice = () => {
    generateInvoice({
      ticketNum: ticketNumber,
      date: new Date().toLocaleDateString(),
      customerName: name,
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
      customerName: name || 'Guest',
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
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-950 text-emerald-500 border border-emerald-800/40">
          <CheckCircle2 className="size-10" />
        </span>
        <h2 className="mt-4 text-2xl font-bold font-sans text-slate-900">Order Dispatched to Courier!</h2>
        <p className="mt-2 text-sm text-slate-600">
          We prepared your parcel from <strong>Šaltinių g. 22, Vilnius</strong>. It will go on the next bus dispatch.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left border border-slate-200">
          <div className="flex justify-between border-b border-slate-200 pb-2.5 text-xs text-slate-500">
            <span>Ticket Number</span>
            <span className="font-bold text-accent">{ticketNumber}</span>
          </div>
          <div className="flex justify-between py-2 text-xs text-slate-500">
            <span>Destination Hub</span>
            <span className="font-bold text-slate-900">{selectedTransit.label.split(' - ')[0]}</span>
          </div>
          <div className="flex justify-between py-2 text-xs text-slate-500">
            <span>Payment Status</span>
            <span className="font-bold text-amber-600">{finalStatus}</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-slate-200 text-xs font-bold text-slate-900">
            <span>Amount Charged</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {paymentMethod === 'bank_transfer' && (
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2">Bank Transfer Details</h4>
            <p className="text-sm text-blue-900 mb-2">Please transfer <strong>€{grandTotal.toFixed(2)}</strong> to:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold text-xs">Account Name</span>
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

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadInvoice}
            className="flex-1 rounded-full border-slate-300 font-bold hover:bg-slate-50"
          >
            <Download className="size-4 mr-2" /> Save Invoice
          </Button>
          <Button
            onClick={() => onComplete(ticketNumber)}
            className="flex-1 rounded-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all duration-300"
          >
            Track Delivery
          </Button>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl text-center p-8 bg-white border border-slate-200 rounded-xl shadow-sm">
        <span className="text-4xl">🛒</span>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Your Basket is Empty</h3>
        <p className="text-sm text-slate-500 mt-1">
          Please add products to your basket before checking out.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-sans text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bus className="size-5 text-accent" /> Checkout
        </h2>
        <span className="text-xs font-semibold text-slate-500">Step {step} of 3</span>
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
              <User className="size-3.5 text-accent" /> Step 1: Customer & Delivery Info
            </h3>

            <div>
              <label htmlFor="checkout-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jonas Kovas"
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="checkout-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number (Delivery Updates)
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
                Destination Station (Lithuanian Hub)
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
                      {d.label.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="button"
              disabled={!name.trim() || phone.length < 13}
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all duration-300"
            >
              Continue to Payment <ChevronRight className="size-4 ml-1" />
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
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-full border-slate-300 font-semibold w-1/3"
              >
                <ArrowLeft className="size-4 mr-1" /> Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all duration-300"
              >
                Continue to Review <ChevronRight className="size-4 ml-1" />
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
                <span>Bus Station Dispatch Fee</span>
                <span>{deliveryPrice === 0 ? 'FREE' : `€${deliveryPrice.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 items-center">
                <span className="flex items-center gap-1">
                  <Weight className="size-3.5 text-emerald-600" /> Total Package Weight
                </span>
                <span className="font-semibold text-slate-900">{totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Due</span>
                <span className="text-accent">€{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-500 bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100">
              Payment Method: <strong className="uppercase">{paymentMethod.replace('_', ' ')}</strong>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="rounded-full border-slate-300 font-semibold px-4"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrintBill}
                className="rounded-full bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 whitespace-nowrap px-4"
              >
                <Download className="size-4 mr-1.5" /> Save Bill
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 shadow-md shadow-accent/15 transition-all duration-300"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
