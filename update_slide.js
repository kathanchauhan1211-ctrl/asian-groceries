const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = getFirestore('indianmarket');

async function updateSlide() {
  try {
    const slidesRef = db.collection('slides');
    const snapshot = await slidesRef.get();
    
    let updated = false;
    snapshot.forEach(async (doc) => {
      const data = doc.data();
      if (data.brand === 'TRS' || data.label === 'Lentils & Pulses') {
        console.log(`Found TRS slide with ID: ${doc.id}`);
        await slidesRef.doc(doc.id).update({
          img: '/images/indian-market-slider.jpg',
          brand: 'Indian Market',
          label: '',
          headline: '',
          sub: '',
          cta: '',
          href: '/shop',
        });
        console.log('Slide updated successfully!');
        updated = true;
      }
    });

    if (!updated) {
      console.log('Could not find TRS slide to update.');
    }
  } catch (error) {
    console.error('Error updating slide:', error);
  }
}

updateSlide();
