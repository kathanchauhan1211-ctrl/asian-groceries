// ── Types (open strings so any Firestore value is accepted) ──────────────────
export type Origin   = string
export type Category = string
export type Diet     = string
export type Stock    = 'In Stock' | 'Low Stock' | 'Out of Stock'

export type Variant = {
  label: string
  size?: string
  price: number
  weightKg?: number  // optional — admin-portal variants don't have this
}

export type Product = {
  id: string
  name: string
  brand?: string
  tagline: string
  description?: string
  image: string
  category: Category
  origin: Origin
  unit?: string
  diet: Diet[]
  dietary?: Diet[]   // alias used by admin portal
  stock: Stock
  stockCount?: number
  variants: Variant[]
  bestseller?: boolean
  price?: number
}

// ORIGIN_FLAG — falls back to a globe emoji for any unknown origin
const KNOWN_FLAGS: Record<string, string> = {
  'India':     '🇮🇳',
  'Pakistan':  '🇵🇰',
  'Sri Lanka': '🇱🇰',
}
export const ORIGIN_FLAG = new Proxy(KNOWN_FLAGS, {
  get: (target, key: string) => target[key] ?? '🌍',
})

// ─── CANONICAL category grouping (single source of truth for ALL components) ──
// Display label → array of raw Firestore category string values
// Add new groups here; all filter dropdowns and category bars import this.
export type CategoryGroup = {
  label:  string        // what the user sees in the UI
  icon:   string        // emoji icon
  match:  Category[]    // raw DB category strings that belong to this group
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { label: 'Wheat & Chapati Flour', icon: '🌾', match: ['Rice & Atta', 'Atta & Flour'] },
  { label: 'Basmati Rice',          icon: '🍚', match: ['Rice & Grains', 'Basmati Rice'] },
  { label: 'Lentils & Pulses',      icon: '🫘', match: ['Lentils & Pulses', 'Dal & Pulses'] },
  { label: 'Spices & Masala',       icon: '🌶️', match: ['Spices', 'Masala', 'Condiments'] },
  { label: 'Instant & Ready Meals', icon: '🍱', match: ['Ready Meals', 'Instant Food'] },
  { label: 'Sweets',                icon: '🍮', match: ['Sweets', 'Mithai'] },
  { label: 'Savoury Snacks',        icon: '🥨', match: ['Snacks', 'Savoury'] },
  { label: 'Pickles & Sauces',      icon: '🫙', match: ['Pickles', 'Sauces', 'Condiments'] },
  { label: 'Beverages & Tea',       icon: '🍵', match: ['Tea & Drinks', 'Beverages', 'Drinks'] },
  { label: 'Frozen Foods',          icon: '❄️',  match: ['Frozen Foods', 'Frozen'] },
]

// Flat list of all raw DB categories (derived — do not edit manually)
export const CATEGORIES: Category[] = Array.from(
  new Set(CATEGORY_GROUPS.flatMap(g => g.match))
)

// Find which group a raw product category belongs to
export function getCategoryGroup(rawCategory: Category): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find(g => g.match.includes(rawCategory))
}

// ─── Canonical origin + dietary filter options ────────────────────────────────
export const ORIGINS = [
  { label: 'All',       code: 'GLOBAL' },
  { label: 'India',     code: 'IN' },
  { label: 'Pakistan',  code: 'PK' },
  { label: 'Sri Lanka', code: 'LK' },
] as const

export const DIETS: Diet[] = ['Halal', 'Vegetarian', 'Vegan']
export const STOCKS: Exclude<Stock, 'Out of Stock'>[] = ['In Stock', 'Low Stock']

