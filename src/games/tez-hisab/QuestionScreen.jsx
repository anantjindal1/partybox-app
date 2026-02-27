import { useRef, useEffect } from 'react'
import { useGameTheme } from '../../store/GameThemeContext'
import { Timer } from './Timer'
import { ACTIONS } from './reducer'
import { Button } from '../../components/Button'

const FEEDBACK = {
  correct: ['Sahi jawab!', 'Tez ho tum!'],
  wrong: ['Galat hisaab!', 'Calculator mat bano 😄']
}

function pickFeedback(correct) {
  const arr = correct ? FEEDBACK.correct : FEEDBACK.wrong
  return arr[Math.floor(Math.random() * arr.length)]
}

export function QuestionScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const questionStartTimeRef = useRef(null)
  const lockedRef = useRef(false)

  const q = state.questions[state.currentIndex]
  const isShowingResult = state.phase === 'answer_selected'
  const currentAnswer = state.answers[state.answers.length - 1]

  useEffect(() => {
    if (state.phase === 'question_show' && q) {
      questionStartTimeRef.current = Date.now()
      lockedRef.current = false
    }
  }, [state.phase, state.currentIndex, q])

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

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 py-6`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`${theme.textMuted} text-sm font-medium`}>
          Question {state.currentIndex + 1} / {state.questions.length}
        </span>
        <span className={`${theme.accent} font-bold`}>{state.score} pts</span>
      </div>

      {state.phase === 'question_show' && (
        <div className="flex justify-center mb-6">
          <Timer running={true} onEnd={handleTimeout} />
        </div>
      )}

      <p className="text-2xl sm:text-3xl font-bold text-center mb-8 min-h-[3rem]">
        {q.question}
      </p>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {q.options.map((opt, i) => {
          let btnClass = `${theme.card} border ${theme.border} ${theme.text} text-2xl font-bold py-6 rounded-2xl border-2 ${theme.cardHover}`
          if (showResult) {
            if (i === correctIndex) btnClass = 'bg-green-600 border-green-500 text-white text-2xl font-bold py-6 rounded-2xl border-2'
            else if (i === currentAnswer?.selectedIndex && !currentAnswer?.correct) btnClass = 'bg-red-600 border-red-500 text-white text-2xl font-bold py-6 rounded-2xl border-2'
            else btnClass = `${theme.card} border ${theme.border} ${theme.textMuted} text-2xl font-bold py-6 rounded-2xl border-2`
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
          {currentAnswer.points > 0 && (
            <p className="text-center text-amber-400 font-semibold">+{currentAnswer.points} points</p>
          )}
          <Button onClick={handleNext}>Next →</Button>
        </div>
      )}
    </div>
  )
}
