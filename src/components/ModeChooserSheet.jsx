import { getGameIcon } from './gameIcons'

/**
 * Small sheet for games that ship both a single-device and an online mode.
 * Reusable — any future backlog game that needs the same choice can pass
 * its own slugs/title/description in.
 */
export function ModeChooserSheet({ game, onChooseOffline, onChooseOnline, onClose }) {
  if (!game) return null
  const Icon = getGameIcon(game.offlineSlug)

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} aria-hidden />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surfaceElevated border-t border-border rounded-t-3xl px-5 pt-5 pb-8 max-w-lg mx-auto shadow-card">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full border-[1.5px] border-border flex items-center justify-center text-textPrimary flex-shrink-0">
            <Icon width="20" height="20" />
          </div>
          <p className="text-textPrimary text-lg font-bold">{game.title}</p>
        </div>

        <p className="text-textMuted text-sm font-medium mb-3 uppercase tracking-wider">How do you want to play?</p>

        <div className="space-y-3">
          <button
            onClick={onChooseOffline}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border text-left hover:border-borderMuted transition-colors"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted flex-shrink-0">
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <path d="M11 18h2" />
            </svg>
            <div>
              <p className="text-textPrimary font-bold">Single Device</p>
              <p className="text-textMuted text-sm">Pass one phone around — everyone votes out loud</p>
            </div>
          </button>

          <button
            onClick={onChooseOnline}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border text-left hover:border-borderMuted transition-colors"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted flex-shrink-0">
              <path d="M4 10a12 12 0 0116 0" /><path d="M7.5 13.5a7.5 7.5 0 019 0" />
              <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            <div>
              <p className="text-textPrimary font-bold">Online Room</p>
              <p className="text-textMuted text-sm">Everyone joins from their own phone, votes anonymously</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full text-textMuted hover:text-textSecondary text-sm font-medium py-2 transition-colors"
        >
          Back
        </button>
      </div>
    </>
  )
}
