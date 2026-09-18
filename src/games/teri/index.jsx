import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { buildTurnOrderFromPartner, orderSeatsForViewer } from '../../multiplayer/partnerships'
import { CardTable } from '../../components/cards/CardTable'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { SUIT_TEXT_CLASS } from '../../components/cards/suitIcons'
import { HandWinnerOverlay } from '../../components/cards/HandWinnerOverlay'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { PartnerPicker } from '../../components/cards/PartnerPicker'
import { BiddingScreen } from './BiddingScreen'
import { formatBidHi } from './suitNames'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  getTeamA,
  getTeamB,
  getTeamOf,
  computeTeamHands,
  determineInitialShuffler,
  computeBiddingOrder,
  checkTeriRoundWinner,
  computeRoundPoints,
  applyShufflerScore,
  checkGameWinner
} from './teriLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

function getPartnerOf(playerId, turnOrder) {
  const teamA = getTeamA(turnOrder)
  const teamB = getTeamB(turnOrder)
  const team = teamA.includes(playerId) ? teamA : teamB
  return team.find(id => id !== playerId)
}

// Passing only skips a player's CURRENT slot in the 2-round, 8-turn
// auction — it does not remove them from bidding entirely, since
// biddingOrder gives every player exactly one more turn in round 2.
// So "have they passed" must read their MOST RECENT action from the
// log, not "have they ever passed" — otherwise a round-1 pass would
// wrongly block or mislabel their legitimate round-2 turn.
function hasCurrentlyPassed(playerId, bidHistory) {
  for (let i = bidHistory.length - 1; i >= 0; i--) {
    if (bidHistory[i].playerId === playerId) return bidHistory[i].type === 'PASS'
  }
  return false
}

