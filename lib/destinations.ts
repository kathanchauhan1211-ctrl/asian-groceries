/**
 * lib/destinations.ts
 *
 * Single source of truth for all bus courier transit hubs.
 *
 * Previously this data was duplicated in three separate files:
 *   - components/checkout-form.tsx    (price only)
 *   - components/bus-tracker.tsx      (map coords + ETA)
 *   - components/customer-dashboard.tsx (label + price)
 *
 * Now all components import from here. To add/rename/reprice a destination,
 * edit this file only.
 */

export type Destination = {
  id: string
  name: string           // short city name for map labels
  label: string          // full label shown in dropdowns
  price: number          // delivery fee in EUR
  mapX: number           // SVG map X coordinate (viewBox 0 0 500 420)
  mapY: number           // SVG map Y coordinate
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'kaunas',
    name: 'Kaunas',
    label: 'Kaunas Bus Station - Via Autobusų Stotis Courier',
    price: 4.5,
    mapX: 220,
    mapY: 270,
  },
  {
    id: 'klaipeda',
    name: 'Klaipėda',
    label: 'Klaipėda Bus Station - Via Autobusų Stotis Courier',
    price: 6.0,
    mapX: 55,
    mapY: 195,
  },
  {
    id: 'siauliai',
    name: 'Šiauliai',
    label: 'Šiauliai Bus Station - Via Autobusų Stotis Courier',
    price: 5.0,
    mapX: 160,
    mapY: 115,
  },
  {
    id: 'panevezys',
    name: 'Panevėžys',
    label: 'Panevėžys Bus Station - Via Autobusų Stotis Courier',
    price: 4.5,
    mapX: 255,
    mapY: 145,
  },
  {
    id: 'alytus',
    name: 'Alytus',
    label: 'Alytus Bus Station - Via Autobusų Stotis Courier',
    price: 4.0,
    mapX: 255,
    mapY: 340,
  },
]

/** Quick lookup by id — returns undefined if not found */
export function getDestinationById(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id)
}
