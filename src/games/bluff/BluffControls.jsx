import { useState } from 'react'
import { RANKS } from '../../multiplayer/deck'
import { useLang } from '../../store/LangContext'

export function BluffControls({
  isMyTurn,
  currentTurnName,
  roundOpen,
  amLatestHandOwner,
  selectedCardIds,
  onOpenRound,
  onAdd,
  onPass,
  onChallenge
}) {
  const { t } = useLang()
  const [claimedRank, setClaimedRank] = useState(null)

  if (!isMyTurn) {
    return <p className="text-center text-textMuted text-sm py-2">{t('waitingToPlay', { name: currentTurnName })}</p>
  }

  const cardCountValid = selectedCardIds.length >= 1

  // State 1: no round open — must open with a rank + cards.
  if (!roundOpen) {
    const canOpen = cardCountValid && !!claimedRank

    function handleOpenRound() {
      onOpenRound(selectedCardIds, claimedRank)
      setClaimedRank(null)
    }

    return (
      <div className="flex flex-col gap-3 pb-2">
        <div>
          <p className="text-xs text-textMuted uppercase tracking-wider mb-1.5 text-center">{t('bClaimRank')}</p>
          <div className="grid grid-cols-7 gap-1.5">
            {RANKS.map(rank => (
              <button
                key={rank}
                onClick={() => setClaimedRank(rank)}
                className={`min-h-[36px] rounded-lg border-[1.5px] text-sm font-bold transition-colors ${
                  claimedRank === rank
                    ? 'bg-indigo text-onIndigo border-indigo'
                    : 'bg-surfaceElevated text-textPrimary border-border'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleOpenRound}
          disabled={!canOpen}
          className="min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selectedCardIds.length === 0 ? t('bOpenRound') : selectedCardIds.length === 1 ? t('bOpenRoundOne') : t('bOpenRoundN', { n: selectedCardIds.length })}
        </button>
      </div>
    )
  }

  function handleAdd() {
    onAdd(selectedCardIds)
  }

  // State 3: round wrapped back to the latest-hand owner — Pass (burn) or Add only.
  if (amLatestHandOwner) {
    return (
      <div className="flex gap-3 pb-2">
        <button
          onClick={onPass}
          className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-bold"
        >
          {t('bPassBurn')}
        </button>
        <button
          onClick={handleAdd}
          disabled={!cardCountValid}
          className="flex-1 min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selectedCardIds.length === 0 ? t('bAdd') : selectedCardIds.length === 1 ? t('bAddOne') : t('bAddN', { n: selectedCardIds.length })}
        </button>
      </div>
    )
  }

  // State 2: round open, not the latest-hand owner — Pass / Add / Challenge.
  return (
    <div className="flex flex-col gap-3 pb-2">
      <button
        onClick={handleAdd}
        disabled={!cardCountValid}
        className="min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {selectedCardIds.length === 0 ? t('bAdd') : selectedCardIds.length === 1 ? t('bAddOne') : t('bAddN', { n: selectedCardIds.length })}
      </button>
      <div className="flex gap-3">
        <button
          onClick={onPass}
          className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-bold"
        >
          {t('tPass')}
        </button>
        <button
          onClick={onChallenge}
          className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-error text-error font-bold"
        >
          {t('bCallBluff')}
        </button>
      </div>
    </div>
  )
}
