'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
// Import English synchronously so server & client first-render see the same
// dictionary — prevents the hydration mismatch where t() returns the key on
// the server but the translated string on the client.
import enDict from '@/messages/en.json'

type Dictionary = Record<string, any>

const TranslationContext = createContext<{
  lang: string
  setLang: (lang: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
} | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('English')
  // Initialise with English already loaded — identical on SSR and first hydration
  const [dict, setDict] = useState<Dictionary>(enDict as Dictionary)

  // On mount only: read saved language preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ag_lang')
    if (saved && saved !== 'English') {
      setLangState(saved)
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

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslation must be used within a TranslationProvider')
  return ctx
}
