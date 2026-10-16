import { SecretWordBanner } from './SecretWordBanner'
import { useLang } from '../../store/LangContext'

export function ClueRoundScreen({ players, turnOrder, currentTurnIndex, isHost, myId, isBhed, secretWord, onNextPlayer, onMoveToVoting, advancing }) {
  const { t } = useLang()
  const activeId = turnOrder[currentTurnIndex % turnOrder.length]
  const activePlayer = players.find(p => p.id === activeId)
  const round = Math.floor(currentTurnIndex / turnOrder.length) + 1
  const isMyTurn = activeId === myId

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 gap-6 max-w-lg w-full mx-auto text-center">
      <SecretWordBanner isBhed={isBhed} secretWord={secretWord} />
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{t('round')} {round}</p>

      <div className={`w-full rounded-2xl p-8 border-[1.5px] ${isMyTurn ? 'border-emerald bg-emerald/10' : 'border-border bg-surfaceElevated'}`}>
        <span className="text-4xl leading-none">{activePlayer?.avatar ?? '🎮'}</span>
        <p className="text-xl font-bold font-display text-textPrimary mt-3">
          {isMyTurn ? t('bhItsYourTurn') : t('bhPlayersTurn', { name: activePlayer?.name ?? t('player') })}
        </p>
        <p className="text-sm text-textMuted mt-1">
          {isMyTurn ? t('bhSayClue') : t('bhSayWhenTurn')}
        </p>
      </div>

      {isHost ? (
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onNextPlayer}
            disabled={advancing}
            className="min-h-[48px] rounded-xl bg-emerald text-onEmerald font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('bhNextPlayer')}
          </button>
          <button
            onClick={onMoveToVoting}
            disabled={advancing}
            className="min-h-[44px] rounded-xl border-[1.5px] border-emerald text-emerald font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('bhToVoting')}
          </button>
        </div>
      ) : (
        <p className="text-xs text-textMuted">{t('bhHostControls')}</p>
      )}
    </div>
  )
}
