import { Suspense, Component } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGame } from '../games/registry'
import { useGameTheme } from '../store/GameThemeContext'
import { reportError } from '../lib/crashReporting'
import FeedbackLink from '../components/FeedbackLink'
import { useLang } from '../store/LangContext'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error) {
    reportError(error, 'PlayOffline')
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-textPrimary flex flex-col items-center justify-center px-6 text-center">
          <LoadFailed onBack={() => { this.setState({ hasError: false }); this.props.onRetry?.() }} />
        </div>
      )
    }
    return this.props.children
  }
}

function LoadFailed({ onBack }) {
  const { t } = useLang()
  return (
    <>
      <p className="text-5xl mb-4">⚠️</p>
      <p className="text-xl text-textMuted">{t('gameLoadFailed')}</p>
      <button onClick={onBack} className="mt-6 text-gold hover:text-gold text-lg font-medium">
        {t('backToHome')}
      </button>
    </>
  )
}

function GameLoadingSpinner() {
  const { t } = useLang()
  const { theme } = useGameTheme()
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
      <p className={`${theme.textMuted} text-xl animate-pulse`}>{t('loading')}</p>
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
  const { t } = useLang()
  const { slug } = useParams()
  const navigate = useNavigate()
  const game = getGame(slug)

  if (!game || !game.Component) {
    return (
      <div className="min-h-screen bg-bg text-textPrimary flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">🎮</p>
        <p className="text-xl text-textMuted">{t('gameNotFound', { slug })}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-gold hover:text-gold text-lg font-medium"
        >
          {t('backToHome')}
        </button>
      </div>
    )
  }

  const { Component: GameComponent } = game
  return (
    <ErrorBoundary onRetry={() => navigate('/')}>
      <Suspense fallback={<GameLoadingSpinner />}>
        <GameComponent slug={slug} gameTitle={game.title} />
        <div className="flex justify-center pb-6">
          <FeedbackLink game={game.title?.en ?? slug} />
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}
