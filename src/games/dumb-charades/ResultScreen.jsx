import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { findWinners, calcXP } from './scoring'
import { awardXP } from '../../services/xp'
import { useEffect, useRef, useState } from 'react'
import { DC } from './theme'

// Turn result screen (shown after each turn)
export function TurnResultScreen({ state, dispatch, t }) {
  const { teams, lastTurnOutcome, pointsTo, settings } = state
  const [confirmEnd, setConfirmEnd] = useState(false)

  const isCorrect = lastTurnOutcome === 'correct'
  const pointTeam = pointsTo ? teams.find(tm => tm.id === pointsTo) : null

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col items-center justify-center px-6 space-y-6 text-center`}>
      <p className="text-5xl animate-scale-in">{isCorrect ? '🎯' : '⏰'}</p>

      <div className="space-y-2">
        <p className={`text-2xl font-black ${DC.accent}`}>
          {isCorrect ? t('correctGuess') : t('timerExpiredMsg')}
        </p>
        {!isCorrect && pointTeam && (
          <p className={`${DC.textMuted} text-lg`}>
            {t('pointsTo')}: <span className="text-white font-bold">{pointTeam.name}</span>
          </p>
        )}
      </div>

      <div className="w-full space-y-3">
        {[...teams]
          .sort((a, b) => b.score - a.score)
          .map(tm => (
            <div
              key={tm.id}
              className={`flex justify-between items-center rounded-2xl px-5 py-4 ${
                tm.id === pointsTo ? `${DC.accentMuted} border ${DC.accentBorder} text-white` : `${DC.card} border ${DC.cardBorder} text-zinc-200`
              }`}
            >
              <span className="font-bold text-lg">{tm.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-black text-2xl">{tm.score}</span>
                <span className="text-sm opacity-60">/ {settings.winPoints}</span>
              </div>
            </div>
          ))}
      </div>

      <div className="w-full rounded-2xl">
        <Button onClick={() => dispatch({ type: ACTIONS.CONFIRM_TURN })}>{t('nextTurn')}</Button>
      </div>

      {confirmEnd ? (
        <div className="flex gap-3 justify-center">
          <button onClick={() => dispatch({ type: ACTIONS.FORCE_END })} className={`${DC.accent} text-sm font-semibold`}>✓ {t('yesEnd')}</button>
          <button onClick={() => setConfirmEnd(false)} className={`${DC.textMuted} text-sm`}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirmEnd(true)} className="text-zinc-500 text-xs underline">
          {t('endGame')}
        </button>
      )}
    </div>
  )
}

// Game End screen
export function GameEndScreen({ state, dispatch, t }) {
  const { teams, settings } = state
  const winners = findWinners(teams)
  const isTie = winners.length > 1
  const xpAwarded = useRef(false)

  useEffect(() => {
    if (xpAwarded.current) return
    xpAwarded.current = true
    teams.forEach(tm => {
      const isWinner = winners.some(w => w.id === tm.id)
      const xp = calcXP(tm.score, isWinner)
      if (xp > 0) awardXP(xp).catch(() => {})
    })
  }, [])

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col items-center justify-center px-6 space-y-6 text-center pb-10`}>
      <p className="text-6xl animate-scale-in">{isTie ? '🤝' : '🏆'}</p>
      <h2 className={`text-3xl font-black ${DC.accent}`}>{t('gameEnd')}</h2>
      <p className={`text-2xl font-bold ${DC.accent} animate-scale-in`}>
        {isTie ? t('tied') : `${winners[0].name} ${t('winner')}`}
      </p>

      <div className="w-full space-y-3">
        {[...teams]
          .sort((a, b) => b.score - a.score)
          .map((tm, rank) => {
            const isWinner = winners.some(w => w.id === tm.id)
            return (
              <div
                key={tm.id}
                className={`rounded-2xl px-5 py-4 flex justify-between items-center ${
                  isWinner ? `${DC.accentBg} text-[#141414]` : `${DC.card} border ${DC.cardBorder} text-zinc-200`
                }`}
              >
                <span className="text-xl font-black">
                  {rank === 0 ? '🥇 ' : rank === 1 ? '🥈 ' : '🥉 '}
                  {tm.name}
                </span>
                <div className="text-right">
                  <span className="text-3xl font-black">{tm.score}</span>
                  <span className="text-sm opacity-60 ml-1">pts</span>
                </div>
              </div>
            )
          })}
      </div>

      <div className="w-full pt-2 rounded-2xl">
        <Button onClick={() => dispatch({ type: ACTIONS.RESET })}>{t('playAgain')}</Button>
      </div>
    </div>
  )
}
