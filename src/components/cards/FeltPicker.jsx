import { useState } from 'react'
import { FELT_OPTIONS, setFelt, useFelt } from '../../lib/feltColor'

// The viewer's own table colour on the royal table — a device preference,
// never shared with the other players.
export function FeltPicker() {
  const felt = useFelt()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="royal-pill flex items-center gap-2 px-3 min-h-[36px] text-[10px]"
      >
        <span className="w-4 h-4 rounded-full border border-[#e9c77e]" style={{ background: felt.hex }} />
        Table
      </button>
      {open && FELT_OPTIONS.map(option => (
        <button
          key={option.id}
          type="button"
          aria-label={`${option.label} table`}
          aria-pressed={option.id === felt.id}
          onClick={() => setFelt(option.id)}
          className={`w-8 h-8 rounded-full border-2 ${option.id === felt.id ? 'border-[#f6d690] shadow-[0_0_10px_rgba(246,214,144,0.7)]' : 'border-white/30'}`}
          style={{ background: option.hex }}
        />
      ))}
    </div>
  )
}
