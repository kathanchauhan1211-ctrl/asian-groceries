/**
 * lib/destinations.ts
 *
 * Single source of truth for all delivery transit hubs (used by checkout and customer dashboard).
 *
 * Previously this data was duplicated across:
 *   - components/checkout-form.tsx       (price only)
 *   - components/customer-dashboard.tsx  (label + price)
 *
 * Parcel tracking is now handled by the DPD Interconnector API via /api/dpd/track.
 * To add/rename/reprice a destination, edit this file only.
 */

export type Destination = {
  id: string
  name: string
  label: string
  price: number
}

export const DESTINATIONS: Destination[] = [
  { id: 'kaunas', name: 'Kaunas', label: 'Kaunas - Autobusų Stotis', price: 4.5 },
  { id: 'klaipeda', name: 'Klaipėda', label: 'Klaipėda - Autobusų Stotis', price: 6.0 },
  { id: 'siauliai', name: 'Šiauliai', label: 'Šiauliai - Autobusų Stotis', price: 5.0 },
  { id: 'panevezys', name: 'Panevėžys', label: 'Panevėžys - Autobusų Stotis', price: 4.5 },
  { id: 'alytus', name: 'Alytus', label: 'Alytus - Autobusų Stotis', price: 4.0 },
]

export function getDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id)
}
