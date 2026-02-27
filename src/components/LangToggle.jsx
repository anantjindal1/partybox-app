import { useLang } from '../store/LangContext'

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
      className="px-3 py-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white text-sm font-semibold transition-colors border border-zinc-700/50"
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'हिंदी' : 'ENG'}
    </button>
  )
}
