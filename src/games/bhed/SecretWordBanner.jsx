export function SecretWordBanner({ isBhed, secretWord }) {
  return (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surfaceMuted border border-emerald text-sm">
      <span className="text-textMuted">{isBhed ? 'You are' : 'Your word'}</span>
      <span className="font-bold text-emerald">{isBhed ? 'the Bhed' : secretWord?.word?.en}</span>
    </div>
  )
}
