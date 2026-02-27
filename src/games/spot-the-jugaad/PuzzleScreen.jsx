import { useRef, useEffect } from 'react'
import { Timer } from './Timer'
import { ACTIONS } from './reducer'
import { Button } from '../../components/Button'

const FEEDBACK = {
  correct: ['Sahi pakda!', 'Tez dimaag!'],
  wrong: ['Galat hai bhai!', 'Dhyaan do 😅']
}

function pickFeedback(correct) {
  const arr = correct ? FEEDBACK.correct : FEEDBACK.wrong
  return arr[Math.floor(Math.random() * arr.length)]
}

function vibrateCorrect() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(50)
  }
}

export function PuzzleScreen({ state, dispatch }) {
  const puzzleStartTimeRef = useRef(null)
  const lockedRef = useRef(false)

  const p = state.puzzles[state.currentIndex]
  const isShowingResult = state.phase === 'answer_selected'
  const currentAnswer = state.answers[state.answers.length - 1]

  useEffect(() => {
    if (state.phase === 'puzzle_show' && p) {
      puzzleStartTimeRef.current = Date.now()
      lockedRef.current = false
    }
  }, [state.phase, state.currentIndex, p])

  function handleSelect(optionIndex) {
    if (lockedRef.current || state.phase !== 'puzzle_show') return
    lockedRef.current = true
    const correct = optionIndex === p.correctIndex
    if (correct) vibrateCorrect()
    dispatch({
      type: ACTIONS.RECORD_ANSWER,
      payload: {
        selectedIndex: optionIndex,
        puzzleStartTime: puzzleStartTimeRef.current ?? Date.now(),
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
    dispatch({ type: ACTIONS.NEXT_PUZZLE, payload: { ts: Date.now() } })
  }

  if (!p) return null

  const correctIndex = p.correctIndex
  const showResult = isShowingResult && currentAnswer

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col px-6 py-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-zinc-500 text-sm font-medium">
          Puzzle {state.currentIndex + 1} / {state.puzzles.length}
        </span>
        <span className="text-amber-400 font-bold">{state.score} pts</span>
      </div>

      {state.phase === 'puzzle_show' && (
        <div className="flex justify-center mb-6">
          <Timer running={true} onEnd={handleTimeout} />
        </div>
      )}

      <p className="text-xl font-bold text-zinc-300 mb-6 text-center">Odd one out?</p>

      <div className="grid grid-cols-2 gap-4 flex-1 max-h-[50vh]">
        {p.items.map((item, i) => {
          const isImage = typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://'))
          let cardClass = 'bg-zinc-800 border-2 border-zinc-600 text-xl font-bold py-6 rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-colors min-h-[80px]'
          if (showResult) {
            if (i === correctIndex) cardClass = 'bg-green-600 border-2 border-green-500 text-xl font-bold py-6 rounded-2xl flex items-center justify-center min-h-[80px]'
            else if (i === currentAnswer?.selectedIndex && !currentAnswer?.correct) cardClass = 'bg-red-600 border-2 border-red-500 text-xl font-bold py-6 rounded-2xl flex items-center justify-center min-h-[80px]'
            else cardClass = 'bg-zinc-800 border-2 border-zinc-700 text-zinc-500 text-xl font-bold py-6 rounded-2xl flex items-center justify-center min-h-[80px]'
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isShowingResult}
              className={cardClass}
            >
              {isImage ? (
                <img src={item} alt="" className="max-h-20 max-w-full object-contain" />
              ) : (
                <span className="px-2 text-center break-words">{item}</span>
              )}
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
