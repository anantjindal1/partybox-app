import { MaskIcon } from '../../components/gameIcons'
import { useLang } from '../../store/LangContext'

export function ResultsScreen({ winner, isHost, onRematch, onHome }) {
  const { t } = useLang()
  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-indigo text-indigo flex items-center justify-center">
          <MaskIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{t('winner')}</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{winner?.name ?? '—'}</p>
        <p className="text-sm text-textMuted">{t('bWinnerLine')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold">
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
