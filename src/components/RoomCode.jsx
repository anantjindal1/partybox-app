export function RoomCode({ code, accentClass = 'text-gold' }) {
  return (
    <div className="bg-surfaceElevated border border-border/60 rounded-2xl p-6 text-center shadow-card">
      <p className="text-textMuted text-sm mb-1">Room Code</p>
      <p className={`text-4xl sm:text-5xl font-black tracking-widest ${accentClass}`}>{code}</p>
    </div>
  )
}
