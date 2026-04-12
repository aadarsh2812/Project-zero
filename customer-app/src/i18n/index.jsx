import React, { createContext, useContext, useState } from 'react'
import en from './en.js'
import ta from './ta.js'

const langs = { en, ta }
const I18nContext = createContext()

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')

  const t = (key) => langs[lang]?.[key] || langs.en[key] || key

  const switchLang = (l) => {
    setLang(l)
    localStorage.setItem('lang', l)
  }

  return (
    <I18nContext.Provider value={{ t, lang, switchLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

// Language toggle component
export function LangToggle({ style }) {
  const { lang, switchLang } = useI18n()
  return (
    <button
      onClick={() => switchLang(lang === 'en' ? 'ta' : 'en')}
      style={{
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff',
        borderRadius: 20,
        padding: '4px 14px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {lang === 'en' ? 'தமிழ்' : 'English'}
    </button>
  )
}
