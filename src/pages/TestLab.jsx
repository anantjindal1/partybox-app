import { useState, useMemo } from 'react'
import { games } from '../games/registry'
import { createRoom, joinRoom } from '../services/room'

const AVATAR_POOL = ['🦁', '🐆', '🐺', '🦊', '🐻', '🐨', '🐧', '🦉']

const sortedGames = [...games].sort((a, b) =>
  (a.title?.en ?? a.slug).localeCompare(b.title?.en ?? b.slug)
)

export default function TestLab() {
  const [selectedSlug, setSelectedSlug] = useState(sortedGames[0]?.slug ?? '')
  const selectedGame = useMemo(() => games.find(g => g.slug === selectedSlug), [selectedSlug])
  const [playerCount, setPlayerCount] = useState(selectedGame?.minPlayers ?? 4)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  function handleSelectGame(slug) {
    setSelectedSlug(slug)
    const game = games.find(g => g.slug === slug)
    setPlayerCount(game?.minPlayers ?? 4)
    setResult(null)
    setError(null)
  }

  const minPlayers = selectedGame?.minPlayers ?? 1
  const maxPlayers = Math.min(selectedGame?.maxPlayers ?? 8, 8)

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const ids = Array.from({ length: playerCount }, (_, i) => `test${i + 1}`)
      const code = await createRoom(ids[0], 'Player 1', selectedSlug, AVATAR_POOL[0], 'casual', false)
      for (let i = 1; i < ids.length; i++) {
        await joinRoom(code, ids[i], `Player ${i + 1}`, AVATAR_POOL[i % AVATAR_POOL.length])
      }
      setResult({
        code,
        players: ids.map((id, i) => ({ id, name: `Player ${i + 1}`, avatar: AVATAR_POOL[i % AVATAR_POOL.length] })),
      })
    } catch (e) {
      setError(e.message ?? 'Failed to create test room')
    } finally {
      setCreating(false)
    }
  }

  function linkFor(id) {
    return `${window.location.origin}/room/${result.code}?testAs=${id}`
  }

  async function copyLink(id) {
    await navigator.clipboard.writeText(linkFor(id))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="min-h-screen bg-surface text-textPrimary px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold font-display mb-1">Test Lab</h1>
      <p className="text-textMuted text-sm mb-6">
        Solo multiplayer testing. Creates a real room with fake players already joined, and gives
        you one link per player — each tab you open a link in gets its own isolated identity for
        as long as that tab stays open, so you can play every seat yourself.
      </p>

      <div className="flex flex-col gap-4 rounded-2xl border-[1.5px] border-border bg-surfaceElevated p-4">
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Game</p>
          <select
            value={selectedSlug}
            onChange={e => handleSelectGame(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border-[1.5px] border-border bg-surface px-3 text-textPrimary"
          >
            {sortedGames.map(g => (
              <option key={g.slug} value={g.slug}>
                {g.title?.en ?? g.slug} ({g.minPlayers}-{g.maxPlayers} players)
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
            Number of test players
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlayerCount(n => Math.max(minPlayers, n - 1))}
              disabled={playerCount <= minPlayers}
              className="min-h-[40px] min-w-[40px] rounded-xl border-[1.5px] border-border font-bold disabled:opacity-40"
            >
              −
            </button>
            <span className="text-lg font-bold tabular-nums w-8 text-center">{playerCount}</span>
            <button
              onClick={() => setPlayerCount(n => Math.min(maxPlayers, n + 1))}
              disabled={playerCount >= maxPlayers}
              className="min-h-[40px] min-w-[40px] rounded-xl border-[1.5px] border-border font-bold disabled:opacity-40"
            >
              +
            </button>
            <span className="text-xs text-textMuted">
              (allowed: {minPlayers}-{maxPlayers})
            </span>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="min-h-[48px] rounded-xl bg-maroon text-onMaroon font-bold disabled:opacity-40"
        >
          {creating ? 'Creating...' : 'Create Test Room'}
        </button>

        {error && <p className="text-error text-sm">{error}</p>}
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border-[1.5px] border-border bg-surfaceElevated p-4">
          <p className="text-sm text-textMuted">
            Room code <span className="font-bold text-textPrimary">{result.code}</span> — open each
            link below in its own tab or window (⌘/Ctrl-click to open in a new tab).
          </p>
          {result.players.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border-[1.5px] border-border px-3 py-2"
            >
              <span className="text-sm font-semibold">
                {p.avatar} {p.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={linkFor(p.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-2 rounded-lg border-[1.5px] border-border text-textPrimary"
                >
                  Open →
                </a>
                <button
                  onClick={() => copyLink(p.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border-[1.5px] border-border text-textPrimary"
                >
                  {copiedId === p.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
