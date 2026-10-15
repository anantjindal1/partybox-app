import { useState } from 'react'
import { HandRow } from './HandRow'
import { useLang } from '../../store/LangContext'

export function BiddingScreen({
  myHand = [],
  roundNumber,
  totalRounds,
  handSizeThisRound,
  isLastBidder,
  allOthersHaveBid,
  forbiddenBid,
  bidsIn,
  totalPlayers,
  waitingForNames = [],
  onSubmit,
  submitted
}) {
  const { t } = useLang()
  const [selected, setSelected] = useState(null)
  const bidOptions = Array.from({ length: handSizeThisRound + 1 }, (_, i) => i)

  function handleSubmit() {
    if (selected == null || submitted) return
    onSubmit(selected)
  }

  const locked = isLastBidder && !allOthersHaveBid
  const waitingList = waitingForNames.join(', ') || t('theRoom')

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {t('jBidHeader', { n: roundNumber, total: totalRounds, size: handSizeThisRound })}
      </p>

      <HandRow cards={myHand} />

      {submitted ? (
        <p className="text-sm text-textMuted py-4 text-center">{t('jBidLocked', { names: waitingList })}</p>
      ) : locked ? (
        <p className="text-sm text-textMuted py-4 text-center">
          {t('jBidLast', { names: waitingList })}
        </p>
      ) : (
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-textPrimary font-semibold">{t('howManyHands')}</p>
          {isLastBidder && forbiddenBid != null && (
            <p className="text-center text-xs text-error">
              {t('jForbidden', { n: forbiddenBid })}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {bidOptions.map(n => {
              const isForbidden = isLastBidder && forbiddenBid === n
              return (
                <button
                  key={n}
                  onClick={() => !isForbidden && setSelected(n)}
                  disabled={isForbidden}
                  className={`min-w-[44px] min-h-[44px] px-3 rounded-xl border-[1.5px] font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    selected === n
                      ? 'bg-peridot text-onPeridot border-peridot'
                      : 'bg-surfaceElevated text-textPrimary border-border hover:border-peridot/50'
                  }`}
                >
                  {n}
                </button>
              )
            })}
          </div>
          <button
            onClick={handleSubmit}
            disabled={selected == null}
            className="min-h-[44px] rounded-xl bg-peridot text-onPeridot font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('lockInBid')}
          </button>
        </div>
      )}

      <p className="text-sm font-semibold text-textMuted mt-auto pt-3">
        {t('haveBid', { n: bidsIn, total: totalPlayers })}
      </p>
    </div>
  )
}
