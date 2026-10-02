import { openFeedback } from '../lib/feedback'

export default function FeedbackLink({ game, roomCode, label = 'Send feedback / report a problem', className = '' }) {
  return (
    <button
      type="button"
      onClick={() => openFeedback({ game, roomCode })}
      className={`text-xs text-textMuted hover:text-textPrimary underline min-h-[44px] ${className}`}
    >
      {label}
    </button>
  )
}