export default function Teri({ code }) {
  const navigate = useNavigate()
  const { lang } = useLang()
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
    leaveSeat,
    claimSeat
  } = useOnlineRoom(code)

  const phase = roomState.phase || 'waiting'
  const roomStateRef = useRef(roomState)
  roomStateRef.current = roomState

  const [starting, setStarting] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [showShufflerIntro, setShowShufflerIntro] = useState(false)
  const [showLastRound, setShowLastRound] = useState(false)
  const [showLastHand, setShowLastHand] = useState(false)
  const [bidAnnouncement, setBidAnnouncement] = useState(null)
  const shufflerIntroRoundRef = useRef(null)
  const lastAnnouncedBidRef = useRef(undefined)

  const xpAwarded = useRef(false)
  const processingBidRef = useRef(false)
  const processingRef = useRef(false)

  // Announce every new high bid — a toast in the table lingo (e.g.
  // "Hukum mein aath"), the way players actually call bids out loud at
  // a real table. Comparing against a ref (rather than just reacting to
  // any change) is what stops a client that joins or reconnects
  // mid-auction from replaying every bid that already happened before
  // it arrived — the first render only records the current bid as a
  // baseline, it never announces it.
  useEffect(() => {
    const bid = roomState.currentHighBid
    const signature = bid ? `${bid.playerId}-${bid.number}-${bid.suit}` : null
    if (lastAnnouncedBidRef.current === undefined) {
      lastAnnouncedBidRef.current = signature
      return
    }
    if (!bid || signature === lastAnnouncedBidRef.current) return
    lastAnnouncedBidRef.current = signature
    const bidderName = players.find(p => p.id === bid.playerId)?.name ?? 'Player'
    const phrase = formatBidHi(bid.number, bid.suit)
    setBidAnnouncement(`${bidderName}: ${phrase}!`)
    const dismiss = setTimeout(() => setBidAnnouncement(null), 2500)
    return () => clearTimeout(dismiss)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState.currentHighBid])

  // Show a brief explainer once per round for who's shuffling and why —
  // otherwise the only trace of the role is a terse "Shuffler" chip
  // stacked among other seat labels during play.
  useEffect(() => {
    if (roomState.roundNumber == null || !roomState.shufflerId) return
    if (shufflerIntroRoundRef.current === roomState.roundNumber) return
    shufflerIntroRoundRef.current = roomState.roundNumber
    setShowShufflerIntro(true)
    const timer = setTimeout(() => setShowShufflerIntro(false), 10000)
    return () => clearTimeout(timer)
  }, [roomState.roundNumber, roomState.shufflerId])

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  // Small "review the last round" affordance, reused by both the bidding
  // and playing phases — RoundRevealScreen is already a clean, reusable
  // presentational component; isHost={false} suppresses its "Next Round"
  // button with no changes needed to it.
  function renderLastRoundButton() {
    if (!roomState.lastRoundResult) return null
    return (
      <>
        <button
          onClick={() => setShowLastRound(true)}
          className="self-center text-sm font-bold text-cobalt border-[1.5px] border-cobalt bg-cobalt/10 rounded-xl px-4 py-2"
        >
          📜 View Last Round
        </button>
        {showLastRound && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4 py-8 overflow-y-auto">
            <div className="bg-surface rounded-2xl max-w-lg w-full">
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setShowLastRound(false)}
                  className="text-textMuted hover:text-textPrimary text-sm font-semibold px-3 py-1"
                >
                  ✕ Close
                </button>
              </div>
              <RoundRevealScreen
                lastRoundResult={roomState.lastRoundResult}
                players={players}
                isHost={false}
                onNextRound={() => {}}
                advancing={false}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  // Review the most recently completed hand (1 card from each player)
  // WITHIN the current round — the live pause-and-reveal (HandWinnerOverlay
  // in centerSlot below) clears itself after ~1.5s, so this is the only way
  // to look back at it once that's passed. Reuses the same overlay
  // component for a visually consistent reveal rather than inventing a
  // second layout.
  function renderLastHandButton() {
    if (!roomState.lastHand) return null
    const handWinnerName = players.find(p => p.id === roomState.lastHand.winnerId)?.name ?? 'Player'
    const centerCards = roomState.lastHand.cards.map(({ playerId, card }) => ({
      card,
      playerId,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    return (
      <>
        <button
          onClick={() => setShowLastHand(true)}
          className="self-center text-sm font-bold text-cobalt border-[1.5px] border-cobalt bg-cobalt/10 rounded-xl px-4 py-2"
        >
          🃏 View Last Hand
        </button>
        {showLastHand && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4 py-8 overflow-y-auto">
            <div className="bg-surface rounded-2xl max-w-lg w-full p-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowLastHand(false)}
                  className="text-textMuted hover:text-textPrimary text-sm font-semibold px-3 py-1"
                >
                  ✕ Close
                </button>
              </div>
              <HandWinnerOverlay
                centerCards={centerCards}
                handWinnerId={roomState.lastHand.winnerId}
                handWinnerName={handWinnerName}
                accentColorClass="text-cobalt"
                settle={false}
              />
            </div>
          </div>
        )}
      </>
    )
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  // ── Host: process the current bidder's BID or PASS ───────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'bidding' || processingBidRef.current) return
    const current = roomState.biddingOrder?.[roomState.bidTurnIndex]
    if (!current) return
    const action = actions.find(a => a.playerId === current && (a.type === 'BID' || a.type === 'PASS'))
    if (!action) return
    processingBidRef.current = true
    ;(async () => {
      try {
        await applyBidAction(current, action)
      } finally {
        processingBidRef.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.bidTurnIndex])

  async function applyBidAction(playerId, action) {
    const current = roomStateRef.current
    // Never trust a submitted bid number blindly — a client whose UI
    // hasn't yet caught up with a newer high bid (or any other race)
    // could otherwise submit an equal-or-lower number and corrupt the
    // auction. Drop it silently rather than accept it; the same
    // player's turn stays active for a valid retry once their UI syncs.
    if (action.type === 'BID' && action.payload.number <= (current.currentHighBid?.number ?? 6)) {
      await clearActions()
      return
    }
    const passedPlayers = action.type === 'PASS'
      ? [...(current.passedPlayers ?? []), playerId]
      : (current.passedPlayers ?? [])
    const currentHighBid = action.type === 'BID'
      ? { number: action.payload.number, suit: action.payload.suit, playerId }
      : current.currentHighBid
    const bidHistory = [
      ...(current.bidHistory ?? []),
      action.type === 'BID'
        ? { playerId, type: 'BID', number: action.payload.number, suit: action.payload.suit }
        : { playerId, type: 'PASS' }
    ]
    const nextIdx = current.bidTurnIndex + 1
    await clearActions()
    if (nextIdx >= 8) {
      const gameLeadId = currentHighBid.playerId
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await persist({
        passedPlayers,
        currentHighBid,
        bidHistory,
        gameLeadId,
        trumpSuit: currentHighBid.suit,
        bid: currentHighBid.number,
        handsWon: zeroed,
        currentHand: [],
        ledSuit: null,
        currentIdx: current.turnOrder.indexOf(gameLeadId),
        suggestedCardId: null,
        phase: 'playing'
      })
      return
    }
    await persist({ passedPlayers, currentHighBid, bidHistory, bidTurnIndex: nextIdx })
  }

  // ── Host: process the current turn-holder's play (or GameLead's play for
  // their partner), and the partner's suggestion ────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const partnerOfGameLead = getPartnerOf(roomState.gameLeadId, roomState.turnOrder)
    const isPartnerTurn = current === partnerOfGameLead
    const action = actions.find(a => {
      if (a.type === 'SUGGEST_CARD') return a.playerId === current
      if (a.type === 'PLAY') {
        // On the partner's own turn, only GameLead may submit the play —
        // the partner's own PLAY (even though it's nominally "their turn")
        // must be rejected, not just discouraged by the UI.
        if (isPartnerTurn) return a.playerId === roomState.gameLeadId
        return a.playerId === current
      }
      return false
    })
    if (!action) return
    processingRef.current = true
    ;(async () => {
      try {
        if (action.type === 'SUGGEST_CARD') await applySuggest(action.payload.cardId)
        else await applyPlay(action.payload.cardId)
      } finally {
        processingRef.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applySuggest(cardId) {
    await clearActions()
    await persist({ suggestedCardId: cardId })
  }

  async function applyPlay(cardId) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]
    const remainingCards = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHands = { ...current.hands, [actingPlayerId]: remainingCards }
    const newHand = [...current.currentHand, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit

    if (newHand.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newHand, newLedSuit, current.trumpSuit)
      const newHandsWon = { ...current.handsWon, [winnerId]: (current.handsWon[winnerId] ?? 0) + 1 }
      const gameLeadTeam = getTeamOf(current.gameLeadId, current.turnOrder)
      const defenderTeam = gameLeadTeam === 'teamA' ? 'teamB' : 'teamA'
      const teamHands = computeTeamHands(current.turnOrder, newHandsWon)
      const gameLeadHands = teamHands[gameLeadTeam]
      const defenderHands = teamHands[defenderTeam]

      // Round can end EARLY, mid-hand-loop, once a threshold is crossed —
      // not just when a player's cards run out. checkTeriRoundWinner is
      // always non-null by hand 13 at the latest (bid + (14-bid) = 14 > 13),
      // so the empty-cards check below is a defensive fallback only.
      const outcome = checkTeriRoundWinner(gameLeadHands, defenderHands, current.bid)

      // Keep all 4 cards visible and reveal the winner for a beat before
      // clearing/advancing — otherwise the hand vanishes the instant the
      // 4th card lands, with no chance to see what happened.
      await clearActions()
      await persist({ hands: newHands, currentHand: newHand, handWinnerId: winnerId })
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (outcome || remainingCards.length === 0) {
        const resolved = outcome ?? {
          winner: gameLeadHands > defenderHands ? 'gameLead' : 'defender',
          isTeri: gameLeadHands === 13 || defenderHands === 13
        }
        const roundPoints = computeRoundPoints(current.bid, resolved.winner, resolved.isTeri)

        const shufflerId = current.shufflerId
        const isShufflerOnGameLeadTeam = getTeamOf(shufflerId, current.turnOrder) === gameLeadTeam
        const shufflerPartnerId = getPartnerOf(shufflerId, current.turnOrder)
        const shufflerIdx = current.turnOrder.indexOf(shufflerId)
        const nextCounterClockwiseId = current.turnOrder[(shufflerIdx + 1) % current.turnOrder.length]

        const shufflerResult = applyShufflerScore({
          currentScore: current.shufflerScore,
          roundPointsForGameLead: roundPoints,
          isShufflerOnGameLeadTeam,
          shufflerId,
          shufflerPartnerId,
          nextCounterClockwiseId
        })

        const newBurstPlayerIds = shufflerResult.burstPlayerId
          ? [...(current.burstPlayerIds ?? []), shufflerResult.burstPlayerId]
          : (current.burstPlayerIds ?? [])
        const gameWinnerTeam = checkGameWinner(newBurstPlayerIds, current.turnOrder)

        const gameLeadTeamIds = gameLeadTeam === 'teamA' ? getTeamA(current.turnOrder) : getTeamB(current.turnOrder)
        const defenderTeamIds = defenderTeam === 'teamA' ? getTeamA(current.turnOrder) : getTeamB(current.turnOrder)

        await persist({
          handsWon: newHandsWon,
          currentHand: [],
          handWinnerId: null,
          ledSuit: null,
          shufflerId: shufflerResult.shufflerId,
          shufflerScore: shufflerResult.score,
          burstPlayerIds: newBurstPlayerIds,
          gameWinnerTeam,
          lastHand: { cards: newHand, winnerId },
          lastRoundResult: {
            roundNumber: current.roundNumber,
            bid: current.bid,
            trumpSuit: current.trumpSuit,
            gameLeadTeamIds,
            defenderTeamIds,
            gameLeadHands,
            defenderHands,
            winner: resolved.winner,
            isTeri: resolved.isTeri,
            roundPoints,
            shufflerBefore: { id: shufflerId, score: current.shufflerScore },
            shufflerAfter: { id: shufflerResult.shufflerId, score: shufflerResult.score },
            burstPlayerId: shufflerResult.burstPlayerId,
            gameWinnerTeam
          },
          phase: 'round_reveal'
        })
        return
      }

      await persist({
        handsWon: newHandsWon,
        currentHand: [],
        handWinnerId: null,
        ledSuit: null,
        currentIdx: current.turnOrder.indexOf(winnerId),
        suggestedCardId: null,
        lastHand: { cards: newHand, winnerId }
      })
      return
    }

    const turnState = advanceTurn({
      playerIds: current.turnOrder,
      currentIdx: current.currentIdx,
      round: current.roundNumber
    })
    await clearActions()
    await persist({
      hands: newHands,
      currentHand: newHand,
      ledSuit: newLedSuit,
      currentIdx: turnState.currentIdx,
      suggestedCardId: null
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const playerIds = buildTurnOrderFromPartner(players.map(p => p.id), room.hostId, roomState.pendingPartnerId)
      const shufflerId = determineInitialShuffler(shuffleDeck(createDeck()), playerIds)
      const { hands } = dealCards(shuffleDeck(createDeck()), playerIds, 13)
      const biddingOrder = computeBiddingOrder(playerIds, shufflerId)
      await clearActions()
      await persist({
        phase: 'bidding',
        pendingPartnerId: null,
        turnOrder: playerIds,
        shufflerId,
        shufflerScore: 0,
        burstPlayerIds: [],
        roundNumber: 0,
        biddingOrder,
        bidTurnIndex: 0,
        passedPlayers: [],
        currentHighBid: null,
        bidHistory: [],
        hands,
        gameLeadId: null,
        trumpSuit: null,
        bid: null,
        lastRoundResult: null,
        lastHand: null,
        gameWinnerTeam: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleBid(number, suit) {
    sendAction({ type: 'BID', payload: { number, suit } })
  }

  function handlePass() {
    sendAction({ type: 'PASS', payload: {} })
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  function handleSuggestCard(cardId) {
    sendAction({ type: 'SUGGEST_CARD', payload: { cardId } })
  }

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.gameWinnerTeam) {
        await persist({ phase: 'results' })
        return
      }
      const nextRoundNumber = current.roundNumber + 1
      const { hands } = dealCards(shuffleDeck(createDeck()), current.turnOrder, 13)
      const biddingOrder = computeBiddingOrder(current.turnOrder, current.shufflerId)
      await clearActions()
      await persist({
        phase: 'bidding',
        roundNumber: nextRoundNumber,
        biddingOrder,
        bidTurnIndex: 0,
        passedPlayers: [],
        currentHighBid: null,
        bidHistory: [],
        hands,
        gameLeadId: null,
        trumpSuit: null,
        bid: null,
        // lastHand is scoped to the current round's auction — a hand from
        // the PREVIOUS round has no meaning once cards are redealt.
        lastHand: null
        // lastRoundResult is deliberately kept — it's what "View Last Round"
        // shows during the new round's bidding/playing. It only changes once
        // THIS new round itself completes and overwrites it.
      })
    } finally {
      setAdvancing(false)
    }
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const isWinner = getTeamOf(myId, roomState.turnOrder) === roomState.gameWinnerTeam
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('teri', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
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
        <GameRulesPanel
          title={metadata.title[lang]}
          rules={metadata.rules[lang]}
          tutorialSlides={metadata.tutorial[lang]}
          accent="cobalt"
          phase={phase}
        />
        {players.length === 4 && (
          <PartnerPicker
            players={players}
            hostId={room.hostId}
            myId={myId}
            pendingPartnerId={roomState.pendingPartnerId}
            onSelectPartner={id => persist({ pendingPartnerId: id })}
            accent="cobalt"
          />
        )}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length !== 4 || starting}
            className="min-h-[48px] rounded-xl bg-cobalt text-onCobalt font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing...' : players.length < 4 ? `Waiting for players (${players.length}/4)` : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'bidding') {
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    const currentBidder = roomState.biddingOrder?.[roomState.bidTurnIndex]
    const rawBidHistory = roomState.bidHistory ?? []
    // Passing only skips THAT turn — biddingOrder gives every player a
    // second, genuine turn in round 2, so a round-1 pass must never
    // block or auto-skip their round-2 slot. `isMyTurn` is therefore
    // just "is it my slot", full stop.
    const iAlreadyPassed = hasCurrentlyPassed(myId, rawBidHistory)
    const isMyTurn = currentBidder === myId
    const isFirstTurn = roomState.bidTurnIndex === 0
    const currentBidderName = players.find(p => p.id === currentBidder)?.name ?? 'Player'
    const seats = orderSeatsForViewer(roomState.turnOrder, myId)
      .map(id => players.find(p => p.id === id))
      .filter(Boolean)
      .map(p => ({
        id: p.id,
        name: p.name,
        isPartner: getTeamOf(myId, roomState.turnOrder) === getTeamOf(p.id, roomState.turnOrder),
        isCurrentBidder: currentBidder === p.id,
        hasPassed: hasCurrentlyPassed(p.id, rawBidHistory),
        isHighBidder: roomState.currentHighBid?.playerId === p.id
      }))
    const shufflerName = players.find(p => p.id === roomState.shufflerId)?.name ?? 'Someone'
    const bidHistory = rawBidHistory.map(entry => ({
      ...entry,
      playerName: players.find(p => p.id === entry.playerId)?.name ?? 'Player'
    }))
    return (
      <>
        {renderLastRoundButton()}
        {bidAnnouncement && (
          <p className="mx-4 sm:mx-6 mt-3 py-2.5 px-4 rounded-xl bg-cobalt/10 border border-cobalt/30 text-cobalt text-sm font-bold text-center animate-fade-in">
            📣 {bidAnnouncement}
          </p>
        )}
        {showShufflerIntro && (
          <button
            onClick={() => setShowShufflerIntro(false)}
            className="mx-4 sm:mx-6 mt-3 py-2.5 px-4 rounded-xl bg-cobalt/10 border border-cobalt/30 text-cobalt text-sm font-medium text-center"
          >
            🔀 {shufflerName} is the Shuffler this round — their running score
            (currently {roomState.shufflerScore}) decides when the role passes
            to someone else. Tap to dismiss.
          </button>
        )}
        <BiddingScreen
          myHand={myHand}
          seats={seats}
          bidHistory={bidHistory}
          isMyTurn={isMyTurn}
          isFirstTurn={isFirstTurn}
          currentHighBid={roomState.currentHighBid}
          currentBidderName={currentBidderName}
          iAlreadyPassed={iAlreadyPassed}
          onBid={handleBid}
          onPass={handlePass}
        />
      </>
    )
  }

  if (phase === 'playing') {
    const gameLeadId = roomState.gameLeadId
    const partnerOfGameLead = getPartnerOf(gameLeadId, roomState.turnOrder)
    const isGameLead = myId === gameLeadId
    const isPartnerOfGameLead = myId === partnerOfGameLead
    const currentTurnHolder = roomState.turnOrder?.[roomState.currentIdx]
    const isPartnerTurn = currentTurnHolder === partnerOfGameLead
    const isMyTurnNormally = currentTurnHolder === myId

    // My own hand always renders at the bottom, in CardTable's normal
    // position — it never gets swapped out for the dummy's hand. When
    // GameLead needs to play for the dummy, the ACTION happens by
    // tapping the dummy's own exposed-hand fan (rendered at her seat,
    // see otherSeats below) instead — own hand just goes fully
    // non-interactive for that turn so it can't be mistaken for the
    // live hand (and, critically, so a stray tap here can never submit
    // a card that only exists in the wrong hand).
    const activeHand = sortHand(roomState.hands?.[myId] ?? [], { trumpSuit: roomState.trumpSuit })
    const onCardTap = (isGameLead && isPartnerTurn) ? undefined : (isPartnerOfGameLead && isPartnerTurn) ? handleSuggestCard : handlePlayCard

    // currentIdx doesn't advance until the hand-reveal pause finishes
    // (see applyPlay), so nothing should be tappable while a completed
    // hand is still being held on screen for review.
    const isInteractive = !roomState.handWinnerId &&
      (isMyTurnNormally || (isPartnerOfGameLead && isPartnerTurn))
    const legalPlays = isInteractive ? getLegalPlays(activeHand, roomState.ledSuit) : []
    // Whenever it genuinely isn't my turn to act (which includes GameLead
    // during the dummy's turn, since isInteractive is false there too),
    // the WHOLE hand must be disabled — not just the illegal cards. The
    // previous version fell back to an empty disabled list for anyone
    // who wasn't GameLead-playing-for-the-dummy specifically, silently
    // leaving every other non-turn player's own cards fully tappable:
    // onCardTap stays wired to handlePlayCard regardless of whose turn
    // it is, so a stray tap would fire a real PLAY action (harmlessly
    // rejected by the host, which only trusts turnOrder/currentIdx, not
    // the tapper's identity) but still play the local "card flies away"
    // animation and freeze the rest of the hand, since the card never
    // actually leaves a hand the host never touched.
    const disabledCardIds = isInteractive ? activeHand.filter(id => !legalPlays.includes(id)) : activeHand
    const highlightedCardIds = activeHand.filter(id => parseCard(id).suit === roomState.trumpSuit)
    const selectedCardIds = (isPartnerOfGameLead && isPartnerTurn && roomState.suggestedCardId) ? [roomState.suggestedCardId] : []

    // Dummy's exposed hand becomes the live, tappable one specifically
    // when GameLead needs to act on her behalf — computed separately
    // from the seat-display data below since it needs suit-following
    // legality against the dummy's actual cards, not GameLead's own.
    const isPlayingForDummy = isGameLead && isPartnerTurn && !roomState.handWinnerId
    const dummyHand = sortHand(roomState.hands?.[partnerOfGameLead] ?? [], { trumpSuit: roomState.trumpSuit })
    const dummyLegalPlays = isPlayingForDummy ? getLegalPlays(dummyHand, roomState.ledSuit) : []

    const centerCards = (roomState.currentHand ?? []).map(({ playerId, card }) => ({
      card,
      playerId,
      playerName: players.find(p => p.id === playerId)?.name
    }))

    // Once a hand completes, hold all 4 cards on screen with the winner
    // called out (and highlighted) before the next hand's empty center
    // takes over — hand-settle fades/shrinks the whole reveal over the
    // same window applyPlay pauses for, so it dissolves right on cue.
    const handWinnerId = roomState.handWinnerId
    const handWinnerName = handWinnerId ? (players.find(p => p.id === handWinnerId)?.name ?? 'Player') : null
    const centerSlot = handWinnerId ? (
      <HandWinnerOverlay
        centerCards={centerCards}
        handWinnerId={handWinnerId}
        handWinnerName={handWinnerName}
        accentColorClass="text-cobalt"
      />
    ) : null

    const otherSeats = orderSeatsForViewer(roomState.turnOrder, myId)
      .map(id => players.find(p => p.id === id))
      .filter(Boolean)
      .map(p => {
        // Two independent concepts that only coincide when the viewer is
        // on GameLead's team: "Your Partner" is team-relative (correct
        // from every viewer's own perspective), while "Open Hand" marks
        // GameLead's partner specifically — the dummy seat exposed to
        // EVERYONE regardless of whose team they're on.
        const isMyPartner = getTeamOf(myId, roomState.turnOrder) === getTeamOf(p.id, roomState.turnOrder)
        const isDummySeat = p.id === partnerOfGameLead
        const labels = []
        if (isMyPartner) labels.push('Your Partner')
        if (p.id === roomState.shufflerId) labels.push('Shuffler')
        if (p.id === gameLeadId) labels.push('GameLead')
        if (isDummySeat) labels.push('Open Hand')
        return {
          player: p,
          cardCount: roomState.hands?.[p.id]?.length ?? 0,
          isActiveTurn: currentTurnHolder === p.id,
          label: labels.length ? labels.join(' · ') : undefined,
          exposedCards: isDummySeat ? dummyHand : undefined,
          // Only GameLead ever gets a tappable dummy hand, and only on
          // her actual turn — every other viewer (including the dummy
          // herself) sees the exact same cards as a pure display.
          onExposedCardTap: (isDummySeat && isPlayingForDummy) ? handlePlayCard : undefined,
          disabledExposedCardIds: (isDummySeat && isPlayingForDummy)
            ? dummyHand.filter(id => !dummyLegalPlays.includes(id))
            : undefined,
          highlightedExposedCardIds: isDummySeat
            ? dummyHand.filter(id => parseCard(id).suit === roomState.trumpSuit)
            : undefined,
          selectedExposedCardIds: (isDummySeat && roomState.suggestedCardId)
            ? [roomState.suggestedCardId]
            : undefined
        }
      })

    const teamHands = computeTeamHands(roomState.turnOrder, roomState.handsWon ?? {})
    const gameLeadTeam = getTeamOf(gameLeadId, roomState.turnOrder)
    const defenderTeam = gameLeadTeam === 'teamA' ? 'teamB' : 'teamA'
    const scoreEntries = [
      { label: 'GameLead', value: `${teamHands[gameLeadTeam]}/${roomState.bid}` },
      { label: 'Defenders', value: `${teamHands[defenderTeam]}` },
      { label: 'Trump', value: SUIT_LABEL[roomState.trumpSuit], valueClassName: SUIT_TEXT_CLASS[roomState.trumpSuit] }
    ]

    const partnerName = players.find(p => p.id === partnerOfGameLead)?.name ?? 'partner'
    const currentTurnName = players.find(p => p.id === currentTurnHolder)?.name ?? 'player'
    const statusText = isPlayingForDummy
      ? `Tap a card in ${partnerName}'s hand above to play it`
      : (isPartnerOfGameLead && isPartnerTurn)
        ? 'GameLead is choosing your card — tap to suggest'
        : !isMyTurnNormally
          ? `Waiting for ${currentTurnName} to play...`
          : roomState.ledSuit
            ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]}`
            : 'Lead any card'

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {renderLastRoundButton()}
          {renderLastHandButton()}
        </div>
        <TableScoreBar entries={scoreEntries} />
        <CardTable
          otherSeats={otherSeats}
          myHand={activeHand}
          myIsActiveTurn={isInteractive}
          centerCards={centerCards}
          centerSlot={centerSlot}
          disabledCardIds={disabledCardIds}
          highlightedCardIds={highlightedCardIds}
          selectedCardIds={selectedCardIds}
          onCardTap={onCardTap}
          accent="cobalt"
        />
        <p className="text-center text-textMuted text-sm py-2">{statusText}</p>
      </div>
    )
  }

  if (phase === 'round_reveal') {
    const openSeats = room?.openSeats ?? []
    const isSpectator = (room?.spectators ?? []).some(p => p.id === myId)
    return (
      <RoundRevealScreen
        lastRoundResult={roomState.lastRoundResult}
        players={players}
        isHost={isHost}
        onNextRound={handleNextRound}
        advancing={advancing}
        seatManagement={{
          turnOrder: roomState.turnOrder ?? [],
          openSeats,
          myId,
          isSpectator,
          onLeaveSeat: leaveSeat,
          onClaimSeat: (seatPlayerId) => {
            // The departed player's id can still be sitting in a couple
            // of cross-round fields that live outside turnOrder — only
            // shufflerId, here, since everything else Teri persists by
            // player id (hands, handsWon, passedPlayers, etc.) gets
            // fully recomputed by the next deal anyway.
            const statePatch = {
              turnOrder: roomState.turnOrder.map(id => id === seatPlayerId ? myId : id)
            }
            if (roomState.shufflerId === seatPlayerId) statePatch.shufflerId = myId
            claimSeat(seatPlayerId, statePatch)
          }
        }}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        turnOrder={roomState.turnOrder ?? []}
        players={players}
        gameWinnerTeam={roomState.gameWinnerTeam}
        burstPlayerIds={roomState.burstPlayerIds ?? []}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
