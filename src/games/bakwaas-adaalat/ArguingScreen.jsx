import CircularTimer from '../../components/CircularTimer'

export function ArguingScreen({ caseText, lawyerNames, argSlot, turnSeconds, secondsLeft }) {
  const speakingName = lawyerNames[argSlot]
  const nextName = lawyerNames[1 - argSlot]

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">The Case</p>
      <p className="text-lg font-display text-textPrimary text-center leading-snug">
        "{caseText}"
      </p>

      <CircularTimer totalSeconds={turnSeconds} secondsLeft={secondsLeft} size={140} />

      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-bold font-display text-taupe">🎤 {speakingName}</p>
        <p className="text-xs text-textMuted uppercase tracking-wider">is arguing now — out loud!</p>
      </div>

      <p className="text-sm text-textMuted text-center">
        Up next: <span className="font-semibold text-textPrimary">{nextName}</span>
      </p>
    </div>
  )
}
