export function RoomCode({ code }) {
  return (
    <div className="bg-surfaceElevated border border-border/60 rounded-2xl p-6 text-center shadow-card">
      <p className="text-zinc-500 text-sm mb-1">Room Code</p>
      <p className="text-4xl sm:text-5xl font-black tracking-widest text-accent">{code}</p>
    </div>
  )
}
