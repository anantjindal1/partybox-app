import { useState } from 'react'
import { useLang } from '../../store/LangContext'

const MAX_LEN = 200

export function ConfessingScreen({ submitted, submittedCount, totalPlayers, onSubmit, isHost, onForceAdvance }) {
  const { t } = useLang()
  const [text, setText] = useState('')

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-12 max-w-lg w-full mx-auto text-center">
        <p className="text-lg font-bold font-display text-textPrimary">{t('chLocked')}</p>
        <p className="text-textMuted text-sm">
          {t('chWaitingN', { n: submittedCount, total: totalPlayers })}
        </p>
        {isHost && submittedCount < totalPlayers && (
          <button
            onClick={onForceAdvance}
            className="min-h-[44px] px-5 rounded-xl border-[1.5px] border-border text-textPrimary font-semibold"
          >
            {t('chStartWithWhat')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-4 px-4 sm:px-6 py-6 max-w-lg w-full mx-auto">
      <p className="text-lg font-bold font-display text-textPrimary text-center">{t('chIOnce')}</p>
      <p className="text-sm text-textMuted text-center">
        {t('chWriteHelp')}
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX_LEN))}
        placeholder={t('chPlaceholder')}
        rows={4}
        className="rounded-xl border-[1.5px] border-border bg-surfaceElevated p-3 text-textPrimary resize-none focus:outline-none focus:border-cerulean"
      />
      <p className="text-xs text-textMuted text-right">{text.length}/{MAX_LEN}</p>
      <button
        onClick={() => onSubmit(text.trim())}
        disabled={text.trim().length === 0}
        className="min-h-[48px] rounded-xl bg-cerulean text-onCerulean font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {t('chSubmit')}
      </button>
    </div>
  )
}
