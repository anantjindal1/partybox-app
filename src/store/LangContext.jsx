import { createContext, useContext, useState } from 'react'
import { STRINGS } from '../i18n/strings'

const LANG_KEY = 'partybox_lang'

function savedLang() {
  try {
    return localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en'
  } catch {
    return 'en'
  }
}

function translate(lang, key, vars) {
  const text = STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (m, name) => vars[name] ?? m) : text
}

// Default lets components render outside the provider (e.g. in tests) in English.
const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (key, vars) => translate('en', key, vars) })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(savedLang)
  const setLang = (next) => setLangState(prev => {
    const value = typeof next === 'function' ? next(prev) : next
    try { localStorage.setItem(LANG_KEY, value) } catch { /* not persisted */ }
    return value
  })
  const t = (key, vars) => translate(lang, key, vars)
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
