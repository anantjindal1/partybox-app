import { MagnifyingGlassIcon } from '../../components/gameIcons'
import { useLang } from '../../store/LangContext'

export function RoleRevealScreen({ isBhed, secretWord, ackSent, onAck, ackedCount, totalPlayers }) {
  const { t, lang } = useLang()
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 gap-6 text-center max-w-lg w-full mx-auto">
      <div className="w-full bg-surfaceElevated border-[1.5px] border-emerald rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full border-[1.5px] border-emerald text-emerald flex items-center justify-center">
          <MagnifyingGlassIcon width="36" height="36" />
        </div>
        {isBhed ? (
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider mb-1">{t('bhYouAre')}</p>
            <p className="text-2xl font-bold font-display text-textPrimary mb-2">{t('bhTheBhed')}</p>
            <p className="text-sm text-textSecondary leading-relaxed">
              {t('bhBhedDesc')}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider mb-1">{t('bhYourWord')}</p>
            <p className="text-2xl font-bold font-display text-textPrimary mb-2">{secretWord?.word?.[lang] ?? secretWord?.word?.en}</p>
            <p className="text-sm text-textSecondary leading-relaxed">
              {t('bhWordDesc')}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onAck}
        disabled={ackSent}
        className="min-h-[44px] w-full rounded-xl bg-emerald text-onEmerald font-bold disabled:opacity-40 transition-opacity"
      >
        {ackSent ? t('bhWaitingOthers', { n: ackedCount, total: totalPlayers }) : t('gotIt')}
      </button>
    </div>
  )
}
