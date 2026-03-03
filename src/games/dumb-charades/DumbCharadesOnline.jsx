import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../store/LangContext'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useDevMode } from '../../hooks/useDevMode'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { trackEvent } from '../../services/analytics'
import { useDCStrings } from './strings'
import { Timer } from './Timer'
import { buildWordQueue } from './wordpacks'
import { findWinners, calcXP } from './scoring'
import { DC } from './theme'

const PREP_SECONDS = 30

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function DumbCharadesOnline({ code }) {
  const { t: tApp, lang } = useLang()
  const t = useDCStrings(lang)
  const { devMode } = useDevMode()

  const {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    clearActions,
    isHost,
    myId,
    players,
    connected,
  } = useOnlineRoom(code)

  const xpAwarded = useRef(false)
  const roomStateRef = useRef(roomState)
  useEffect(() => { roomStateRef.current = roomState }, [roomState])

  const phase = roomState.phase || 'waiting'

  // Derive my team and role
  const myTeam = roomState.teams?.find(tm => tm.actorDeviceId === myId)
  const currentTeamId = roomState.currentTeamId
  const isCurrentActor = myTeam?.id === currentTeamId

  // ─── XP award on game_over ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'game_over' || !myId || xpAwarded.current) return
    xpAwarded.current = true

    const teams = roomState.teams ?? []
    const winners = findWinners(teams)
    const myT = teams.find(tm => tm.actorDeviceId === myId || tm.guesserDeviceIds?.includes(myId))
    const isWinner = myT ? winners.some(w => w.id === myT.id) : false
    const myScore = myT?.score ?? 0
    const xp = calcXP(myScore, isWinner)

    awardXP(xp, room?.roomType).catch(() => {})
    if (room?.roomType === 'ranked') {
      writeGameStats('dumb-charades', { won: isWinner, gamesPlayed: 1 })
    }
    trackEvent('match_completed', {
      game: 'dumb-charades',
      roomType: room?.roomType,
      myScore,
      isWinner,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ─── Host: process incoming actions ──────────────────────────────────────
  useEffect(() => {
    if (!isHost || !actions.length) return

    const rs = roomStateRef.current

    for (const action of actions) {
      if (action.type === 'REPLACE_WORD') {
        const wq = rs.wordQueue ?? []
        const replacementsLeft = (rs.replacementsLeft ?? 3)
        if (replacementsLeft <= 0 || wq.length <= 1) continue
        const [current, ...rest] = wq
        setState({
          ...rs,
          wordQueue: [...rest, current],
          replacementsLeft: replacementsLeft - 1,
        })
        clearActions()
        return
      }

      if (action.type === 'START_ACTING') {
        setState({ ...rs, phase: 'acting' })
        clearActions()
        return
      }

      if (action.type === 'CORRECT') {
        const newUsedWords = [...(rs.usedWords ?? []), rs.wordQueue?.[0]].filter(Boolean)
        setState({
          ...rs,
          usedWords: newUsedWords,
          phase: 'turn_result',
          lastTurnResult: { outcome: 'correct', pointsTo: null },
        })
        clearActions()
        return
      }

      if (action.type === 'TIMER_EXPIRED') {
        const teams = rs.teams ?? []
        const curIdx = teams.findIndex(tm => tm.id === rs.currentTeamId)
        const oppIdx = (curIdx + 1) % teams.length
        const updatedTeams = teams.map((tm, i) =>
          i === oppIdx ? { ...tm, score: tm.score + 1 } : tm
        )
        const settings = rs.settings ?? {}
        const won = updatedTeams[oppIdx].score >= (settings.winPoints ?? 5)
        const newUsedWords = [...(rs.usedWords ?? []), rs.wordQueue?.[0]].filter(Boolean)
        setState({
          ...rs,
          usedWords: newUsedWords,
          teams: updatedTeams,
          phase: won ? 'game_over' : 'turn_result',
          lastTurnResult: { outcome: 'expired', pointsTo: teams[oppIdx].id },
        })
        clearActions()
        return
      }

      if (action.type === 'NEXT_TURN') {
        const teams = rs.teams ?? []
        const curIdx = teams.findIndex(tm => tm.id === rs.currentTeamId)
        const nextIdx = (curIdx + 1) % teams.length
        const nextTeam = teams[nextIdx]
        const settings = rs.settings ?? {}
        const usedWords = rs.usedWords ?? []
        const fullPool = shuffleArray(
          buildWordQueue(
            settings.categories ?? ['bollywood-movies'],
            settings.difficulty ?? 'easy',
            settings.customWords ?? []
          )
        )
        const filtered = fullPool.filter(w => !usedWords.includes(w))
        const wordQueue = filtered.length > 0 ? filtered : fullPool
        setState({
          ...rs,
          phase: 'actor_prep',
          currentTeamId: nextTeam.id,
          wordQueue,
          replacementsLeft: 3,
          lastTurnResult: null,
        })
        clearActions()
        return
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost])

  if (!room || !myId) {
    return (
      <div className={`${DC.bg} min-h-[200px] flex items-center justify-center py-12`}>
        <p className={`${DC.textMuted} animate-pulse`}>Connecting…</p>
      </div>
    )
  }

  if (phase === 'waiting' || phase === 'setup') {
    return (
      <OnlineSetupScreen
        isHost={isHost}
        roomState={roomState}
        setState={setState}
        players={players}
        myId={myId}
        t={t}
        lang={lang}
        devMode={devMode}
      />
    )
  }

  if (phase === 'actor_prep') {
    if (isCurrentActor) {
      return (
        <OnlineActorPrepScreen
          roomState={roomState}
          sendAction={sendAction}
          setState={setState}
          isHost={isHost}
          t={t}
          devMode={devMode}
        />
      )
    }
    return <GuesserWaitScreen roomState={roomState} t={t} />
  }

  if (phase === 'acting') {
    if (isCurrentActor) {
      return (
        <OnlineActorActingScreen
          roomState={roomState}
          sendAction={sendAction}
          setState={setState}
          isHost={isHost}
          t={t}
          devMode={devMode}
        />
      )
    }
    return (
      <GuesserTimerScreen
        roomState={roomState}
        sendAction={sendAction}
        isHost={isHost}
        t={t}
        devMode={devMode}
      />
    )
  }

  if (phase === 'turn_result') {
    return (
      <OnlineTurnResultScreen
        roomState={roomState}
        isCurrentActor={isCurrentActor}
        sendAction={sendAction}
        setState={setState}
        isHost={isHost}
        t={t}
      />
    )
  }

  if (phase === 'game_over') {
    return (
      <OnlineGameOverScreen
        roomState={roomState}
        myId={myId}
        room={room}
        t={t}
        tApp={tApp}
      />
    )
  }

  return null
}

// ─── Online Setup Screen (simplified 2-device) ────────────────────────────────

function OnlineSetupScreen({ isHost, roomState, setState, players, myId, t, lang, devMode }) {
  const { toggleDevMode } = useDevMode()
  const [settings, setSettings] = useState({
    timerSeconds: 90,
    winPoints: 5,
    difficulty: 'easy',
    categories: ['bollywood-movies'],
    customWords: [],
  })
  const [customText, setCustomText] = useState('')

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Determine which team this player is on (for the preview chip)
  const myTeamLabel = players.length >= 1 && myId === players[0]?.id ? t('teamA') : t('teamB')

  function handleStartGame() {
    if (players.length < 2) return

    const customWords = customText.split('\n').map(s => s.trim()).filter(Boolean)
    const finalSettings = { ...settings, customWords }
    const wordQueue = shuffleArray(
      buildWordQueue(finalSettings.categories, finalSettings.difficulty, customWords)
    )

    // Auto-assign: players[0] → Team A, players[1] → Team B
    const teams = [
      { id: 'A', name: t('teamA'), score: 0, actorDeviceId: players[0].id },
      { id: 'B', name: t('teamB'), score: 0, actorDeviceId: players[1].id },
    ]

    setState({
      phase: 'actor_prep',
      settings: finalSettings,
      teams,
      currentTeamId: 'A',
      wordQueue,
      replacementsLeft: 3,
      lastTurnResult: null,
      usedWords: [],
    })
    trackEvent('room_created', { game: 'dumb-charades', roomType: 'casual' })
  }

  if (!isHost) {
    return (
      <div className={`${DC.card} border ${DC.cardBorder} rounded-2xl p-8 text-center space-y-3`}>
        <p className="text-4xl">⏳</p>
        <p className="text-white font-semibold">Dumb Charades</p>
        <p className={`${DC.textMuted} text-sm`}>{t('waitingForSetup')}</p>
        <div className={`inline-block ${DC.accentMuted} border ${DC.accentBorder} rounded-xl px-4 py-2 mt-2`}>
          <p className={`${DC.accent} text-sm font-semibold`}>{t('youAreTeam')} {myTeamLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-6">
      <h2 className={`text-xl font-black ${DC.accent}`}>{t('settings')}</h2>

      <div className={`${DC.accentMuted} border ${DC.accentBorder} rounded-xl px-4 py-2 text-center`}>
        <p className={`${DC.accent} text-sm font-semibold`}>{t('youAreTeam')} {myTeamLabel}</p>
      </div>

      <SettingGroup label={`⏱ ${t('timer')}`}>
        <div className="grid grid-cols-3 gap-2">
          {[60, 90, 120].map(s => (
            <ToggleBtn key={s} active={settings.timerSeconds === s} onClick={() => updateSetting('timerSeconds', s)}>
              {s}{t('seconds')}
            </ToggleBtn>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup label={`🏆 ${t('winPoints')}`}>
        <div className="grid grid-cols-4 gap-2">
          {[3, 5, 7, 10].map(p => (
            <ToggleBtn key={p} active={settings.winPoints === p} onClick={() => updateSetting('winPoints', p)}>
              {p}
            </ToggleBtn>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup label={`🎬 ${t('customMovies')}`}>
        <textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder={t('customMoviesPlaceholder')}
          rows={3}
          className={`w-full ${DC.card} text-zinc-200 rounded-xl px-4 py-3 text-sm border ${DC.cardBorder} outline-none focus:ring-2 focus:ring-[#2CE49D] resize-none`}
        />
      </SettingGroup>

      {players.length < 2 ? (
        <div className={`w-full py-4 rounded-2xl ${DC.card} ${DC.textMuted} font-semibold text-center`}>
          {t('waitingForPlayer2')}
        </div>
      ) : (
        <button
          onClick={handleStartGame}
          className={`w-full py-4 rounded-2xl ${DC.accentBg} ${DC.accentBgHover} text-[#141414] font-black text-lg transition-colors`}
        >
          {t('startOnlineGame')}
        </button>
      )}

      <div className="pt-2 border-t border-white/10 flex justify-center">
        <button onClick={toggleDevMode} className={`text-xs ${DC.textMuted}`}>
          {devMode ? '🟢 Dev mode ON' : '⚪ Dev mode OFF'}
        </button>
      </div>
    </div>
  )
}

function SettingGroup({ label, children }) {
  return (
    <div>
      <p className={`${DC.textMuted} text-sm mb-2`}>{label}</p>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 rounded-xl text-sm font-bold transition-colors ${
        active ? `${DC.accentBg} text-[#141414]` : `${DC.card} text-zinc-300 border ${DC.cardBorder}`
      }`}
    >
      {children}
    </button>
  )
}

// ─── Scoreboard Strip (shared) ────────────────────────────────────────────────

function ScoreboardStrip({ teams, winPoints, currentTeamId }) {
  return (
    <div className="w-full space-y-2">
      {teams.map(tm => (
        <div key={tm.id} className={`flex justify-between px-4 py-2 rounded-xl ${
          tm.id === currentTeamId ? `${DC.accentMuted} border ${DC.accentBorder}` : DC.card
        }`}>
          <span className={`${tm.id === currentTeamId ? DC.dot : ''} text-zinc-200 font-medium`}>
            {tm.id === currentTeamId && '• '}{tm.name}
          </span>
          <span className="text-white font-bold">{tm.score} / {winPoints ?? 5}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Host End Game Button (shared) ────────────────────────────────────────────

function HostEndGameButton({ onConfirm, t }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <div className="flex gap-3 justify-center">
        <button onClick={onConfirm} className={`${DC.accent} text-sm font-semibold`}>✓ {t('yesEnd')}</button>
        <button onClick={() => setConfirming(false)} className={`${DC.textMuted} text-sm`}>Cancel</button>
      </div>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-zinc-500 text-xs underline mt-2">
      {t('endGame')}
    </button>
  )
}

// ─── Online Actor Prep Screen ─────────────────────────────────────────────────

function OnlineActorPrepScreen({ roomState, sendAction, setState, isHost, t, devMode }) {
  const { wordQueue = [], replacementsLeft = 3, teams = [], settings = {} } = roomState
  const currentMovie = wordQueue[0] ?? ''
  const currentTeam = teams.find(tm => tm.id === roomState.currentTeamId)
  const [prepTime, setPrepTime] = useState(PREP_SECONDS)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPrepTime(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  async function handleReplace() {
    if (replacementsLeft <= 0) return
    await sendAction({ type: 'REPLACE_WORD', payload: {} })
  }

  async function handleReadyToAct() {
    clearInterval(timerRef.current)
    await sendAction({ type: 'START_ACTING', payload: {} })
  }

  function handleSkipPrep() {
    clearInterval(timerRef.current)
    sendAction({ type: 'START_ACTING', payload: {} })
  }

  function handleHostEndGame() {
    setState({ ...roomState, phase: 'game_over' })
  }

  const urgentPrep = prepTime <= 10

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen space-y-5 text-center ${DC.bg} ${DC.text}`}>
      <div className={`${DC.accentBg} rounded-2xl px-6 py-3 w-full text-center`}>
        <p className="text-[#141414] font-black text-2xl">🎬 Your Turn to Act!</p>
        <p className="text-[#141414]/80 text-sm font-semibold">{currentTeam?.name}</p>
      </div>
      <p className={`${DC.textMuted} text-sm uppercase tracking-wider`}>{t('yourMovieIs')}</p>

      <div className={`${DC.card} border ${DC.cardBorder} rounded-3xl px-8 py-6 w-full`}>
        <p
          className="text-white font-black leading-tight break-words"
          style={{ fontSize: currentMovie.length > 20 ? '1.8rem' : currentMovie.length > 12 ? '2.4rem' : '3rem' }}
        >
          {currentMovie}
        </p>
      </div>

      <p className={`text-lg font-semibold ${urgentPrep ? `${DC.accent} animate-pulse` : DC.textMuted}`}>
        {t('prepTimeLeft')}: {prepTime}{t('seconds')}
      </p>

      {devMode && (
        <button onClick={handleSkipPrep} className={`text-xs ${DC.accent} underline`}>
          ⚡ {t('skipPrep')}
        </button>
      )}

      <button
        onClick={handleReplace}
        disabled={replacementsLeft <= 0}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl ${DC.card} border ${DC.cardBorder} hover:bg-[#252525] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors`}
      >
        🔄 {t('replaceWord')}
        <span className={`${DC.accentBg} text-[#141414] text-xs font-black px-2 py-0.5 rounded-full`}>
          {replacementsLeft} {t('replacementsLeft')}
        </span>
      </button>

      <button
        onClick={handleReadyToAct}
        className={`w-full py-5 rounded-2xl ${DC.accentBg} ${DC.accentBgHover} text-[#141414] font-black text-2xl transition-colors`}
      >
        🎬 {t('readyToAct')}
      </button>

      {/* Scoreboard */}
      <ScoreboardStrip
        teams={teams}
        winPoints={settings.winPoints}
        currentTeamId={roomState.currentTeamId}
      />

      {isHost && (
        <HostEndGameButton onConfirm={handleHostEndGame} t={t} />
      )}
    </div>
  )
}

// ─── Guesser Wait Screen ───────────────────────────────────────────────────────

function GuesserWaitScreen({ roomState, t }) {
  const teams = roomState.teams ?? []
  const actingTeam = teams.find(tm => tm.id === roomState.currentTeamId)

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen space-y-4 text-center ${DC.bg} ${DC.text}`}>
      <p className="text-5xl">🎭</p>
      <div className={`${DC.accentMuted} border ${DC.accentBorder} rounded-2xl px-6 py-3`}>
        <p className={`${DC.accent} font-black text-3xl`}>{actingTeam?.name}</p>
        <p className={`${DC.textMuted} text-sm font-medium`}>{t('teamActing')}</p>
      </div>
      <p className={`${DC.textMuted} text-sm`}>{t('waitingForSetup')}</p>

      <div className="w-full mt-4 space-y-2">
        {teams.map(tm => (
          <div key={tm.id} className={`flex justify-between px-4 py-3 rounded-xl ${
            tm.id === roomState.currentTeamId ? `${DC.accentMuted} border ${DC.accentBorder}` : DC.card
          }`}>
            <span className={`${tm.id === roomState.currentTeamId ? DC.dot : ''} text-zinc-200 font-medium`}>
              {tm.id === roomState.currentTeamId && '• '}{tm.name}
            </span>
            <span className="text-white font-bold">{tm.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Online Actor Acting Screen ───────────────────────────────────────────────

function OnlineActorActingScreen({ roomState, sendAction, setState, isHost, t, devMode }) {
  const { wordQueue = [], settings = {}, teams = [] } = roomState
  const currentMovie = wordQueue[0] ?? ''
  const currentTeam = teams.find(tm => tm.id === roomState.currentTeamId)

  async function handleCorrect() {
    navigator.vibrate?.([80])
    await sendAction({ type: 'CORRECT', payload: {} })
  }

  async function handleTimerEnd() {
    await sendAction({ type: 'TIMER_EXPIRED', payload: {} })
  }

  function handleHostEndGame() {
    setState({ ...roomState, phase: 'game_over' })
  }

  return (
    <div className={`flex flex-col min-h-screen ${DC.bg} ${DC.text}`}>
      <div className={`${DC.accentMuted} border ${DC.accentBorder} rounded-xl px-4 py-2 mx-5 mt-3 text-center`}>
        <p className={`${DC.accent} font-bold text-sm`}>🎭 {currentTeam?.name} · You're Acting</p>
      </div>
      <div className="flex justify-center pt-4 pb-2">
        <Timer
          seconds={settings.timerSeconds ?? 90}
          running
          onEnd={handleTimerEnd}
          devMode={devMode}
          onForceEnd={handleTimerEnd}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p
          className="text-white font-black leading-tight break-words"
          style={{ fontSize: currentMovie.length > 20 ? '2rem' : currentMovie.length > 12 ? '2.8rem' : '3.8rem' }}
        >
          {currentMovie}
        </p>
      </div>

      <div className="px-5 pb-4 pt-4">
        <button
          onPointerDown={handleCorrect}
          className={`w-full ${DC.accentBg} ${DC.accentBgHover} active:opacity-90 text-[#141414] py-8 rounded-2xl text-3xl font-black select-none`}
        >
          ✓ {t('correct')}
        </button>
      </div>

      {/* Scoreboard */}
      <div className="px-5 pb-4">
        <ScoreboardStrip
          teams={teams}
          winPoints={settings.winPoints}
          currentTeamId={roomState.currentTeamId}
        />
      </div>

      {isHost && (
        <div className="pb-6 flex justify-center">
          <HostEndGameButton onConfirm={handleHostEndGame} t={t} />
        </div>
      )}
    </div>
  )
}

// ─── Guesser Timer Screen ─────────────────────────────────────────────────────

function GuesserTimerScreen({ roomState, sendAction, isHost, t, devMode }) {
  const teams = roomState.teams ?? []
  const actingTeam = teams.find(tm => tm.id === roomState.currentTeamId)
  const settings = roomState.settings ?? {}

  // Host fires TIMER_EXPIRED when timer ends (acts as safety net)
  async function handleTimerEnd() {
    if (!isHost) return
    await sendAction({ type: 'TIMER_EXPIRED', payload: {} })
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen space-y-4 text-center ${DC.bg} ${DC.text}`}>
      <div className={`${DC.accentMuted} border ${DC.accentBorder} rounded-2xl px-6 py-3`}>
        <p className={`${DC.accent} font-black text-3xl`}>{actingTeam?.name}</p>
        <p className={`${DC.textMuted} text-sm font-medium`}>{t('teamActing')}</p>
      </div>
      <p className={`${DC.textMuted} text-sm`}>{t('guesserRole')}</p>

      <Timer
        seconds={settings.timerSeconds ?? 90}
        running
        onEnd={handleTimerEnd}
        devMode={devMode && isHost}
        onForceEnd={handleTimerEnd}
      />

      {/* Scoreboard */}
      <div className="w-full mt-2 space-y-2">
        {teams.map(tm => (
          <div key={tm.id} className={`flex justify-between px-4 py-3 rounded-xl ${
            tm.id === roomState.currentTeamId ? `${DC.accentMuted} border ${DC.accentBorder}` : DC.card
          }`}>
            <span className={`${tm.id === roomState.currentTeamId ? DC.dot : ''} text-zinc-200 font-medium`}>
              {tm.id === roomState.currentTeamId && '• '}{tm.name}
            </span>
            <span className="text-white font-bold">{tm.score} / {roomState.settings?.winPoints ?? 5}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Online Turn Result Screen ────────────────────────────────────────────────

function OnlineTurnResultScreen({ roomState, isCurrentActor, sendAction, setState, isHost, t }) {
  const teams = roomState.teams ?? []
  const lastTurnResult = roomState.lastTurnResult ?? {}
  const isCorrect = lastTurnResult.outcome === 'correct'
  const pointTeam = lastTurnResult.pointsTo
    ? teams.find(tm => tm.id === lastTurnResult.pointsTo)
    : null

  async function handleNextTurn() {
    await sendAction({ type: 'NEXT_TURN', payload: {} })
  }

  function handleHostEndGame() {
    setState({ ...roomState, phase: 'game_over' })
  }

  return (
    <div className={`flex flex-col items-center space-y-5 text-center py-6 ${DC.bg} ${DC.text}`}>
      <p className="text-5xl">{isCorrect ? '🎯' : '⏰'}</p>

      <div className="space-y-2">
        <p className={`text-xl font-black ${DC.accent}`}>
          {isCorrect ? t('correctGuess') : t('timerExpiredMsg')}
        </p>
        {!isCorrect && pointTeam && (
          <p className={DC.textMuted}>
            {t('pointsTo')}: <span className="text-white font-bold">{pointTeam.name}</span>
          </p>
        )}
      </div>

      <div className="w-full space-y-2">
        {[...teams].sort((a, b) => b.score - a.score).map(tm => (
          <div
            key={tm.id}
            className={`flex justify-between items-center rounded-2xl px-5 py-3 ${
              tm.id === lastTurnResult.pointsTo ? `${DC.accentBg} text-[#141414]` : DC.card
            }`}
          >
            <span className="font-bold">{tm.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl">{tm.score}</span>
              <span className="opacity-60 text-sm">/ {roomState.settings?.winPoints ?? 5}</span>
            </div>
          </div>
        ))}
      </div>

      {isCurrentActor && (
        <button
          onClick={handleNextTurn}
          className={`w-full py-4 rounded-2xl ${DC.accentBg} ${DC.accentBgHover} text-[#141414] font-black text-lg transition-colors`}
        >
          {t('nextTurn')}
        </button>
      )}

      {!isCurrentActor && (
        <p className={`${DC.textMuted} text-sm animate-pulse`}>{t('waitingForSetup')}</p>
      )}

      {isHost && (
        <HostEndGameButton onConfirm={handleHostEndGame} t={t} />
      )}
    </div>
  )
}

// ─── Online Game Over Screen ──────────────────────────────────────────────────

function OnlineGameOverScreen({ roomState, myId, room, t, tApp }) {
  const teams = roomState.teams ?? []
  const winners = findWinners(teams)
  const isTie = winners.length > 1
  const myTeam = teams.find(tm => tm.actorDeviceId === myId)
  const isWinner = myTeam ? winners.some(w => w.id === myTeam.id) : false

  return (
    <div className={`flex flex-col items-center space-y-5 text-center py-6 pb-10 ${DC.bg} ${DC.text}`}>
      <p className="text-6xl">{isTie ? '🤝' : '🏆'}</p>
      <h2 className={`text-3xl font-black ${DC.accent}`}>{t('gameEnd')}</h2>
      <p className={`text-2xl font-bold ${DC.accent}`}>
        {isTie ? t('tied') : `${winners[0]?.name} ${t('winner')}`}
      </p>

      {isWinner && (
        <div className={`${DC.accentMuted} border ${DC.accentBorder} rounded-2xl px-6 py-3`}>
          <p className={`${DC.accent} font-semibold`}>
            🎉 +{calcXP(myTeam?.score ?? 0, true)} {tApp('xp')}
          </p>
        </div>
      )}

      <div className="w-full space-y-3">
        {[...teams].sort((a, b) => b.score - a.score).map((tm, rank) => {
          const isW = winners.some(w => w.id === tm.id)
          return (
            <div
              key={tm.id}
              className={`rounded-2xl px-5 py-4 flex justify-between items-center ${
                isW ? `${DC.accentBg} text-[#141414]` : DC.card
              }`}
            >
              <span className="text-xl font-black">
                {rank === 0 ? '🥇 ' : rank === 1 ? '🥈 ' : '🥉 '}
                {tm.name}
              </span>
              <span className="text-3xl font-black">{tm.score}</span>
            </div>
          )
        })}
      </div>

      <p className={`${DC.textMuted} text-xs`}>Room closes automatically…</p>
    </div>
  )
}
