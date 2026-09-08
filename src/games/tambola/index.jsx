import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { generateUniqueTicket } from './ticket'
import { PRIZES } from './prizes'
import { useNumberAnnouncer } from './useNumberAnnouncer'
import { HostDashboard } from './HostDashboard'
import { PlayerTicket } from './PlayerTicket'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const PRIZE_LABELS = {
  earlyFive: 'Early Five',
  topLine: 'Top Line',
  middleLine: 'Middle Line',
  bottomLine: 'Bottom Line',
  corners: 'Four Corners',
  fullHouse: 'Full House'
}

export default function Tambola({ code }) {
  const navigate = useNavigate()
  const {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    deleteAction,
    isHost,
    myId,
    players
  } = useOnlineRoom(code)

  const phase = roomState.phase || 'waiting'
  const roomStateRef = useRef(roomState)
  roomStateRef.current = roomState

  const [starting, setStarting] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [powerCandidates, setPowerCandidates] = useState(null)
  const xpAwarded = useRef(false)
  const confettiFired = useRef(false)

  const { muted, toggleMuted, supported: ttsSupported } = useNumberAnnouncer(roomState.currentNumber)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  // ── Start game: host generates one unique ticket per current player ────
  async function handleStartGame() {
    setStarting(true)
    const tickets = {}
    const generated = []
    for (const p of players) {
      const t = generateUniqueTicket(generated)
      generated.push(t)
      tickets[p.id] = t
    }
    try {
      await persist({
        phase: 'playing',
        tickets,
        calledNumbers: [],
        currentNumber: null,
        prizesWon: {},
        powerDrawsRemaining: 3
      })
    } finally {
      setStarting(false)
    }
  }

  function pickRandomUncalled(calledNumbers, count) {
    const pool = []
    for (let n = 1; n <= 90; n++) if (!calledNumbers.includes(n)) pool.push(n)
    const picked = []
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      picked.push(pool.splice(idx, 1)[0])
    }
    return picked
  }

  async function handleDraw() {
    const calledNumbers = roomStateRef.current.calledNumbers ?? []
    if (calledNumbers.length >= 90) return
    setDrawing(true)
    const [next] = pickRandomUncalled(calledNumbers, 1)
    try {
      await persist({
        calledNumbers: [...calledNumbers, next],
        currentNumber: next,
        calledAt: Date.now()
      })
    } finally {
      setDrawing(false)
    }
  }

  function handlePowerDraw() {
    const calledNumbers = roomStateRef.current.calledNumbers ?? []
    setPowerCandidates(pickRandomUncalled(calledNumbers, 3))
  }

  async function handleChoosePowerNumber(n) {
    const calledNumbers = roomStateRef.current.calledNumbers ?? []
    const powerDrawsRemaining = roomStateRef.current.powerDrawsRemaining ?? 0
    setPowerCandidates(null)
    setDrawing(true)
    try {
      await persist({
        calledNumbers: [...calledNumbers, n],
        currentNumber: n,
        calledAt: Date.now(),
        powerDrawsRemaining: Math.max(0, powerDrawsRemaining - 1)
      })
    } finally {
      setDrawing(false)
    }
  }

  function handleClaim(prizeId) {
    sendAction({ type: 'CLAIM', payload: { prizeId } })
  }

  async function handleApproveClaim(playerId, prizeId) {
    const prizesWon = roomStateRef.current.prizesWon ?? {}
    if (!prizesWon[prizeId]) {
      const player = players.find(p => p.id === playerId)
      await persist({
        prizesWon: {
          ...prizesWon,
          [prizeId]: { playerId, playerName: player?.name ?? 'Player', claimedAt: Date.now() }
        }
      })
    }
    // Sweep every pending claim for this same prize (approved or now-moot duplicates)
    const duplicateClaimants = actions
      .filter(a => a.type === 'CLAIM' && a.payload?.prizeId === prizeId)
      .map(a => a.playerId)
    await Promise.all(duplicateClaimants.map(pid => deleteAction(pid)))
  }

  async function handleRejectClaim(playerId) {
    await deleteAction(playerId)
  }

  async function handleEndGame() {
    await persist({ phase: 'results' })
  }

  // ── Confetti on Full House ──────────────────────────────────────────────
  useEffect(() => {
    if (roomState.prizesWon?.fullHouse && !confettiFired.current) {
      confettiFired.current = true
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
    }
  }, [roomState.prizesWon?.fullHouse])

  // ── XP / stats / badge on results ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const prizesWon = roomState.prizesWon ?? {}
    const myPrizeCount = Object.values(prizesWon).filter(w => w.playerId === myId).length
    const wonFullHouse = prizesWon.fullHouse?.playerId === myId

    awardXP(myPrizeCount * 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('tambola', { won: wonFullHouse, gamesPlayed: 1 })
    }
    if (wonFullHouse) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Render ───────────────────────────────────────────────────────────────
  if (!room || !myId) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-textMuted animate-pulse">Connecting…</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < metadata.minPlayers || starting}
            className="min-h-[48px] rounded-xl bg-sapphire text-onSapphire font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing tickets...' : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'playing') {
    if (isHost) {
      const claims = actions.filter(a => a.type === 'CLAIM')
      return (
        <HostDashboard
          roomState={roomState}
          players={players}
          onDraw={handleDraw}
          onPowerDraw={handlePowerDraw}
          powerCandidates={powerCandidates}
          onChoosePowerNumber={handleChoosePowerNumber}
          drawing={drawing}
          claims={claims}
          onApproveClaim={handleApproveClaim}
          onRejectClaim={handleRejectClaim}
          onEndGame={handleEndGame}
          muted={muted}
          toggleMuted={toggleMuted}
          ttsSupported={ttsSupported}
        />
      )
    }
    const myTicket = roomState.tickets?.[myId]
    const myPendingClaim = actions.find(a => a.type === 'CLAIM' && a.playerId === myId)
    return (
      <PlayerTicket
        ticket={myTicket}
        roomState={roomState}
        storageKey={`partybox_tambola_marks_${code}_${myId}`}
        myPendingClaim={myPendingClaim}
        onClaim={handleClaim}
        muted={muted}
        toggleMuted={toggleMuted}
        ttsSupported={ttsSupported}
      />
    )
  }

  if (phase === 'results') {
    const prizesWon = roomState.prizesWon ?? {}
    return (
      <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2 pb-8">
        <h2 className="text-2xl font-black font-display text-textPrimary text-center">Final Prizes</h2>
        <div className="flex flex-col gap-1.5">
          {PRIZES.map(id => {
            const won = prizesWon[id]
            return (
              <div key={id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surfaceElevated border border-border/60">
                <span className="font-semibold text-textPrimary">{PRIZE_LABELS[id]}</span>
                <span className={won ? 'font-bold text-sapphire' : 'text-textMuted'}>
                  {won ? won.playerName : 'Unclaimed'}
                </span>
              </div>
            )
          })}
        </div>
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] rounded-xl bg-sapphire text-onSapphire font-bold"
        >
          Home
        </button>
      </div>
    )
  }

  return null
}
