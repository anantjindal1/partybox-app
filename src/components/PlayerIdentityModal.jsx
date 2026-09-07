import { useState, useEffect, useRef } from 'react'

const AVATARS = ['🦁', '🐯', '🦊', '🐻', '🦅', '🐺', '🦋', '🐸']

export default function PlayerIdentityModal({ onComplete }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🦁')
  const [visible, setVisible] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const savedName = localStorage.getItem('firstbell_player_name')
    const savedAvatar = localStorage.getItem('firstbell_player_avatar')
    if (savedName && savedAvatar) {
      onComplete({ name: savedName, avatar: savedAvatar })
    } else {
      setVisible(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  if (!visible) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem('firstbell_player_name', trimmed)
    localStorage.setItem('firstbell_player_avatar', avatar)
    onComplete({ name: trimmed, avatar })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
      <div className="bg-surfaceElevated rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-textPrimary mb-1">Who are you?</h2>
        <p className="text-textMuted text-sm mb-5">Pick an avatar and enter your name</p>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {AVATARS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`text-3xl p-2 rounded-xl transition-all ${
                avatar === a
                  ? 'ring-2 ring-gold scale-110 bg-surfaceMuted'
                  : 'bg-surfaceElevated hover:bg-surfaceMuted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={12}
            placeholder="Your name"
            className="w-full bg-surfaceElevated text-textPrimary placeholder-textMuted rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold mb-4"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
              name.trim()
                ? 'bg-gold text-onGold hover:opacity-90'
                : 'bg-surfaceMuted text-textMuted cursor-not-allowed'
            }`}
          >
            Let's Play!
          </button>
        </form>
      </div>
    </div>
  )
}
