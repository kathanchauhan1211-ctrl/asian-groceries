const { initializeApp, cert } = require('firebase-admin')
const { getAuth } = require('firebase-admin/auth')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const emailMatch = env.match(/FIREBASE_CLIENT_EMAIL=(.+)/)
const projectMatch = env.match(/FIREBASE_PROJECT_ID=(.+)/)
const keyMatch = env.match(/FIREBASE_PRIVATE_KEY="([\s\S]+?)"/)

if (!keyMatch) { console.error('Cannot read private key'); process.exit(1) }

const serviceAccount = {
  projectId: projectMatch[1].trim(),
  clientEmail: emailMatch[1].trim(),
  privateKey: keyMatch[1].replace(/\\n/g, '\n'),
}

initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth()

auth
  .getUserByEmail('indianmarket@test.com')
  .then(u => auth.updateUser(u.uid, { password: 'IndianMarket@#00' }))
  .then(u => {
    console.log('SUCCESS: Password reset for', u.email, '| uid:', u.uid)
    process.exit(0)
  })
  .catch(e => {
    console.error('FAILED:', e.message)
    process.exit(1)
  })
