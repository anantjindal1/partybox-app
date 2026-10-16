import CircularTimer from '../../components/CircularTimer'
import { useLang } from '../../store/LangContext'

export function ArguingScreen({ caseText, lawyerNames, argSlot, turnSeconds, secondsLeft }) {
  const { t } = useLang()
  const speakingName = lawyerNames[argSlot]
  const nextName = lawyerNames[1 - argSlot]

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">{t('adTheCase')}</p>
      <p className="text-lg font-display text-textPrimary text-center leading-snug">
        "{caseText}"
      </p>

      <CircularTimer totalSeconds={turnSeconds} secondsLeft={secondsLeft} size={140} />

      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold font-display text-taupe">🎤 {speakingName}</p>
        <p className="text-xs text-textMuted uppercase tracking-wider">{t('adArguingNow')}</p>
      </div>

      <p className="text-sm text-textMuted text-center">
        {t('adUpNext', { name: nextName })}
      </p>
    </div>
  )
}
