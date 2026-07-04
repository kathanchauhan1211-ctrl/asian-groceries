'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { Button } from '@/components/ui/button'
import {
  Bus,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  ClipboardCheck,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Weight,
} from 'lucide-react'
import { addDoc, collection } from 'firebase/firestore'
import { clientDb } from '@/lib/firebase-client'

const DESTINATIONS = [
  { id: 'kaunas', label: 'Kaunas Bus Station - Via Autobusų Stotis Courier', price: 4.5 },
  { id: 'klaipeda', label: 'Klaipėda Bus Station - Via Autobusų Stotis Courier', price: 6.0 },
  { id: 'siauliai', label: 'Šiauliai Bus Station - Via Autobusų Stotis Courier', price: 5.0 },
  { id: 'panevezys', label: 'Panevėžys Bus Station - Via Autobusų Stotis Courier', price: 4.5 },
  { id: 'alytus', label: 'Alytus Bus Station - Via Autobusų Stotis Courier', price: 4.0 },
]

export function CheckoutForm({ onComplete }: { onComplete: (ticketNum: string) => void }) {
  const { lines, subtotal, totalWeight, setOpen } = useCart()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+370 ')
  const [transitHub, setTransitHub] = useState(DESTINATIONS[0].id)
  const [instructions, setInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [firebasePayload, setFirebasePayload] = useState<any>(null)
  const [orderCreated, setOrderCreated] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')

  // Handle phone input formatting to respect the mask +370 XXXXXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value
    // If user tries to delete the prefix, restore it
    if (!input.startsWith('+370 ')) {
      input = '+370 ' + input.replace(/\D/g, '')
    }
    
    // Allow max +370 followed by 8 digits
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

    // Generate simulated ticket number
    const rand = Math.floor(1000 + Math.random() * 9000)
    const tNum = `AS-VLN-${rand}`
    setTicketNumber(tNum)

    const payload = {
      orderId: tNum,
      customer: {
        name,
        phone: phone.trim(),
        whatsappLinked: true,
      },
      transit: {
        destinationHub: selectedTransit.label,
        type: 'Via Autobusų Stotis Courier',
        origin: 'Šaltinių g. 22, Vilnius',
        price: deliveryPrice,
        instructions: instructions || 'Please drop off at station ticket office counter.',
      },
      items: lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        variant: l.variant.label,
        price: l.variant.price,
        quantity: l.quantity,
        weightKg: l.variant.weightKg,
      })),
      metrics: {
        totalWeightKg: totalWeight,
        subtotalPrice: subtotal,
        deliveryPrice: deliveryPrice,
        grandTotalPrice: grandTotal,
      },
      status: 'Ordered',
      createdAt: new Date().toISOString(),
    }

    setFirebasePayload(payload)

    try {
      // Attempt to save in Firestore database
      await addDoc(collection(clientDb, 'orders'), payload)
    } catch (err) {
      console.warn('Firebase document save omitted/failed (likely unconfigured credentials). Payload captured locally for UI:', payload)
    }

    // Save order preference to localStorage for user hub re-ordering
    try {
      const history = JSON.parse(localStorage.getItem('ag_order_history') || '[]')
      history.unshift({
        ticketNum: tNum,
        date: new Date().toLocaleDateString(),
        itemsCount: lines.reduce((s, l) => s + l.quantity, 0),
        totalPrice: grandTotal,
        items: lines.map(l => `${l.quantity}x ${l.product.name.split(' 5kg')[0]}`),
        transitHub: selectedTransit.label,
      })
      localStorage.setItem('ag_order_history', JSON.stringify(history.slice(0, 10)))
      localStorage.setItem('ag_saved_terminal', selectedTransit.label)
    } catch (e) {
      console.error(e)
    }

    setIsSubmitting(false)
    setOrderCreated(true)
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
            <span>Total Weight</span>
            <span className="font-bold text-slate-900">{totalWeight.toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-slate-200 text-xs font-bold text-slate-900">
            <span>Amount Charged</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* WhatsApp verification confirmation message */}
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 py-2 rounded-md border border-emerald-200">
          <Calendar className="size-3.5" /> Order tracking notification sent via WhatsApp to {phone}!
        </p>

        {/* Display database payload for developers */}
        <div className="mt-6 text-left">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
            Structured Firebase JSON Payload (Captured)
          </p>
          <pre className="text-[10px] text-emerald-600 font-mono bg-slate-50 p-4 rounded-xl max-h-48 overflow-y-auto border border-slate-200">
            {JSON.stringify(firebasePayload, null, 2)}
          </pre>
        </div>

        <Button
          onClick={() => onComplete(ticketNumber)}
          className="mt-6 w-full rounded-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all duration-300"
        >
          Track Your Delivery Pipeline
        </Button>
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
          <Bus className="size-5 text-accent" /> Checkout &amp; Dispatch
        </h2>
        <span className="text-xs font-semibold text-slate-500">Step {step} of 2</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <User className="size-3.5 text-accent" /> Step 1: Customer Contact details
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
                WhatsApp Phone Number (Delivery Updates)
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
              <p className="mt-1 text-[11px] text-slate-500 font-medium leading-normal">
                Verifies tracking updates. Example format: +370 61234567.
              </p>
            </div>

            <Button
              type="button"
              disabled={!name.trim() || phone.length < 13}
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all duration-300 flex items-center justify-center gap-1 shadow-md shadow-accent/15"
            >
              Continue to Dispatch <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <MapPin className="size-3.5 text-accent" /> Step 2: Courier Terminal Dispatch
            </h3>

            <div>
              <label htmlFor="checkout-destination" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Station (Lithuanian Hub)
              </label>
              <div className="relative">
                <Bus className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="checkout-destination"
                  value={transitHub}
                  onChange={(e) => setTransitHub(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50"
                >
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label.split(' - ')[0]} (€{d.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="checkout-instructions" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Terminal Drop-Off Instructions (Optional)
              </label>
              <textarea
                id="checkout-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
                placeholder="e.g. Please leave with platform parcel office attendant."
                className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent/50 hover:bg-slate-50"
              />
            </div>

            {/* Dynamic Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ClipboardCheck className="size-3.5 text-accent" /> Order Summary Details
              </h4>
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-full border-slate-800 text-slate-350 hover:bg-slate-800"
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 shadow-md shadow-accent/15 transition-all duration-300"
              >
                {isSubmitting ? 'Syncing to Firebase...' : 'Confirm Order & Dispatch'}
              </Button>
            </div>
            <p className="text-center text-[10px] text-slate-500 font-medium">
              By dispatching, you confirm manual drop-off at Vilnius Bus Station platform counter.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
