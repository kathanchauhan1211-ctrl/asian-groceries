import { NextResponse } from 'next/server'

const LANG_CODE_MAP: Record<string, string> = {
  'Lithuanian': 'lt',
  'Russian': 'ru',
  'Hindi': 'hi',
  'English': 'en'
}

// ─── Domain Glossary ──────────────────────────────────────────────────────────
// Machine translation struggles with "Hinglish" grocery terms. 
// We preprocess strings to standard English BEFORE sending to the MT engine 
// so it can accurately translate to the target language (ru, lt).
const GROCERY_GLOSSARY: Record<string, string> = {
  // Spices & Herbs
  'mirchi': 'chili',
  'mirch': 'chili',
  'haldi': 'turmeric',
  'jeera': 'cumin',
  'dhaniya': 'coriander',
  'garam masala': 'mixed spice blend',
  'masala': 'spice blend',
  'elaichi': 'cardamom',
  'laung': 'clove',
  'dalchini': 'cinnamon',
  'saunf': 'fennel',
  'methi': 'fenugreek',
  'ajwain': 'carom seeds',
  'tej patta': 'bay leaf',
  'sarson': 'mustard seeds',
  'rai': 'mustard seeds',
  'hing': 'asafoetida',
  'kasoori methi': 'dried fenugreek leaves',
  'amchur': 'mango powder',
  'jaiphal': 'nutmeg',
  'javitri': 'mace',
  'kalonji': 'nigella seeds',
  'pudina': 'mint',
  'tulsi': 'holy basil',
  'kari patta': 'curry leaves',
  'adrak': 'ginger',
  'lasun': 'garlic',
  
  // Lentils & Pulses
  'dal': 'lentils',
  'chana': 'chickpeas',
  'moong': 'mung bean',
  'masoor': 'red lentil',
  'toor': 'pigeon pea',
  'arhar': 'pigeon pea',
  'urad': 'black gram',
  'rajma': 'kidney beans',
  'chole': 'chickpeas',
  'lobia': 'black-eyed peas',
  'matar': 'peas',
  'kabuli chana': 'white chickpeas',
  
  // Flours & Grains
  'atta': 'wheat flour',
  'maida': 'refined flour',
  'besan': 'gram flour',
  'suji': 'semolina',
  'sooji': 'semolina',
  'rawa': 'semolina',
  'chawal': 'rice',
  'poha': 'flattened rice',
  'sabudana': 'tapioca pearls',
  'ragi': 'finger millet',
  'bajra': 'pearl millet',
  'jowar': 'sorghum',
  'dalia': 'broken wheat',
  
  // Dairy & Fats
  'paneer': 'cottage cheese',
  'ghee': 'clarified butter',
  'dahi': 'yogurt',
  'malai': 'cream',
  'makhan': 'butter',
  'khoya': 'milk solids',
  'mawa': 'milk solids',
  
  // Nuts & Sweets
  'badam': 'almond',
  'kaju': 'cashew',
  'pista': 'pistachio',
  'kishmish': 'raisin',
  'akhrot': 'walnut',
  'makhana': 'fox nuts',
  'gud': 'jaggery',
  'gur': 'jaggery',
  'shakkar': 'sugar',
  'cheeni': 'sugar',
  
  // Misc
  'tel': 'oil',
  'namak': 'salt',
  'pani': 'water',
  'imli': 'tamarind',
  'nimbu': 'lemon',
  'amla': 'gooseberry',
  
  // Note: Proper nouns like "Bhujia", "Bhel", "Deggi", "Aashirvaad", "MDH" are intentionally omitted 
  // so the MT engine treats them as untranslatable proper nouns.
}

function applyGlossary(text: string): string {
  let processed = text
  for (const [hindi, english] of Object.entries(GROCERY_GLOSSARY)) {
    // Case-insensitive replacement, matching whole words only
    const regex = new RegExp(`\\b${hindi}\\b`, 'gi')
    processed = processed.replace(regex, (match) => {
      // Preserve original casing of the first letter if possible
      if (match[0] === match[0].toUpperCase()) {
        return english.charAt(0).toUpperCase() + english.slice(1)
      }
      return english
    })
  }
  return processed
}

export async function POST(req: Request) {
  let texts: string[] = []
  let code = 'en'
  
  try {
    const body = await req.json()
    texts = body.texts
    
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ translations: [] })
    }

    code = LANG_CODE_MAP[body.targetLang] || 'en'
    if (code === 'en') {
      return NextResponse.json({ translations: texts }) // English is default, no translation needed
    }

    const apiUrl = process.env.LIBRETRANSLATE_URL
    
    // If user provided a specific LibreTranslate URL, use it
    if (apiUrl) {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texts,
          source: 'en',
          target: code,
          format: 'text',
          api_key: process.env.LIBRETRANSLATE_API_KEY || ''
        })
      })

      if (!res.ok) throw new Error(`LibreTranslate API responded with status ${res.status}`)

      const data = await res.json()
      let translations: string[] = []
      if (Array.isArray(data.translatedText)) {
        translations = data.translatedText
      } else if (typeof data.translatedText === 'string') {
        translations = [data.translatedText]
      } else if (data.translatedText) {
        translations = Array.from(data.translatedText)
      } else {
        translations = texts.map((t: string) => `${t} [Mock]`)
      }

      return NextResponse.json({ translations })
    }

    // Default to MyMemory API (free, reliable open translation API) 
    // since the public LibreTranslate mirror (argosopentech) is permanently offline.
    const translations = await Promise.all(texts.map(async (textString: string) => {
      try {
        // Pre-process Hinglish terms to standard English for the MT engine
        const preprocessedText = applyGlossary(textString)
        
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(preprocessedText)}&langpair=en|${code}`)
        if (res.ok) {
          const data = await res.json()
          return data.responseData?.translatedText || textString
        }
      } catch (e) {
        console.error('MyMemory API error:', e)
      }
      return textString // Fallback to original if translation fails for this string
    }))

    return NextResponse.json({ translations })

  } catch (error) {
    console.error('Error in translate API:', error)
    // Fallback on error to prevent breaking UI
    const mockTranslations = texts.map((t: any) => typeof t === 'string' && t.trim() ? `${t} [${code}]` : t)
    return NextResponse.json({ translations: mockTranslations })
  }
}
