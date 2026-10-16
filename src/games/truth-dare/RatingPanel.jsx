import { useLang } from '../../store/LangContext'
import { RATINGS } from './logic'

// Ratings stay hidden while open: everyone sees only how many are in.
export function RatingPanel({ turn, type, isTurnPlayer, canRate, myRating, count, total, isHost, onRate, onClose }) {
  const { t } = useLang()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-lg font-black font-display text-textPrimary">
        {t(type === 'dare' ? 'tdRateDare' : 'tdRateTruth', { name: turn.name })}
      </p>

      {isTurnPlayer && <p className="text-center text-sm text-textMuted">{t('tdBeingRated')}</p>}

      {canRate && myRating == null && (
        <div className="grid grid-cols-5 gap-2">
          {RATINGS.map(r => (
            <button
              key={r.value}
              onClick={() => onRate(r.value)}
              className="min-h-[64px] rounded-xl border-[1.5px] border-rose bg-surfaceElevated flex flex-col items-center justify-center gap-0.5 active:scale-95"
            >
              <span className="text-lg font-black text-rose">{r.value}</span>
              <span className="text-[11px] font-semibold text-textPrimary leading-tight text-center">{t(r.key)}</span>
            </button>
          ))}
        </div>
      )}
      {canRate && myRating != null && (
        <p className="text-center text-sm text-textMuted">{t('tdYouRated', { key: t(RATINGS.find(r => r.value === myRating).key) })}</p>
      )}

      <p className="text-center text-xs font-semibold text-textMuted uppercase tracking-wider">
        {t('tdRatingsIn', { n: count, total })}
      </p>

      {isHost && (
        <button onClick={onClose} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('tdCloseRating')}
        </button>
      )}
    </div>
  )
}
