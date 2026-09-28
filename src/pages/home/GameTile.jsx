import { ACCENT_STYLES } from './gameCatalog'

export default function GameTile({ card, disabled, offlineNotice, onClick }) {
  const accent = ACCENT_STYLES[card.accent]
  const Icon = card.icon
  const ModeIcon = card.modeIcon

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`snap-start shrink-0 w-[150px] sm:w-auto flex flex-col text-left bg-surfaceElevated border-[1.5px] rounded-2xl p-3 transition-colors ${accent.border} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surfaceMuted active:scale-[0.98]'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center ${accent.iconRing}`}>
          <Icon />
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-semibold border-b-[1.5px] pb-0.5 ${accent.tab}`}>
          <ModeIcon />
          {card.modeBadge}
        </span>
      </div>

      <span className="text-sm font-bold text-textPrimary leading-tight line-clamp-2 min-h-[2.5em]">
        {card.title}
      </span>
      <p className="text-textMuted text-xs leading-snug mt-1 line-clamp-2 min-h-[2.5em]">
        {card.description}
      </p>

      <div className="flex items-center justify-between gap-1 mt-3">
        <span className="border border-border rounded-full px-2 py-0.5 text-[11px] text-textMuted whitespace-nowrap">
          {card.playersPill}
        </span>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${accent.cta}`}>
          {card.isOnline ? 'Host' : 'Play'}
        </span>
      </div>

      {offlineNotice && <p className="mt-2 text-[11px] text-textMuted">{offlineNotice}</p>}
    </button>
  )
}
