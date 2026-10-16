import { useLang } from '../../store/LangContext'
export function SecretWordBanner({ isBhed, secretWord }) {
  const { t, lang } = useLang()
  return (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surfaceMuted border border-emerald text-sm">
      <span className="text-textMuted">{isBhed ? t('bhYouAre') : t('bhYourWord')}</span>
      <span className="font-bold text-emerald">{isBhed ? t('bhTheBhed') : (secretWord?.word?.[lang] ?? secretWord?.word?.en)}</span>
    </div>
  )
}
