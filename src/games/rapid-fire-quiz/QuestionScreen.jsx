import { useRef, useEffect, useState } from 'react'
import { useGameTheme } from '../../store/GameThemeContext'
import { Timer } from './Timer'
import { ACTIONS } from './reducer'
import { Button } from '../../components/Button'

const FEEDBACK = {
  correct: ['Sahi jawab!', 'Tez ho tum!'],
  wrong: ['Galat bhai!', 'Thoda slow hai 😂']
}

function pickFeedback(correct) {
  const arr = correct ? FEEDBACK.correct : FEEDBACK.wrong
  return arr[Math.floor(Math.random() * arr.length)]
}

export function QuestionScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const questionStartTimeRef = useRef(null)
  const lockedRef = useRef(false)
  const [remainingSec, setRemainingSec] = useState(10)

  const q = state.questions[state.currentQuestionIndex]
  const currentPlayer = state.players[state.currentPlayerIndex]
  const showResult = state.phase === 'answer_selected'

  useEffect(() => {
    if (state.phase === 'question_show' && q) {
      questionStartTimeRef.current = state.questionStartTime ?? Date.now()
      lockedRef.current = false
    }
  }, [state.phase, state.currentQuestionIndex, state.questionStartTime, q])

  useEffect(() => {
    if (state.phase !== 'question_show' || !state.questionStartTime) return
    const start = state.questionStartTime
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      setRemainingSec(Math.max(0, Math.ceil((10000 - elapsed) / 1000)))
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

  const correctIdx = q.correctIndex
  const selectedIdx = state.lastSelectedIndex
  const correct = state.lastCorrect
  const hadSpeedBonus = correct && state.responseTime != null && state.responseTime < 8000 && state.responseTime < 10000

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 py-6`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`${theme.textMuted} text-sm`}>
          Q {state.currentQuestionIndex + 1} / {state.questions.length} · {currentPlayer?.name}
        </span>
        <span className={`font-mono font-bold ${theme.accent}`}>⏱ {remainingSec}s</span>
      </div>

      <Timer
        questionStartTime={state.questionStartTime}
        phase={state.phase}
        onTimeout={handleTimeout}
      />

      <p className="text-xl sm:text-2xl font-bold text-center mb-6 min-h-[3rem] flex items-center justify-center">
        {q.question}
      </p>

      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        {q.options.map((opt, i) => {
          let btnClass = `${theme.card} border ${theme.border} ${theme.text} text-lg font-bold py-5 rounded-2xl border-2 ${theme.cardHover}`
          if (showResult) {
            if (i === correctIdx) btnClass = 'bg-green-600 border-green-500 text-white text-lg font-bold py-5 rounded-2xl border-2'
            else if (i === selectedIdx && selectedIdx >= 0) btnClass = 'bg-red-600 border-red-500 text-white text-lg font-bold py-5 rounded-2xl border-2'
            else btnClass = `${theme.card} border ${theme.border} ${theme.textMuted} text-lg font-bold py-5 rounded-2xl border-2`
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={showResult}
              className={btnClass}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {showResult && (
        <div className="mt-6 space-y-4">
          <p className={`text-center text-xl font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>
            {state.responseTime >= 10000 ? 'Time up!' : pickFeedback(correct)}
          </p>
          {hadSpeedBonus && <p className="text-center text-amber-400 font-semibold">Speed Bonus!</p>}
          <Button onClick={handleNext}>Next →</Button>
        </div>
      )}
    </div>
  )
}
