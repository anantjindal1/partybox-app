import { useState, useEffect } from 'react'
import { HowToPlaySheet } from './HowToPlaySheet'
import { CARD_GAME_ACCENT_CLASSES } from './cardGameAccent'

/**
 * Written rules + a "How to Play" tutorial button for a game's waiting
 * screen. Owns the tutorial-open state and auto-closes it the instant
 * `phase` leaves 'waiting' (the host started the game while someone had
 * the tutorial open) — every game just renders this with its own
 * content, no per-game state/effect wiring needed.
 */
export function GameRulesPanel({ title, rules, tutorialSlides, accent, phase }) {
  const [showTutorial, setShowTutorial] = useState(false)
  const accentClasses = CARD_GAME_ACCENT_CLASSES[accent] ?? CARD_GAME_ACCENT_CLASSES.maroon

  useEffect(() => {
    if (phase !== 'waiting') setShowTutorial(false)
  }, [phase])

  return (
    <div className={`rounded-2xl border-[1.5px] ${accentClasses.border} ${accentClasses.soft} p-4 flex flex-col gap-3`}>
      <p className={`text-xs font-semibold uppercase tracking-wider ${accentClasses.text}`}>How to Play</p>
      <ul className="flex flex-col gap-1.5">
        {rules.map((rule, i) => (
          <li key={i} className="text-textSecondary text-sm leading-snug flex gap-2">
            <span className={accentClasses.text}>•</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setShowTutorial(true)}
        className={`self-start text-xs font-bold ${accentClasses.text} hover:opacity-70 transition-opacity`}
      >
        See full tutorial →
      </button>

      {showTutorial && (
        <HowToPlaySheet
          title={title}
          slides={tutorialSlides}
          accent={accent}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  )
}
