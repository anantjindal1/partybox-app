function TeamPanel({ team, colorClasses, players, teamIds, spymasterId, myId, onJoin, onBecomeSpymaster }) {
  const members = players.filter(p => teamIds.includes(p.id))
  return (
    <div className={`rounded-2xl border-[1.5px] p-4 flex flex-col gap-3 ${colorClasses.border} ${colorClasses.bg}`}>
      <p className={`text-sm font-bold uppercase tracking-wider ${colorClasses.text}`}>{team} team</p>
      <div className="flex flex-col gap-2">
        {members.map(p => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-textPrimary">
              {p.name}{p.id === spymasterId ? ' 🕵️' : ''}
            </span>
            {p.id === myId && (
              <button
                onClick={() => onBecomeSpymaster(team)}
                disabled={spymasterId === myId}
                className={`text-xs font-semibold px-2 py-1 rounded-lg border-[1.5px] disabled:opacity-40 ${colorClasses.border} ${colorClasses.text}`}
              >
                {spymasterId === myId ? 'Spymaster' : 'Become Spymaster'}
              </button>
            )}
          </div>
        ))}
        {members.length === 0 && <p className="text-xs text-textMuted">No one yet</p>}
      </div>
      {!teamIds.includes(myId) && (
        <button
          onClick={() => onJoin(team)}
          className={`min-h-[40px] rounded-xl font-bold text-sm ${colorClasses.solidBg} ${colorClasses.solidText}`}
        >
          Join {team}
        </button>
      )}
    </div>
  )
}

export function LobbyScreen({
  isHost,
  minPlayers,
  players,
  myId,
  teams,
  spymasterIds,
  lang,
  onJoinTeam,
  onBecomeSpymaster,
  onSetLang,
  onStart,
  starting,
}) {
  const redOk = teams.red.length >= 2 && spymasterIds.red && teams.red.includes(spymasterIds.red)
  const blueOk = teams.blue.length >= 2 && spymasterIds.blue && teams.blue.includes(spymasterIds.blue)
  const canStart = isHost && redOk && blueOk && players.length >= minPlayers && !starting

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Word Bank</p>
        <div className="grid grid-cols-2 gap-2">
          {['en', 'hi'].map(code => (
            <button
              key={code}
              onClick={() => isHost && onSetLang(code)}
              disabled={!isHost}
              className={`min-h-[44px] rounded-xl border-[1.5px] font-bold transition-colors disabled:opacity-60 ${
                lang === code
                  ? 'bg-sage text-onSage border-sage'
                  : 'bg-surfaceElevated text-textPrimary border-border'
              }`}
            >
              {code === 'en' ? 'English' : 'हिंदी'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TeamPanel
          team="red"
          colorClasses={{
            border: 'border-maroon', bg: 'bg-maroon/10', text: 'text-maroon',
            solidBg: 'bg-maroon', solidText: 'text-onMaroon',
          }}
          players={players}
          teamIds={teams.red}
          spymasterId={spymasterIds.red}
          myId={myId}
          onJoin={onJoinTeam}
          onBecomeSpymaster={onBecomeSpymaster}
        />
        <TeamPanel
          team="blue"
          colorClasses={{
            border: 'border-cobalt', bg: 'bg-cobalt/10', text: 'text-cobalt',
            solidBg: 'bg-cobalt', solidText: 'text-onCobalt',
          }}
          players={players}
          teamIds={teams.blue}
          spymasterId={spymasterIds.blue}
          myId={myId}
          onJoin={onJoinTeam}
          onBecomeSpymaster={onBecomeSpymaster}
        />
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="min-h-[48px] rounded-xl bg-sage text-onSage font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {starting
            ? 'Starting...'
            : !redOk || !blueOk
            ? 'Each team needs 2+ players & a spymaster'
            : 'Start Game →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
      )}
    </div>
  )
}
