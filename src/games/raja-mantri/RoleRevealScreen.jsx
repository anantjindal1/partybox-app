import { ROLE_ICON_COMPONENTS, roleLabel, roleDescription } from './roleIcons'

export function RoleRevealScreen({ role, roundCount, currentRound, ackSent, onAck, ackedCount, totalPlayers, t }) {
  const Icon = ROLE_ICON_COMPONENTS[role] ?? ROLE_ICON_COMPONENTS.sipahi

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 gap-6 text-center">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {t('round')} {currentRound} {t('of')} {roundCount}
      </p>

      <div className="w-full max-w-xs bg-surfaceElevated border-[1.5px] border-plum rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full border-[1.5px] border-plum text-plum flex items-center justify-center">
          <Icon width="36" height="36" />
        </div>
        <div>
          <p className="text-xs text-textMuted uppercase tracking-wider mb-1">{t('youAreThe')}</p>
          <p className="text-2xl font-bold font-display text-textPrimary">{roleLabel(role, t)}</p>
        </div>
        <p className="text-sm text-textSecondary leading-relaxed">{roleDescription(role, t)}</p>
      </div>

      <button
        onClick={onAck}
        disabled={ackSent}
        className="min-h-[44px] w-full max-w-xs rounded-xl bg-plum text-onPlum font-bold disabled:opacity-40 transition-opacity"
      >
        {ackSent ? `${t('waitingWithCount')} (${ackedCount}/${totalPlayers})` : t('gotIt')}
      </button>
    </div>
  )
}
