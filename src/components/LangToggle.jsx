import { useLang } from '../store/LangContext'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
      className="px-3 py-2 rounded-xl bg-surfaceElevated text-textSecondary hover:bg-surfaceMuted hover:text-textPrimary text-sm font-semibold transition-colors border border-border/60 min-h-[44px]"
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'हिंदी' : 'ENG'}
    </button>
  )
}
