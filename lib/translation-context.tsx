'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Dictionary = Record<string, any>

const TranslationContext = createContext<{
  lang: string
  setLang: (lang: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
} | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState('English')
  const [dict, setDict] = useState<Dictionary>({})

  useEffect(() => {
    // Check local storage for saved language preference
    const saved = localStorage.getItem('ag_lang')
    if (saved) {
      setLang(saved)
    }
  }, [])

  useEffect(() => {
    // Load the correct dictionary whenever language changes
    async function loadDictionary() {
      try {
        let module
        switch (lang) {
          case 'Hindi':
            module = await import('@/messages/hi.json')
            break
          case 'Lithuanian':
            module = await import('@/messages/lt.json')
            break
          case 'Russian':
            module = await import('@/messages/ru.json')
            break
          case 'English':
          default:
            module = await import('@/messages/en.json')
            break
        }
        setDict(module.default || module)
        localStorage.setItem('ag_lang', lang)
      } catch (err) {
        console.error('Failed to load dictionary:', err)
      }
    }
    loadDictionary()
  }, [lang])

  // Simple string interpolation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let val: any = dict
    for (const k of keys) {
      if (!val) break
      val = val[k]
    }
    if (typeof val !== 'string') return key

    if (params) {
      let interpolated = val
      for (const [k, v] of Object.entries(params)) {
        interpolated = interpolated.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
      return interpolated
    }
    return val
  }

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
