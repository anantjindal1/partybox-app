import { useLang } from '../../store/LangContext'
export function LobbyScreen({ isHost, minPlayers, players, onStart, starting }) {
  const { t } = useLang()
  const canStart = isHost && players.length >= minPlayers && !starting

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <div className="rounded-xl border-[1.5px] border-border bg-surfaceElevated p-4">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{t('chHowTo')}</p>
        <p className="text-sm text-textPrimary">
          {t('chHowToBody')}
        </p>
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="min-h-[48px] rounded-xl bg-cerulean text-onCerulean font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {starting ? t('adStarting') : players.length < minPlayers ? t('waitingPlayersN', { n: players.length, max: minPlayers }) : t('startGameArrow')}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostStart')}</p>
      )}
    </div>
  )
}
