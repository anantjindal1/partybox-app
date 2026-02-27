export function RoomCode({ code }) {
  return (
    <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-6 text-center">
      <p className="text-zinc-500 text-sm mb-1">Room Code</p>
      <p className="text-4xl sm:text-5xl font-black tracking-widest text-amber-400">{code}</p>
    </div>
  )
}
