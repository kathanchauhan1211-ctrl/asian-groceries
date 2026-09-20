const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const app = getApps()[0];
const db = getFirestore(app, 'indianmarket');

// ── New schema: 3 slots, each with a slides[] array ──────────────────────────
const BANNER_SLOTS = [
  {
    id: 'slot-main',
    slotType: 'hero',
    slotPosition: 'main',
    order: 1,
    autoIntervalMs: 5000,
    slides: [
      {
        id: 'slide-ganesh',
        title: 'Ganesh Idols',
        subtitle: 'FESTIVE SEASON',
        tagline: 'Bring home blessings and prosperity today.',
        image: 'https://images.unsplash.com/photo-1563204907-8818c991f807?auto=format&fit=crop&q=80',
        link: '/shop?q=Ganesh',
        bgColor: '#4A2323',
        textColor: '#FFFFFF',
        active: true,
        order: 1,
      },
      {
        id: 'slide-pooja',
        title: 'Pooja Items',
        subtitle: 'PREMIUM SELECTION',
        tagline: 'Everything you need for your daily puja.',
        image: 'https://images.unsplash.com/photo-1609766857753-e3aa3c4e4bfb?auto=format&fit=crop&q=80',
        link: '/shop?q=Pooja',
        bgColor: '#6B2D2D',
        textColor: '#FFFFFF',
        active: true,
        order: 2,
      },
    ],
  },
  {
    id: 'slot-secondary-top',
    slotType: 'small',
    slotPosition: 'secondary_top',
    order: 2,
    autoIntervalMs: 4000,
    slides: [
      {
        id: 'slide-veggies',
        title: 'FRESH VEGGIES',
        subtitle: 'GUARANTEED FRESH',
        image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80',
        link: '/shop?category=Fresh+Vegetables',
        bgColor: '#F59E0B',
        textColor: '#111827',
        active: true,
        order: 1,
      },
      {
        id: 'slide-fruits',
        title: 'TROPICAL FRUITS',
        subtitle: 'FRESHLY SOURCED',
        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80',
        link: '/shop?category=Fruits',
        bgColor: '#D97706',
        textColor: '#FFFFFF',
        active: true,
        order: 2,
      },
    ],
  },
  {
    id: 'slot-secondary-bottom',
    slotType: 'small',
    slotPosition: 'secondary_bottom',
    order: 3,
    autoIntervalMs: 6000,
    slides: [
      {
        id: 'slide-same-day',
        title: 'SAME DAY DELIVERY',
        subtitle: 'IN BERLIN',
        tagline: 'Free Delivery from €39.99',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80',
        link: '/shop',
        bgColor: '#10B981',
        textColor: '#FFFFFF',
        active: true,
        order: 1,
      },
      {
        id: 'slide-intercity',
        title: 'INTER-CITY DELIVERY',
        subtitle: 'ACROSS LITHUANIA',
        tagline: 'Vilnius, Kaunas, Klaipėda & more.',
        image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80',
        link: '/shop',
        bgColor: '#0D9488',
        textColor: '#FFFFFF',
        active: true,
        order: 2,
      },
    ],
  },
];

async function seed() {
  try {
    // Delete old banner documents first
    const oldSnap = await db.collection('banners').get();
    const deleteBatch = db.batch();
    oldSnap.docs.forEach(d => deleteBatch.delete(d.ref));
    if (!oldSnap.empty) {
      await deleteBatch.commit();
      console.log(`Deleted ${oldSnap.size} old banner document(s).`);
    }

    // Write new slot documents
    const batch = db.batch();
    BANNER_SLOTS.forEach(slot => {
      batch.set(db.collection('banners').doc(slot.id), slot);
    });
    await batch.commit();
    console.log(`Seeded ${BANNER_SLOTS.length} banner slots successfully.`);
    console.log('Slot IDs:', BANNER_SLOTS.map(s => s.id).join(', '));
  } catch (e) {
    console.error('Error seeding banners:', e.message);
  }
}

seed().catch(console.error);
