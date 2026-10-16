import { useState } from 'react'
import { useLang } from '../../store/LangContext'
import { MAX_SLOTS } from './logic'

// Host-side editor for who is on the wheel: phone players plus name-only
// "dummy" slots for people playing without their phone out.
export function SlotsEditor({ slots, offWheel, minSlots, onRemove, onAddPlayer, onAddDummy }) {
  const { t } = useLang()
  const [name, setName] = useState('')
  const full = slots.length >= MAX_SLOTS

  function addDummy() {
    if (!name.trim()) return
    onAddDummy(name.trim())
    setName('')
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {t('tdOnWheel', { n: slots.length })}
      </p>
      {slots.map(s => (
        <div key={s.id} className="flex items-center justify-between rounded-xl border-[1.5px] border-border bg-surfaceElevated px-4 min-h-[44px]">
          <span className="font-semibold text-textPrimary truncate">
            {s.name}
            {s.dummy && <span className="ml-2 text-xs font-normal text-textMuted">{t('tdNoPhone')}</span>}
          </span>
          <button
            onClick={() => onRemove(s.id)}
            disabled={slots.length <= minSlots}
            className="text-sm text-textMuted hover:text-error disabled:opacity-30"
          >
            {t('removePlayer')}
          </button>
        </div>
      ))}

      {!full && offWheel.map(p => (
        <button
          key={p.id}
          onClick={() => onAddPlayer(p.id)}
          className="flex items-center justify-between rounded-xl border-[1.5px] border-dashed border-border px-4 min-h-[44px] text-textMuted"
        >
          <span className="truncate">{p.name}</span>
          <span className="text-sm font-semibold text-rose">{t('tdAddBack')}</span>
        </button>
      ))}

      {!full && (
        <>
          <p className="text-xs text-textMuted mt-2">{t('tdDummyHint')}</p>
          <div className="flex gap-2">
            <input
              value={name}
              maxLength={14}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDummy()}
              placeholder={t('tdName')}
              className="flex-1 min-w-0 min-h-[44px] rounded-xl border-[1.5px] border-border bg-surfaceElevated px-3 text-textPrimary focus:outline-none focus:border-rose"
            />
            <button
              onClick={addDummy}
              disabled={!name.trim()}
              className="min-h-[44px] px-4 rounded-xl bg-rose text-onRose font-bold disabled:opacity-40"
            >
              {t('tdAddPlayer')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
