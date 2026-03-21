import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { CreateRoomSheet } from '../components/CreateRoomSheet'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { games } from '../games/registry'
import { joinRoom } from '../services/room'
import { getInProgressGames } from '../services/gameStatePersistence'
import PlayerIdentityModal from '../components/PlayerIdentityModal'
import { trackEvent as trackAnalyticsEvent } from '../services/analytics_events'
import AdBanner from '../components/AdBanner'

const COMING_SOON_SLOTS = 0

// TODO: restore tabs when game count > 5
// const TABS = [
//   { key: 'solo',   label: 'Solo',   emoji: '👤' },
//   { key: 'party',  label: 'Party',  emoji: '🎉' },
//   { key: 'online', label: 'Online', emoji: '📡' },
// ]
//
// const TAB_SLUGS = {
//   solo:   ['thinkfast'],
//   party:  ['dumb-charades-offline'],
//   online: ['firstbell'],
// }

// Static card definitions for the vertical game stack
const VISIBLE_GAMES = [
  {
    slug: 'thinkfast',
    icon: '🧠',
    title: 'ThinkFast',
    modeBadge: 'Solo 👤',
    modeBadgeClass: 'bg-zinc-700 text-zinc-300',
    description: '10 questions, answer as fast as you can',
    playersPill: '1 player',
    timePill: '~3 mins',
    cta: 'Play →',
    isOnline: false,
  },
  {
    slug: 'dumb-charades-offline',
    icon: '🎬',
    title: 'Dumb Charades',
    modeBadge: 'Party 🎉',
    modeBadgeClass: 'bg-zinc-700 text-zinc-300',
    description: 'Act out Bollywood movies, songs & more',
    playersPill: '2+ players',
    timePill: 'Pass the phone',
    cta: 'Play →',
    isOnline: false,
  },
  {
    slug: 'firstbell',
    icon: '🔔',
    title: 'FirstBell',
    modeBadge: 'Online 📡',
    modeBadgeClass: 'bg-blue-900/60 text-blue-400',
    description: 'Live quiz battle with friends online',
    playersPill: '2-6 players',
    timePill: '~5 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { profile } = useProfile()
  const online = useOnlineStatus()

  // Existing state
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)

  // TODO: restore tabs when game count > 5
  // const [activeTab, setActiveTab] = useState(
  //   () => localStorage.getItem('partybox_home_tab') || 'solo'
  // )

  // Carousel state
  const [showCarousel, setShowCarousel] = useState(
    () => !localStorage.getItem('partybox_onboarded')
  )
  const [carouselSlide, setCarouselSlide] = useState(0)
  const touchStartX = useRef(null)

  // Identity modal shown after carousel "Let's Go!"
  const [showIdentityModal, setShowIdentityModal] = useState(false)

  // ── Session tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    trackAnalyticsEvent('session_start', null)
  }, [])

  const inProgressGames = getInProgressGames()

  // Hero: show only for new users with no in-progress games
  const showHero =
    !localStorage.getItem('partybox_returning_user') &&
    inProgressGames.length === 0

  // TODO: restore tabs when game count > 5
  // const tabGames = games.filter(g =>
  //   (TAB_SLUGS[activeTab] || []).includes(g.slug)
  // )

  // ── Handlers ────────────────────────────────────────────────────────────────

  // TODO: restore tabs when game count > 5
  // function selectTab(tab) {
  //   setActiveTab(tab)
  //   localStorage.setItem('partybox_home_tab', tab)
  // }

  function handlePlayGame(game) {
    if (!game) return
    localStorage.setItem('partybox_returning_user', '1')
    if (game.singleDevice) {
      navigate(`/play/${game.slug}`)
      return
    }
    if (!profile) return
    navigate(`/play/${game.slug}`)
  }

  async function handleJoinRoom() {
    if (!joinCode.trim() || !profile) return
    setLoading(true)
    setError('')
    try {
      await joinRoom(joinCode.toUpperCase(), profile.id, profile.name)
      navigate(`/room/${joinCode.toUpperCase()}`)
    } catch (e) {
      setError(t('roomNotFound') || 'Room not found. Check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Carousel helpers ────────────────────────────────────────────────────────

  function dismissCarousel(openIdentity = false) {
    localStorage.setItem('partybox_onboarded', 'true')
    setShowCarousel(false)
    if (openIdentity) setShowIdentityModal(true)
  }

  function nextCarouselSlide() {
    if (carouselSlide < 2) {
      setCarouselSlide(s => s + 1)
    } else {
      dismissCarousel(true)
    }
  }

  function prevCarouselSlide() {
    if (carouselSlide > 0) setCarouselSlide(s => s - 1)
  }

  function handleCarouselTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleCarouselTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextCarouselSlide()
      else prevCarouselSlide()
    }
    touchStartX.current = null
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col relative overflow-x-hidden">

      {/* ── Background ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ backgroundImage: 'url(/partybox-home-bg-mobile.png)' }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden sm:block"
          style={{ backgroundImage: 'url(/partybox-home-bg.png)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.75) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* CreateRoomSheet overlay */}
        {selectedGame && (
          <CreateRoomSheet
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 shadow-soft bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🎉</span>
            <h1 className="text-xl font-bold text-white tracking-tight">PartyBox</h1>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surfaceElevated text-zinc-300 hover:bg-surfaceMuted hover:text-white transition-colors text-sm font-medium border border-border/60"
                aria-label={t('profile')}
              >
                <span className="text-lg">{profile.avatar}</span>
                <span className="hidden sm:inline max-w-[100px] truncate">{profile.name}</span>
                <span className="text-accent font-semibold">{profile.xp}</span>
                <span className="text-zinc-500 text-xs">{t('xp')}</span>
              </button>
            )}
            <LangToggle />
          </div>
        </header>

        {/* ── Offline banner ─────────────────────────────────────────────────── */}
        {!online && (
          <div className="mx-4 sm:mx-6 mt-3 py-2 px-4 rounded-xl bg-accentSoft border border-accent/30 text-accent text-sm font-medium text-center">
            📴 Offline mode — all games work offline
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 py-6">

          {/* ── Hero (new users only, no in-progress games) ─────────────────── */}
          {showHero && (
            <div className="text-center mb-8 pt-2">
              <p className="text-2xl font-bold text-white">
                Party games for every situation 🎉
              </p>
              <p className="text-sm text-zinc-400 mt-2">
                Play solo, pass the phone, or challenge friends online
              </p>
            </div>
          )}

          {/* ── In-progress games strip ─────────────────────────────────────── */}
          {inProgressGames.length > 0 && (
            <div className="mb-6">
              <p className="text-accent text-sm font-semibold mb-3 uppercase tracking-wider">
                {t('gamesInProgress')}
              </p>
              <div className="flex flex-wrap gap-3">
                {inProgressGames.map(g => {
                  const title =
                    typeof g.gameTitle === 'object'
                      ? g.gameTitle[lang] || g.gameTitle.en || g.slug
                      : g.gameTitle || g.slug
                  return (
                    <Card
                      key={g.slug}
                      onClick={() => navigate(`/play/${g.slug}`)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-accent !bg-surfaceElevated/70 backdrop-blur-sm"
                    >
                      <span>▶</span>
                      <span>{title}</span>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* TODO: restore tabs when game count > 5 */}
          {/* <div className="flex border-b border-zinc-700/50 mb-6">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => selectTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 pb-3 pt-1 text-sm font-semibold transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200 rounded-full" />
                )}
              </button>
            ))}
          </div> */}

          {/* TODO: restore tabs when game count > 5 */}
          {/* <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
            {tabGames.map(game => {
              const isOnlineTab = activeTab === 'online'
              const disabled = isOnlineTab && (!online || !profile)
              const gameTitle =
                typeof game.title === 'object' ? game.title[lang] : game.title
              return (
                <Card
                  key={game.slug}
                  onClick={
                    disabled
                      ? undefined
                      : () =>
                          isOnlineTab
                            ? setSelectedGame(game)
                            : handlePlayGame(game)
                  }
                  className={`group flex flex-col items-center justify-center p-6 text-left min-h-[160px] !bg-surfaceElevated/70 backdrop-blur-sm ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="text-4xl sm:text-5xl mb-3 block" aria-hidden>
                    {game.icon}
                  </span>
                  <span className={`text-lg font-bold text-white transition-colors ${
                    !disabled ? isOnlineTab ? 'group-hover:text-blue-400' : 'group-hover:text-accent' : ''
                  }`}>
                    {gameTitle}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1">
                    {game.minPlayers}–{game.maxPlayers} {t('players')}
                  </span>
                  <span className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${
                    isOnlineTab ? 'text-blue-400' : 'text-accent'
                  }`}>
                    {isOnlineTab ? '📡' : '▶'}{' '}
                    {isOnlineTab ? t('createRoom') : t('play')}
                  </span>
                  {isOnlineTab && !online && (
                    <span className="mt-1 text-xs text-zinc-500">
                      {t('needsInternet')}
                    </span>
                  )}
                </Card>
              )
            })}
            {activeTab === 'solo' &&
              Array.from({ length: COMING_SOON_SLOTS }, (_, i) => (
                <div
                  key={`coming-soon-${i}`}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surfaceElevated/50 backdrop-blur-sm border border-border/40 min-h-[160px] cursor-default"
                >
                  <span className="text-3xl sm:text-4xl mb-3 text-zinc-600">🎮</span>
                  <span className="text-sm font-medium text-zinc-500">
                    {t('comingSoon')}
                  </span>
                </div>
              ))}
          </div> */}

          {/* ── Vertical game cards stack ────────────────────────────────────── */}
          <div className="flex flex-col gap-3 max-w-lg">
            {VISIBLE_GAMES.map(card => {
              const game = games.find(g => g.slug === card.slug)
              const disabled = card.isOnline && (!online || !profile)

              function handleClick() {
                if (disabled || !game) return
                if (card.isOnline) {
                  setSelectedGame(game)
                } else {
                  handlePlayGame(game)
                }
              }

              return (
                <button
                  key={card.slug}
                  onClick={handleClick}
                  disabled={disabled}
                  className={`w-full text-left bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-4 py-4 transition-colors ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-zinc-700/80 hover:border-zinc-600/60 active:scale-[0.99]'
                  }`}
                >
                  {/* Row 1: icon + title + mode badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl leading-none">{card.icon}</span>
                      <span className="text-base font-bold text-white">{card.title}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${card.modeBadgeClass}`}>
                      {card.modeBadge}
                    </span>
                  </div>

                  {/* Row 2: description */}
                  <p className="text-zinc-400 text-sm mb-3 leading-snug">
                    {card.description}
                  </p>

                  {/* Row 3: pills + CTA */}
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-700/60 rounded-full px-2 py-0.5 text-xs text-zinc-400">
                      {card.playersPill}
                    </span>
                    <span className="bg-zinc-700/60 rounded-full px-2 py-0.5 text-xs text-zinc-400">
                      {card.timePill}
                    </span>
                    <span
                      className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl ${
                        card.isOnline
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-500 text-zinc-900'
                      }`}
                    >
                      {card.cta}
                    </span>
                  </div>

                  {/* Offline notice for online game */}
                  {card.isOnline && !online && (
                    <p className="mt-2 text-xs text-zinc-500">{t('needsInternet')}</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Ad banner ───────────────────────────────────────────────────── */}
          <AdBanner slot="home-bottom" className="mt-8 mb-3" />

          {/* ── Join Room ───────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setJoinOpen(!joinOpen)}
              className="text-zinc-500 hover:text-zinc-300 text-sm font-medium flex items-center gap-2 transition-colors"
              aria-label={t('joinRoom')}
            >
              🚪 {t('joinRoom')}
            </button>

            {joinOpen && (
              <Card className="mt-4 w-full max-w-xs flex flex-col items-center gap-3 p-4 !bg-surfaceElevated/80 backdrop-blur-sm">
                <p className="text-zinc-400 text-sm">{t('enterCode')}</p>
                <Input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-32 text-2xl font-bold text-center tracking-widest"
                />
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setJoinOpen(false)
                      setError('')
                      setJoinCode('')
                    }}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-sm font-medium"
                  >
                    {t('back')}
                  </button>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={joinCode.length !== 4 || loading}
                    variant="primary"
                    className="!py-2 !text-sm !w-auto px-5"
                  >
                    {loading ? '...' : t('joinRoom')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* ── Onboarding Carousel (first launch only) ─────────────────────────── */}
      {showCarousel && (
        <div
          className="fixed inset-0 z-50 bg-zinc-900/95 flex flex-col select-none"
          onTouchStart={handleCarouselTouchStart}
          onTouchEnd={handleCarouselTouchEnd}
        >
          {/* Skip button — slides 0 and 1 only */}
          <div className="flex justify-end px-6 pt-6 min-h-[52px]">
            {carouselSlide < 2 && (
              <button
                onClick={() => dismissCarousel(false)}
                className="text-zinc-400 text-sm font-medium hover:text-zinc-200 transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          {/* Slide content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">

            {carouselSlide === 0 && (
              <>
                <p className="text-8xl mb-6 leading-none">🎉</p>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Welcome to PartyBox
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
                  A collection of party games you can play anywhere — solo,
                  with friends in the same room, or with people online.
                </p>
              </>
            )}

            {carouselSlide === 1 && (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">
                  3 games, every situation
                </h2>
                <div className="flex gap-3 mb-6 justify-center">
                  {[
                    { icon: '🧩', name: 'ThinkFast' },
                    { icon: '🎭', name: 'Dumb Charades' },
                    { icon: '⚡', name: 'FirstBell' },
                  ].map(g => (
                    <div
                      key={g.name}
                      className="flex flex-col items-center gap-2 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-3 py-4 min-w-[80px]"
                    >
                      <span className="text-3xl leading-none">{g.icon}</span>
                      <span className="text-xs text-zinc-300 font-medium text-center leading-tight">
                        {g.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
                  Quiz yourself solo, act out Bollywood movies at a party,
                  or race friends online.
                </p>
              </>
            )}

            {carouselSlide === 2 && (
              <>
                <p className="text-8xl mb-6 leading-none">👤</p>
                <h2 className="text-2xl font-bold text-white mb-3">
                  First, what&apos;s your name?
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
                  Pick a name and avatar to track your scores and challenge
                  friends.
                </p>
              </>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 pb-5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  i === carouselSlide ? 'bg-white' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation button */}
          <div className="px-6 pb-10">
            {carouselSlide < 2 ? (
              <button
                onClick={nextCarouselSlide}
                className="w-full py-4 rounded-2xl bg-white text-zinc-900 font-bold text-base hover:bg-zinc-100 active:scale-[0.98] transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => dismissCarousel(true)}
                className="w-full py-4 rounded-2xl bg-white text-zinc-900 font-bold text-base hover:bg-zinc-100 active:scale-[0.98] transition-all"
              >
                {"Let's Go! 🎉"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Identity modal (shown after carousel "Let's Go!") ───────────────── */}
      {showIdentityModal && (
        <PlayerIdentityModal onComplete={() => setShowIdentityModal(false)} />
      )}
    </div>
  )
}
