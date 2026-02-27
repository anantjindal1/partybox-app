import { useRef, useEffect, useState } from 'react'
import { useGameTheme } from '../../store/GameThemeContext'
import { Timer } from './Timer'
import { ACTIONS } from './reducer'
import { Button } from '../../components/Button'

const FEEDBACK = {
  correct: ['Sahi pakde!', 'Filmy expert!', 'Tez ho tum!'],
  wrong: ['Arre galat!', 'Phir try karo!', 'Galat!']
}

function pickFeedback(correct) {
  const arr = correct ? FEEDBACK.correct : FEEDBACK.wrong
  return arr[Math.floor(Math.random() * arr.length)]
}

export function QuestionScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const questionStartTimeRef = useRef(null)
  const lockedRef = useRef(false)
  const [remainingSec, setRemainingSec] = useState(15)

  const q = state.questions[state.currentIndex]
  const isShowingResult = state.phase === 'answer_selected'
  const currentAnswer = state.answers[state.answers.length - 1]

  useEffect(() => {
    if (state.phase === 'question_show' && q) {
      questionStartTimeRef.current = Date.now()
      lockedRef.current = false
    }
  }, [state.phase, state.currentIndex, q])

  useEffect(() => {
    if (state.phase !== 'question_show' || !state.questionStartTime) return
    const start = state.questionStartTime
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const rem = Math.max(0, Math.ceil((15000 - elapsed) / 1000))
      setRemainingSec(rem)
    }, 100)
    return () => clearInterval(interval)
  }, [state.phase, state.questionStartTime])

  function handleSelect(optionIndex) {
    if (lockedRef.current || state.phase !== 'question_show') return
    lockedRef.current = true
    dispatch({
      type: ACTIONS.RECORD_ANSWER,
      payload: {
        selectedIndex: optionIndex,
        questionStartTime: questionStartTimeRef.current ?? Date.now(),
        ts: Date.now()
      }
    })
  }

  function handleTimeout() {
    if (lockedRef.current) return
    lockedRef.current = true
    dispatch({ type: ACTIONS.TIMEOUT })
  }

  function handleNext() {
    dispatch({ type: ACTIONS.NEXT_QUESTION, payload: { ts: Date.now() } })
  }

  if (!q) return null

  const correctIndex = q.correctIndex
  const showResult = isShowingResult && currentAnswer
  const showSpeedBonus = showResult && currentAnswer.correct && currentAnswer.responseTimeMs < 12000

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 py-6`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`${theme.textMuted} text-sm font-medium`}>
          Question {state.currentIndex + 1} / {state.questions.length}
        </span>
        <span className="flex items-center gap-3">
          <span className={`font-mono font-bold ${theme.accent}`}>⏱ {remainingSec}s</span>
          <span className={`font-bold ${theme.accent}`}>{state.score} pts</span>
        </span>
      </div>

      <Timer
        questionStartTime={state.questionStartTime}
        phase={state.phase}
        onTimeout={handleTimeout}
      />

      <p className="text-5xl sm:text-6xl font-bold text-center mb-8 min-h-[4rem] flex items-center justify-center">
        {q.emojiClue}
      </p>

      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        {q.options.map((opt, i) => {
          let btnClass = `${theme.card} border ${theme.border} ${theme.text} text-lg font-bold py-5 rounded-2xl border-2 ${theme.cardHover}`
          if (showResult) {
            if (i === correctIndex) btnClass = 'bg-green-600 border-green-500 text-white text-lg font-bold py-5 rounded-2xl border-2'
            else if (i === currentAnswer?.selectedIndex && !currentAnswer?.correct) btnClass = 'bg-red-600 border-red-500 text-white text-lg font-bold py-5 rounded-2xl border-2'
            else btnClass = `${theme.card} border ${theme.border} ${theme.textMuted} text-lg font-bold py-5 rounded-2xl border-2`
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isShowingResult}
              className={btnClass}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {showResult && (
        <div className="mt-6 space-y-4">
          <p className={`text-center text-xl font-bold ${currentAnswer.correct ? 'text-green-400' : 'text-red-400'}`}>
            {pickFeedback(currentAnswer.correct)}
          </p>
          {showSpeedBonus && currentAnswer.points > 10 && (
            <p className="text-center text-amber-400 font-semibold">Speed Bonus!</p>
          )}
          {currentAnswer.points > 0 && (
            <p className="text-center text-amber-400 font-semibold">+{currentAnswer.points} points</p>
          )}
          <Button onClick={handleNext}>Next →</Button>
        </div>
      )}
    </div>
  )
}
