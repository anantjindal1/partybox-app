import { useRef, useState } from 'react'
import { useLang } from '../store/LangContext'
import { CARD_GAME_ACCENT_CLASSES } from './cardGameAccent'

/**
 * Bottom-sheet "How to Play" tutorial — mirrors ModeChooserSheet's exact
 * backdrop/drag-handle/rounded-t-3xl structure, with a short slide
 * carousel in place of a static body. Generic across any card game;
 * each game supplies its own accent + slides.
 */
export function HowToPlaySheet({ title, slides, accent, onClose }) {
  const { t } = useLang()
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef(null)
  const accentClasses = CARD_GAME_ACCENT_CLASSES[accent] ?? CARD_GAME_ACCENT_CLASSES.maroon
  const isLast = slide === slides.length - 1

  function next() {
    if (isLast) {
      onClose()
    } else {
      setSlide(s => s + 1)
    }
  }

  function prev() {
    if (slide > 0) setSlide(s => s - 1)
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surfaceElevated border-t border-border rounded-t-3xl px-5 pt-5 pb-8 max-w-lg mx-auto shadow-card"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        <p className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-5 ${accentClasses.text}`}>
          How to Play
        </p>

        <div className="min-h-[140px] flex flex-col justify-center px-1">
          <p className="text-textPrimary text-lg font-bold font-display mb-2">{slides[slide].title}</p>
          <p className="text-textSecondary text-sm leading-relaxed">{slides[slide].body}</p>
        </div>

        <div className="flex justify-center gap-2 my-5">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === slide ? accentClasses.dot : 'bg-surfaceMuted'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {slide > 0 && (
            <button
              onClick={prev}
              className="flex-1 py-3 rounded-xl border-[1.5px] border-border text-textPrimary font-semibold"
            >
              {t('back')}
            </button>
          )}
          <button
            onClick={next}
            className={`flex-1 py-3 rounded-xl font-bold ${accentClasses.button}`}
          >
            {isLast ? 'Got it!' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
