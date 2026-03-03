import { useLang } from '../store/LangContext'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
      className="px-3 py-2 rounded-xl bg-surfaceElevated text-zinc-300 hover:bg-surfaceMuted hover:text-white text-sm font-semibold transition-colors border border-border/60"
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'हिंदी' : 'ENG'}
    </button>
  )
}
