import { Suspense, Component } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame } from '../games/registry'
import { useGameTheme } from '../store/GameThemeContext'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-xl text-zinc-400">Failed to load game. Check your connection.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); this.props.onRetry?.() }}
            className="mt-6 text-amber-400 hover:text-amber-300 text-lg font-medium"
          >
            ← Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function GameLoadingSpinner() {
  const { theme } = useGameTheme()
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
      <p className={`${theme.textMuted} text-xl animate-pulse`}>Loading…</p>
    </div>
  )
}

/**
 * Renders a single-device offline game directly — no Firebase room needed.
 * Route: /play/:slug
 * Game components are lazy-loaded; Suspense provides the loading fallback.
 * ErrorBoundary catches chunk-load failures (e.g. flaky network).
 */
export default function PlayOffline() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const game = getGame(slug)

  if (!game || !game.Component) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">🎮</p>
        <p className="text-xl text-zinc-400">Game not found: {slug}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-amber-400 hover:text-amber-300 text-lg font-medium"
        >
          ← Back to Home
        </button>
      </div>
    )
  }

  const { Component: GameComponent } = game
  return (
    <ErrorBoundary onRetry={() => navigate('/')}>
      <Suspense fallback={<GameLoadingSpinner />}>
        <GameComponent slug={slug} gameTitle={game.title} />
      </Suspense>
    </ErrorBoundary>
  )
}
