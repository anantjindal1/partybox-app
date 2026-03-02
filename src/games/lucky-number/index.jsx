import { useEffect } from 'react'
import { Button } from '../../components/Button'
import { useLang } from '../../store/LangContext'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { rules } from './rules'
import { score } from './scoring'
import { awardXP } from '../../services/xp'
import { awardBadge } from '../../services/profile'
import { writeGameStats } from '../../services/stats'

export default function LuckyNumber({ code }) {
  const { lang, t } = useLang()
  const {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    clearActions,
    isHost,
    players,
    myId
  } = useOnlineRoom(code)

  const guesses = roomState.guesses || {}
  const target = roomState.target
  const revealed = roomState.revealed
  const myGuess = guesses[myId]
  const hasSubmitted = myGuess !== undefined

  // Host merges player guesses from actions subcollection (flat schema)
  useEffect(() => {
    if (!isHost || !actions.length) return
    const merged = {}
    actions.forEach(a => {
      if (a.type === 'GUESS') merged[a.playerId] = a.payload
    })
    if (!Object.keys(merged).length) return
    setState({ ...roomState, guesses: { ...guesses, ...merged } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost])

  // Client-side game end: award XP + stats when phase transitions to 'results'
  useEffect(() => {
    if (roomState.phase !== 'results' || !myId) return
    const scores = roomState.scores ?? {}
    const myScore = scores[myId] ?? 0
    const maxScore = Math.max(...Object.values(scores), 0)
    const isWinner = myScore > 0 && myScore === maxScore

    awardXP(myScore, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('lucky-number', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge('luckyGuesser')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState.phase])

  if (!room || !myId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 animate-pulse">Connecting...</p>
      </div>
    )
  }

  async function handleHostPick(num) {
    await clearActions()
    await setState({ target: num, guesses: {}, revealed: false, phase: 'playing' })
  }

  async function handleSubmitGuess(num) {
    await sendAction({ type: 'GUESS', payload: num })
  }

  async function handleReveal() {
    // Compute scores for all non-host players
    const scores = {}
    players.filter(p => p.id !== room.hostId).forEach(p => {
      if (guesses[p.id] !== undefined) {
        scores[p.id] = score(guesses[p.id], target)
      }
    })
    await setState({ ...roomState, revealed: true, scores, phase: 'results' })
  }

  async function handleNewRound() {
    await clearActions()
    await setState({ target: undefined, guesses: {}, revealed: false, phase: 'picking' })
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-2xl p-4">
        <p className="text-slate-400 text-sm">{t('rules')}</p>
        <p className="text-white mt-1">{rules[lang]}</p>
      </div>

      {isHost && !target && (
        <div>
          <p className="text-slate-300 text-lg mb-3 font-semibold">Pick a number (1-10):</p>
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => handleHostPick(n)}
                className="bg-slate-700 hover:bg-rose-500 text-white text-2xl font-bold py-4 rounded-xl transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {target && !isHost && !hasSubmitted && (
        <div>
          <p className="text-slate-300 text-lg mb-3 font-semibold">{t('guess')} (1-10):</p>
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => handleSubmitGuess(n)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold py-4 rounded-xl transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {target && !isHost && hasSubmitted && !revealed && (
        <div className="bg-slate-800 rounded-2xl p-6 text-center">
          <p className="text-2xl">✅</p>
          <p className="text-slate-300 mt-2">Guess submitted! Waiting for host...</p>
        </div>
      )}

      {target && isHost && !revealed && (
        <div className="space-y-3">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-2">
              Guesses received: {Object.keys(guesses).length}/{players.length - 1}
            </p>
            {players.filter(p => p.id !== room.hostId).map(p => (
              <p key={p.id} className="text-slate-300">
                {p.name}: {guesses[p.id] !== undefined ? '✅' : '⏳'}
              </p>
            ))}
          </div>
          <Button onClick={handleReveal}>{t('reveal')}</Button>
        </div>
      )}

      {revealed && (
        <div className="bg-slate-800 rounded-2xl p-6 space-y-3">
          <p className="text-center text-slate-400 text-sm">Answer</p>
          <p className="text-center text-6xl font-black text-yellow-400">{target}</p>
          <div className="space-y-2 mt-4">
            {players.map(p => {
              if (p.id === room.hostId) return null
              const g = guesses[p.id]
              const s = roomState.scores?.[p.id] ?? (g !== undefined ? score(g, target) : 0)
              return (
                <div key={p.id} className="flex justify-between items-center bg-slate-700 rounded-xl px-4 py-3">
                  <span className="text-white font-semibold">{p.name}</span>
                  <span className="text-slate-300">Guess: {g ?? '—'}</span>
                  <span className="text-yellow-400 font-bold">{s} {t('score')}</span>
                </div>
              )
            })}
          </div>
          {isHost && (
            <Button onClick={handleNewRound} className="mt-2">{t('newGame')}</Button>
          )}
        </div>
      )}
    </div>
  )
}
