'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
// Import English synchronously so server & client first-render see the same
// dictionary — prevents the hydration mismatch where t() returns the key on
// the server but the translated string on the client.
import enDict from '@/messages/en.json'

type Dictionary = Record<string, any>

// Queue for strings that need translation (module-level to avoid setState during render)
const globalQueue = new Set<string>()
let debounceTimer: NodeJS.Timeout | null = null

const TranslationContext = createContext<{
  lang: string
  setLang: (lang: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
  td: (text: string | null | undefined) => string
} | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('English')
  // Initialise with English already loaded — identical on SSR and first hydration
  const [dict, setDict] = useState<Dictionary>(enDict as Dictionary)
  
  // Dynamic translations cache: Map<lang_text, translatedText>
  const [dynamicCache, setDynamicCache] = useState<Record<string, string>>({})

  // On mount only: read saved language preference from localStorage and cache
  useEffect(() => {
    const saved = localStorage.getItem('ag_lang')
    if (saved && saved !== 'English') {
      setLangState(saved)
    }
    
    // Load dynamic cache from localStorage
    try {
      const savedCache = localStorage.getItem('ag_dynamic_translations')
      if (savedCache) {
        setDynamicCache(JSON.parse(savedCache))
      }
    } catch (e) {
      console.warn('Failed to load dynamic translation cache', e)
    }
  }, [])

  // Whenever language changes (user action), lazily load the right dictionary
  useEffect(() => {
    if (lang === 'English') {
      setDict(enDict as Dictionary)
      localStorage.setItem('ag_lang', lang)
      return
    }
    ;(async () => {
      try {
        let module
        switch (lang) {
          case 'Hindi':      module = await import('@/messages/hi.json'); break
          case 'Lithuanian': module = await import('@/messages/lt.json'); break
          case 'Russian':    module = await import('@/messages/ru.json'); break
          default:           module = await import('@/messages/en.json'); break
        }
        setDict(module.default || module)
        localStorage.setItem('ag_lang', lang)
      } catch (err) {
        console.error('Failed to load dictionary:', err)
      }
    })()
  }, [lang])

  const setLang = (newLang: string) => setLangState(newLang)

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let val: any = dict
    for (const k of keys) {
      if (val == null) break
      val = val[k]
    }
    if (typeof val !== 'string') return key
    if (!params) return val
    let out = val
    for (const [k, v] of Object.entries(params)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
    return out
  }

  // Reactive dynamic translation
  const td = (text: string | null | undefined): string => {
    if (!text || text.trim() === '') return text || ''
    if (lang === 'English') return text

    const cacheKey = `${lang}_${text}`
    if (dynamicCache[cacheKey]) {
      return dynamicCache[cacheKey]
    }

    if (!globalQueue.has(text)) {
      globalQueue.add(text)
      
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        if (globalQueue.size === 0) return
        const textsToTranslate = Array.from(globalQueue)
        globalQueue.clear()
        
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: textsToTranslate, targetLang: lang })
          })
          
          if (!res.ok) throw new Error('Translation failed')
          
          const { translations } = await res.json()
          if (translations && Array.isArray(translations)) {
            setDynamicCache(prev => {
              const next = { ...prev }
              textsToTranslate.forEach((t, i) => {
                if (translations[i]) next[`${lang}_${t}`] = translations[i]
              })
              localStorage.setItem('ag_dynamic_translations', JSON.stringify(next))
              return next
            })
          }
        } catch (err) {
          console.error('Dynamic translation error:', err)
        }
      }, 300) // 300ms debounce
    }
    
    return text
  }

  return (
    <TranslationContext.Provider value={{ lang, setLang, t, td }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslation must be used within a TranslationProvider')
  return ctx
}