export const PRODUCTS: Product[] = [
  {
    id: 'basmati-rice',
    name: 'INDIAN SELLA 1121 ALI KHAN BASMATI RICE 5kg',
    tagline: 'Premium extra long grain parboiled rice, unmatched aroma',
    image: '/products/basmati-rice.png',
    category: 'Rice & Grains',
    origin: 'India',
    diet: ['Vegetarian', 'Vegan'],
    stock: 'Low Stock', // "Low Stock / 3 Bags Left" alert
    bestseller: true,
    variants: [
      { label: '5 kg Bag', price: 21.78, weightKg: 5.0 },
      { label: '10 kg Bag', price: 42.00, weightKg: 10.0 },
    ],
  },
  {
    id: 'ashirvad-atta',
    name: 'ASHIRVAD ATTA Miltai 5kg',
    tagline: 'Authentic stone-ground whole wheat flour for soft rotis',
    image: '/products/ashirvad-atta.png',
    category: 'Rice & Grains',
    origin: 'India',
    diet: ['Vegetarian', 'Vegan'],
    stock: 'In Stock',
    variants: [
      { label: '5 kg Bag', price: 10.63, weightKg: 5.0 },
    ],
  },
  {
    id: 'everest-spices',
    name: 'Everest Tikhalal Spices',
    tagline: 'Fine ground hot red chilli powder of premium quality',
    image: '/products/everest-spices.png',
    category: 'Spices',
    origin: 'India',
    diet: ['Vegetarian', 'Vegan'],
    stock: 'Low Stock', // 2 items remaining warning in stream
    bestseller: true,
    variants: [
      { label: '100 g Pack', price: 3.20, weightKg: 0.1 },
      { label: '200 g Pack', price: 5.90, weightKg: 0.2 },
    ],
  },
  {
    id: 'chana-dal',
    name: 'Premium Chana Dal',
    tagline: 'Split baby chickpeas, high in protein and natural taste',
    image: '/products/chana-dal.png',
    category: 'Rice & Grains', // lentils/grains grouped here
    origin: 'India',
    diet: ['Vegetarian', 'Vegan'],
    stock: 'In Stock',
    variants: [
      { label: '1 kg Pack', price: 2.80, weightKg: 1.0 },
      { label: '2 kg Pack', price: 5.20, weightKg: 2.0 },
    ],
  },
  {
    id: 'paneer',
    name: 'Fresh Premium Paneer Block',
    tagline: 'Soft, rich cottage cheese ideal for curry and grilling',
    image: '/products/paneer.png',
    category: 'Frozen Foods',
    origin: 'India',
    diet: ['Vegetarian'],
    stock: 'Low Stock',
    variants: [
      { label: '400 g Pack', price: 5.80, weightKg: 0.4 },
    ],
  },
  {
    id: 'halal-chicken',
    name: 'Halal Chicken Curry Cut',
    tagline: 'Premium quality tender cuts, clean and ready to cook',
    image: '/products/halal-chicken.png',
    category: 'Frozen Foods',
    origin: 'Pakistan',
    diet: ['Halal'],
    stock: 'In Stock',
    variants: [
      { label: '1 kg Bag', price: 12.50, weightKg: 1.0 },
    ],
  },
  {
    id: 'ceylon-tea',
    name: 'Ceylon Premium Loose Leaf Black Tea',
    tagline: 'Authentic bold tea from the high estates of Sri Lanka',
    image: '/products/ceylon-tea.png',
    category: 'Tea & Drinks',
    origin: 'Sri Lanka',
    diet: ['Vegetarian', 'Vegan'],
    stock: 'In Stock',
    variants: [
      { label: '500 g Box', price: 10.50, weightKg: 0.5 },
    ],
  },
  {
    id: 'gulab-jamun',
    name: 'Gulab Jamun Tin',
    tagline: 'Traditional syrup-soaked soft milk solid dumplings',
    image: '/products/gulab-jamun.png',
    category: 'Sweets',
    origin: 'India',
    diet: ['Vegetarian'],
    stock: 'In Stock',
    variants: [
      { label: '1 kg Tin', price: 9.90, weightKg: 1.0 },
    ],
  },
]
