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
  name: string    // short city name
  label: string   // full label shown in dropdowns
  price: number   // delivery fee in EUR
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'kaunas',
    name: 'Kaunas',
    label: 'Kaunas - Via DPD Courier',
    price: 4.5,
  },
  {
    id: 'klaipeda',
    name: 'Klaipėda',
    label: 'Klaipėda - Via DPD Courier',
    price: 6.0,
  },
  {
    id: 'siauliai',
    name: 'Šiauliai',
    label: 'Šiauliai - Via DPD Courier',
    price: 5.0,
  },
  {
    id: 'panevezys',
    name: 'Panevėžys',
    label: 'Panevėžys - Via DPD Courier',
    price: 4.5,
  },
  {
    id: 'alytus',
    name: 'Alytus',
    label: 'Alytus - Via DPD Courier',
    price: 4.0,
  },
]

/** Quick lookup by id — returns undefined if not found */
export function getDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id)
}
