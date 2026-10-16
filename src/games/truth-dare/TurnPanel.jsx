import { useLang } from '../../store/LangContext'

// The picked player's step after the needle stops: choose Truth/Dare, then
// read the prompt aloud. `canAct` is false for phones that only watch.
export function TurnPanel({ name, isMe, type, prompt, canAct, onChoose, onSkip, onDone }) {
  const { t, lang } = useLang()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-lg font-black font-display text-textPrimary">{t('tdTurn', { name })}</p>

      {!type && (
        canAct ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChoose('truth')}
              className="min-h-[64px] rounded-2xl bg-rose text-onRose font-black text-xl"
            >
              {t('tdTruth')}
            </button>
            <button
              onClick={() => onChoose('dare')}
              className="min-h-[64px] rounded-2xl border-[2px] border-rose text-rose font-black text-xl"
            >
              {t('tdDare')}
            </button>
          </div>
        ) : (
          <p className="text-center text-sm text-textMuted">{isMe ? t('tdTellHost') : t('tdChoosing', { name })}</p>
        )
      )}

      {type && (
        <>
          <div className="bg-surfaceElevated border-[1.5px] border-rose rounded-2xl p-6 text-center">
            <p className="text-xs font-semibold text-rose uppercase tracking-wider mb-2">
              {t(type === 'truth' ? 'tdTruth' : 'tdDare')}
            </p>
            <p className="text-xl font-bold font-display text-textPrimary leading-snug">
              {prompt?.[lang] ?? prompt?.en}
            </p>
          </div>
          {canAct && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onSkip}
                className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textMuted font-semibold"
              >
                {t('tdSkip')}
              </button>
              <button onClick={onDone} className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold">
                {t('tdDone')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
