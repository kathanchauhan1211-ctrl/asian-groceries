import fs from 'fs'
import path from 'path'

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.GOOGLE_TRANSLATION_API_KEY

if (!API_KEY) {
  console.error("No GOOGLE_TRANSLATION_API_KEY found in .env.local")
  process.exit(1)
}

const LANGUAGES = ['hi', 'lt', 'ru']
const URL = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`

async function translateText(text, targetLang) {
  // Preserve placeholders like {count} by not translating them if possible. 
  // For simplicity, we just send text and replace them if mangled, but Google API usually preserves {word} moderately well, 
  // or we can use `<span class="notranslate">{count}</span>` hack.
  // We'll wrap {vars} in <span translate="no"> to protect them.
  const protectedText = text.replace(/\{([^}]+)\}/g, '<span translate="no">{$1}</span>')

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: protectedText,
      target: targetLang,
      format: 'html'
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  
  let translated = data.data.translations[0].translatedText
  // Unprotect vars
  translated = translated.replace(/<span translate="no">\{([^}]+)\}<\/span>/g, '{$1}')
  
  // Quick fix for html entities returned by google
  translated = translated.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  return translated
}

async function translateObject(obj, targetLang) {
  const result = {}
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      console.log(`Translating [${targetLang}]: ${obj[key]}`)
      result[key] = await translateText(obj[key], targetLang)
    } else if (typeof obj[key] === 'object') {
      result[key] = await translateObject(obj[key], targetLang)
    }
  }
  return result
}

async function main() {
  const enPath = path.resolve('messages/en.json')
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'))

  for (const lang of LANGUAGES) {
    console.log(`\nStarting translation for: ${lang}`)
    const translated = await translateObject(enData, lang)
    fs.writeFileSync(path.resolve(`messages/${lang}.json`), JSON.stringify(translated, null, 2))
    console.log(`Generated messages/${lang}.json`)
  }
}

main().catch(console.error)
