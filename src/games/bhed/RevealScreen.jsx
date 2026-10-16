import { SecretWordBanner } from './SecretWordBanner'
import { useLang } from '../../store/LangContext'

export function RevealScreen({ tally, votedOutId, players, actualBhedId, caught, isBhed, secretWord, isHost, onContinue }) {
  const { t } = useLang()
  const votedOutPlayer = players.find(p => p.id === votedOutId)
  const ranked = [...players]
    .filter(p => (tally[p.id] ?? 0) > 0)
    .sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))

  return (
    <div className="flex-1 flex flex-col items-center py-6 gap-5 max-w-lg w-full mx-auto">
      <SecretWordBanner isBhed={isBhed} secretWord={secretWord} />
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{t('bhVoteResults')}</p>

      <div className="flex flex-col gap-1.5 w-full">
        {ranked.map(p => (
          <div key={p.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surfaceElevated border border-border/60">
            <span className="text-sm font-semibold text-textPrimary">{p.avatar} {p.name}</span>
            <span className="text-sm font-bold text-emerald">{tally[p.id]} vote{tally[p.id] === 1 ? '' : 's'}</span>
          </div>
        ))}
        {ranked.length === 0 && (
          <p className="text-center text-textMuted text-sm">{t('bhNobodyVoted')}</p>
        )}
      </div>

      <div className="w-full bg-surfaceElevated border-[1.5px] border-emerald rounded-2xl p-6 text-center">
        {votedOutPlayer ? (
          <p className="text-lg font-bold font-display text-textPrimary">
            {t('bhVotedOut', { name: votedOutPlayer.name })}
          </p>
        ) : (
          <p className="text-lg font-bold font-display text-textPrimary">{t('bhVoteTied')}</p>
        )}
        <p className="text-sm text-textMuted mt-2">
          {caught ? t('bhCaught') : t('bhEvaded')}
        </p>
      </div>

      {isHost ? (
        <button
          onClick={onContinue}
          className="min-h-[44px] w-full rounded-xl bg-emerald text-onEmerald font-bold"
        >
          {t('continueArrow')}
        </button>
      ) : (
        <p className="text-xs text-textMuted">{t('waitingHostContinueDots')}</p>
      )}
    </div>
  )
}
