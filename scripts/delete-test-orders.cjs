/**
 * Deletes all test orders created during the testing session.
 */
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

const keyPath = path.resolve(__dirname, '..', 'asian-groceries-c1b58-firebase-adminsdk-fbsvc-f3372efadf.json')
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))

const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app, 'indianmarket')

async function deleteTestData() {
  console.log('🔍 Searching for test orders to delete...')
  const testEmails = ['testorder@test.com', 'testorder2@test.com', 'testorder3@test.com']
  let totalDeleted = 0

  for (const email of testEmails) {
    const snap = await db.collection('orders').where('customerEmail', '==', email).get()
    if (snap.empty) { console.log(`  No orders for ${email}`); continue }
    const batch = db.batch()
    snap.docs.forEach(doc => {
      console.log(`  🗑️  Deleting: ${doc.data().ticketNumber ?? doc.id}`)
      batch.delete(doc.ref)
    })
    await batch.commit()
    totalDeleted += snap.size
    console.log(`  ✅ Deleted ${snap.size} order(s) for ${email}`)
  }

  if (totalDeleted === 0) {
    console.log('\n✅ Firestore is already clean — no test orders were ever written (all order attempts failed at API level before reaching Firestore).')
  } else {
    console.log(`\n✅ Done. Deleted ${totalDeleted} test order(s).`)
  }
  process.exit(0)
}

deleteTestData().catch(err => { console.error('Error:', err.message); process.exit(1) })
