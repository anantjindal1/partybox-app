import { useLang } from '../../store/LangContext'
export function RevealScreen({ lastResult, players, confessionIndex, totalConfessions, isHost, isLast, onNext, advancing }) {
  const { t } = useLang()
  if (!lastResult) return null
  const { confessionText, authorId, correctGuesserIds, authorPoints } = lastResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? t('player')
  }

  return (
    <div className="flex-1 flex flex-col gap-5 px-4 sm:px-6 py-6 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        {t('chConfessionN', { n: confessionIndex + 1, total: totalConfessions })}
      </p>
      <p className="text-sm text-textMuted text-center italic">"{confessionText}"</p>

      <div className="rounded-2xl p-5 text-center border-[1.5px] bg-cerulean/10 border-cerulean">
        <p className="text-xl font-bold font-display text-cerulean">{t('chWroteThis', { name: nameOf(authorId) })}</p>
      </div>

      <div className="flex flex-col gap-2">
        {correctGuesserIds.length > 0 ? (
          <p className="text-sm text-textPrimary text-center">
            {t('chGuessedRight', { names: correctGuesserIds.map(nameOf).join(', ') })}
          </p>
        ) : (
          <p className="text-sm text-textPrimary text-center">{t('chNobodyRight')}</p>
        )}
        {authorPoints > 0 && (
          <p className="text-sm text-textPrimary text-center">
            {authorPoints === 1 ? t('chFooledOne', { name: nameOf(authorId) }) : t('chFooledN', { name: nameOf(authorId), n: authorPoints })}
          </p>
        )}
      </div>

      {isHost ? (
        <button
          onClick={onNext}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-cerulean text-onCerulean font-bold disabled:opacity-40 transition-opacity"
        >
          {isLast ? t('finalResultsArrow') : t('chNextConfession')}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
