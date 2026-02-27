import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { findWinners, computeBadges, calcXP } from './scoring'
import { awardXP } from '../../services/xp'
import { useEffect, useRef } from 'react'

const TEASE_ROUND_END = [
  'Time khatam! ⏰',
  'Arre bhai jaldi karo! 😂',
  'Team ne disappoint kar diya 😆',
  'Kya acting thi! 🎭',
  'Ab agli team ki baariii! 🚀'
]

function randomTease() {
  return TEASE_ROUND_END[Math.floor(Math.random() * TEASE_ROUND_END.length)]
}

// Round End screen
export function RoundEndScreen({ state, dispatch, t }) {
  const { roundCorrect, roundPassed, teams, currentTeamIndex, settings } = state
  const team = teams[currentTeamIndex]
  const isLastTurn = state.roundNumber >= settings.roundsPerTeam * teams.length
  const tease = useRef(randomTease()).current

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-6 space-y-6 text-center">
      <p className="text-5xl">⏰</p>
      <h2 className="text-3xl font-black text-rose-400">{t('roundEnd')}</h2>
      <p className="text-slate-400 text-xl italic">{tease}</p>

      <div className="bg-slate-800 rounded-2xl w-full p-6 space-y-3">
        <p className="text-slate-400 text-sm">{team?.name}</p>
        <div className="flex justify-around text-center">
          <div>
            <p className="text-5xl font-black text-green-400">{roundCorrect}</p>
            <p className="text-slate-400 text-sm mt-1">{t('wordsGuessed')}</p>
          </div>
          <div>
            <p className="text-5xl font-black text-slate-400">{roundPassed}</p>
            <p className="text-slate-400 text-sm mt-1">{t('wordsPassed')}</p>
          </div>
        </div>
      </div>

      {/* Scoreboard so far */}
      <div className="w-full space-y-2">
        {teams.map((tm, i) => (
          <div key={tm.id} className={`flex justify-between items-center rounded-xl px-5 py-3 ${i === currentTeamIndex ? 'bg-rose-500' : 'bg-slate-800'}`}>
            <span className="font-bold">{tm.name}</span>
            <span className="font-black text-xl">{i === currentTeamIndex ? tm.score + roundCorrect : tm.score}</span>
          </div>
        ))}
      </div>

      <Button onClick={() => dispatch({ type: ACTIONS.CONFIRM_ROUND })}>
        {isLastTurn ? t('gameEnd') : t('nextTeamTurn')}
      </Button>
    </div>
  )
}

// Game End screen
export function GameEndScreen({ state, dispatch, t }) {
  const { teams } = state
  const winners = findWinners(teams)
  const badges = computeBadges(teams)
  const isTie = winners.length > 1
  const xpAwarded = useRef(false)

  useEffect(() => {
    if (xpAwarded.current) return
    xpAwarded.current = true
    // Award XP offline — fire and forget
    teams.forEach(tm => {
      const isWinner = winners.some(w => w.id === tm.id)
      const totalCorrect = tm.roundHistory.reduce((s, r) => s + r.correct, 0)
      const xp = calcXP(totalCorrect, isWinner)
      if (xp > 0) awardXP(xp).catch(() => {})
    })
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-6 space-y-6 text-center pb-10">
      <p className="text-6xl">{isTie ? '🤝' : '🏆'}</p>
      <h2 className="text-3xl font-black text-rose-400">{t('gameEnd')}</h2>
      <p className="text-2xl font-bold text-yellow-400">
        {isTie ? t('tied') : `${winners[0].name} ${t('winner')}`}
      </p>

      {/* Final scores */}
      <div className="w-full space-y-3">
        {[...teams]
          .sort((a, b) => b.score - a.score)
          .map((tm, rank) => {
            const isWinner = winners.some(w => w.id === tm.id)
            const teamBadges = badges[tm.id] ?? []
            return (
              <div
                key={tm.id}
                className={`rounded-2xl px-5 py-4 text-left ${isWinner ? 'bg-yellow-500 text-black' : 'bg-slate-800'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xl font-black">{rank === 0 ? '🥇 ' : rank === 1 ? '🥈 ' : '🥉 '}{tm.name}</span>
                    {teamBadges.length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {teamBadges.map(b => (
                          <span key={b} className={`text-xs px-2 py-1 rounded-full font-semibold ${isWinner ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {t(b)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-3xl font-black">{tm.score}</span>
                </div>
              </div>
            )
          })}
      </div>

      <div className="w-full space-y-3 pt-2">
        <Button onClick={() => dispatch({ type: ACTIONS.RESET })}>{t('playAgain')}</Button>
      </div>
    </div>
  )
}
