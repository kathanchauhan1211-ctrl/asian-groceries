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
const dbNamed = getFirestore(app, 'indianmarket');

async function test() {
  try {
    const s2 = await dbNamed.collection('orders').get();
    console.log('indianmarket DB orders:');
    s2.docs.forEach(doc => {
       console.log(doc.id, doc.data().status, doc.data().createdAt?.toDate());
    });
  } catch (e) {
    console.log('indianmarket DB error:', e.message);
  }
}
test().catch(console.error);
