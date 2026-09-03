import { type CartLine } from '@/lib/cart-context'

export type InvoiceData = {
  ticketNum: string
  date: string
  customerName: string
  phone: string
  destination: string
  items: CartLine[]
  subtotal: number
  deliveryFee: number
  totalWeight: number
  grandTotal: number
  paymentMethod: string
  paymentStatus: string
  documentType: 'BILL' | 'TAX INVOICE'
}

export function generateInvoice(data: InvoiceData) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.ticketNum}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body class="p-8 font-sans text-slate-900 bg-white max-w-4xl mx-auto">
  <div class="border border-slate-200 rounded-xl p-8 shadow-sm">
    <div class="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-orange-600 tracking-tight">IndianMarket</h1>
        <p class="text-sm text-slate-500 mt-1">Authentic Indian & South Asian Store</p>
        <p class="text-xs text-slate-400 mt-2">Šaltinių g. 22, Vilnius<br>Lithuania</p>
      </div>
      <div class="text-right">
        <h2 class="text-2xl font-bold text-slate-900">${data.documentType}</h2>
        <p class="text-sm text-slate-600 mt-1">Ticket / Order #<span class="font-bold text-slate-900">${data.ticketNum}</span></p>
        <p class="text-sm text-slate-600">Date: ${data.date}</p>
      </div>
    </div>

    <div class="flex justify-between mb-8">
      <div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Billed To</h3>
        <p class="text-sm font-bold text-slate-900">${data.customerName}</p>
        <p class="text-sm text-slate-600">${data.phone}</p>
      </div>
      <div class="text-right">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Delivery Details</h3>
        <p class="text-sm font-bold text-slate-900">Courier Dispatch</p>
        <p class="text-sm text-slate-600">${data.destination.split(' - ')[0]}</p>
        <p class="text-sm text-slate-600">Total Weight: ${data.totalWeight.toFixed(2)} kg</p>
      </div>
    </div>

    <table class="w-full text-left border-collapse mb-8">
      <thead>
        <tr class="border-b-2 border-slate-200">
          <th class="py-3 text-xs font-bold uppercase text-slate-500">Item Description</th>
          <th class="py-3 text-xs font-bold uppercase text-slate-500 text-center">Qty</th>
          <th class="py-3 text-xs font-bold uppercase text-slate-500 text-right">Unit Price</th>
          <th class="py-3 text-xs font-bold uppercase text-slate-500 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr class="border-b border-slate-100">
            <td class="py-4">
              <p class="text-sm font-bold text-slate-900">${item.product.name}</p>
              <p class="text-xs text-slate-500">${item.variant.label}</p>
            </td>
            <td class="py-4 text-center text-sm text-slate-700">${item.quantity}</td>
            <td class="py-4 text-right text-sm text-slate-700">€${item.variant.price.toFixed(2)}</td>
            <td class="py-4 text-right text-sm font-bold text-slate-900">€${(item.variant.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="flex justify-end">
      <div class="w-72 space-y-3">
        <div class="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>€${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
          <span>Bus Station Dispatch (excl.)</span>
          <span>€${data.deliveryFee.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-lg font-bold text-slate-900 pt-1">
          <span>Total Due (EUR)</span>
          <span class="text-orange-600">€${data.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="mt-10 p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Status</h4>
      <p class="text-sm font-bold ${data.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}">
        ${data.paymentMethod.toUpperCase()} — ${data.paymentStatus}
      </p>
    </div>

    <div class="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
      <h4 class="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Bank Transfer Details — Payment in EUR</h4>
      <div class="grid grid-cols-2 gap-1.5 text-sm">
        <span class="text-blue-600 font-semibold">Receiver</span>
        <span class="font-bold text-slate-800">Indian Market</span>
        <span class="text-blue-600 font-semibold">Bank</span>
        <span class="font-bold text-slate-800">Luminor Bank</span>
        <span class="text-blue-600 font-semibold">BIC / SWIFT</span>
        <span class="font-bold text-slate-800 font-mono">AGBLLT2XXXX</span>
        <span class="text-blue-600 font-semibold">Currency</span>
        <span class="font-bold text-emerald-700">EUR</span>
        <span class="text-blue-600 font-semibold">IBAN</span>
        <span class="font-bold text-slate-800 font-mono">LT68 4010 0510 0593 7512</span>
        <span class="text-blue-600 font-semibold">Reference</span>
        <span class="font-bold text-orange-700 font-mono">${data.ticketNum}</span>
      </div>
    </div>

    <div class="mt-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
      <p>Thank you for shopping at IndianMarket!</p>
      <p>For support, contact support@indianmarket.lt</p>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
  `

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
