import { useLang } from '../../store/LangContext'
export function DetectingScreen({
  confessionText,
  confessionIndex,
  totalConfessions,
  canVote,
  suspects,
  onVote,
  voted,
  votesIn,
  totalVoters,
  isHost,
  onEndVoting,
}) {
  const { t } = useLang()
  return (
    <div className="flex-1 flex flex-col gap-5 px-4 sm:px-6 py-6 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        {t('chConfessionN', { n: confessionIndex + 1, total: totalConfessions })}
      </p>

      <div className="rounded-2xl p-5 border-[1.5px] bg-cerulean/10 border-cerulean text-center">
        <p className="text-lg font-semibold text-textPrimary italic">"{confessionText}"</p>
      </div>

      {canVote ? (
        <>
          <p className="text-sm text-textMuted text-center">{t('chWhoWrote')}</p>
          <div className="grid grid-cols-2 gap-2">
            {suspects.map(p => (
              <button
                key={p.id}
                onClick={() => onVote(p.id)}
                disabled={voted}
                className="min-h-[52px] rounded-xl border-[1.5px] border-border bg-surfaceElevated font-semibold text-textPrimary disabled:opacity-40 transition-opacity"
              >
                {p.name}
              </button>
            ))}
          </div>
          {voted && <p className="text-center text-textMuted text-sm">{t('chVoteLocked')}</p>}
        </>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('chYours')}</p>
      )}

      <p className="text-center text-xs text-textMuted">{t('chVotesIn', { n: votesIn, total: totalVoters })}</p>

      {isHost && (
        <button
          onClick={onEndVoting}
          className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold"
        >
          {t('chEndVoting')}
        </button>
      )}
    </div>
  )
}
