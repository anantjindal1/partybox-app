import { MagnifyingGlassIcon } from '../../components/gameIcons'
import { useLang } from '../../store/LangContext'

const REASON_TEXT = {
  wrong_person: 'bhWrongPerson',
  tie: 'bhTie',
  guessed_correctly: 'bhGuessedRight',
  guessed_wrong: 'bhGuessedWrong'
}

export function ResultsScreen({ winnerTeam, bhedPlayer, secretWord, reason, isHost, onRematch, onHome }) {
  const { t, lang } = useLang()
  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-emerald text-emerald flex items-center justify-center">
          <MagnifyingGlassIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
          {winnerTeam === 'bhed' ? t('bhBhedWins') : t('bhVillagersWin')}
        </p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {t('bhWasTheBhed', { name: bhedPlayer?.name ?? t('someone') })}
        </p>
        <p className="text-sm text-textMuted">{REASON_TEXT[reason] ? t(REASON_TEXT[reason]) : ''}</p>
      </div>

      <div className="bg-surfaceElevated border border-border/60 rounded-xl p-4 text-center">
        <p className="text-xs text-textMuted uppercase tracking-wider mb-1">{t('bhSecretWas')}</p>
        <p className="text-lg font-bold font-display text-textPrimary">{secretWord?.word?.[lang] ?? secretWord?.word?.en}</p>
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-emerald text-onEmerald font-bold">
            {t('rematchArrow')}
          </button>
        ) : null}
        <button onClick={onHome} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('home')}
        </button>
      </div>
    </div>
  )
}
