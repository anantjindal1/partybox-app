import { useState } from 'react'
import { Button } from '../../components/Button'
import { useLang } from '../../store/LangContext'
import { rules } from './rules'
import { score } from './scoring'
import { sendRoomAction } from '../../services/room'
import { awardXP } from '../../services/xp'

export default function LuckyNumber({ room, playerId }) {
  const { lang, t } = useLang()
  const [guess, setGuess] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const isHost = room.hostId === playerId
  const state = room.state || {}
  const guesses = state.guesses || {}
  const target = state.target
  const revealed = state.revealed

  async function handleSubmitGuess() {
    const num = parseInt(guess, 10)
    if (isNaN(num) || num < 1 || num > 10) return
    const newGuesses = { ...guesses, [playerId]: num }
    await sendRoomAction(room.code, { ...state, guesses: newGuesses })
    setSubmitted(true)
  }

  async function handleHostPick(num) {
    await sendRoomAction(room.code, { target: num, guesses: {}, revealed: false })
  }

  async function handleReveal() {
    const newState = { ...state, revealed: true }
    await sendRoomAction(room.code, newState)
    // Award XP to winner
    if (target !== undefined) {
      const playerIds = room.players.map(p => p.id)
      let bestScore = -1
      let winner = null
      for (const pid of playerIds) {
        if (guesses[pid] !== undefined) {
          const s = score(guesses[pid], target)
          if (s > bestScore) { bestScore = s; winner = pid }
        }
      }
      if (winner === playerId) await awardXP(bestScore)
    }
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

      {target && !isHost && !submitted && (
        <div>
          <p className="text-slate-300 text-lg mb-3 font-semibold">{t('guess')} (1-10):</p>
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => { setGuess(String(n)); handleSubmitGuess() }}
                className={`text-white text-2xl font-bold py-4 rounded-xl transition-colors ${guess === String(n) ? 'bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {target && !isHost && submitted && !revealed && (
        <div className="bg-slate-800 rounded-2xl p-6 text-center">
          <p className="text-2xl">✅</p>
          <p className="text-slate-300 mt-2">Guess submitted! Waiting for host...</p>
        </div>
      )}

      {target && isHost && !revealed && (
        <div className="space-y-3">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-2">Guesses received: {Object.keys(guesses).length}/{room.players.length - 1}</p>
            {room.players.filter(p => p.id !== playerId).map(p => (
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
            {room.players.map(p => {
              if (p.id === room.hostId) return null
              const g = guesses[p.id]
              const s = g !== undefined ? score(g, target) : 0
              return (
                <div key={p.id} className="flex justify-between items-center bg-slate-700 rounded-xl px-4 py-3">
                  <span className="text-white font-semibold">{p.name}</span>
                  <span className="text-slate-300">Guess: {g ?? '—'}</span>
                  <span className="text-yellow-400 font-bold">{s} {t('score')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
