import { useLang } from '../../store/LangContext'
import { SETTINGS } from './prompts'

function Choice({ selected, onClick, title, hint }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] rounded-xl border-[1.5px] px-4 py-2 text-left transition-colors ${
        selected ? 'bg-rose text-onRose border-rose' : 'bg-surfaceElevated text-textPrimary border-border hover:border-rose/50'
      }`}
    >
      <span className="block font-semibold">{title}</span>
      {hint && <span className={`block text-xs ${selected ? 'opacity-80' : 'text-textMuted'}`}>{hint}</span>}
    </button>
  )
}

const SETTING_KEY = { office: 'tdOffice', friends: 'tdFriends' }

export function SetupOptions({ setting, setSetting, spinMode, setSpinMode }) {
  const { t } = useLang()
  return (
    <>
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{t('tdSetting')}</p>
        <div className="grid grid-cols-2 gap-2">
          {SETTINGS.map(s => (
            <Choice key={s} selected={setting === s} onClick={() => setSetting(s)} title={t(SETTING_KEY[s])} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{t('tdSpinMode')}</p>
        <div className="grid grid-cols-1 gap-2">
          <Choice
            selected={spinMode === 'random'}
            onClick={() => setSpinMode('random')}
            title={t('tdSpinRandom')}
            hint={t('tdSpinRandomHint')}
          />
          <Choice
            selected={spinMode === 'cycle'}
            onClick={() => setSpinMode('cycle')}
            title={t('tdSpinCycle')}
            hint={t('tdSpinCycleHint')}
          />
        </div>
      </div>
    </>
  )
}
