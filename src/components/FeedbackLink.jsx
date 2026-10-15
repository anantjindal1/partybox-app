import { openFeedback } from '../lib/feedback'
import { useLang } from '../store/LangContext'

export default function FeedbackLink({ game, roomCode, label, className = '' }) {
  const { t } = useLang()
  return (
    <button
      type="button"
      onClick={() => openFeedback({ game, roomCode })}
      className={`text-xs text-textMuted hover:text-textPrimary underline min-h-[44px] ${className}`}
    >
      {label ?? t('sendFeedback')}
    </button>
  )
}
