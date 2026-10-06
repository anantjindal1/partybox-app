jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, name) => name),
  doc: jest.fn((db, name, id) => `${name}/${id}`),
  addDoc: jest.fn(() => Promise.resolve()),
  setDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  increment: jest.fn(n => ({ inc: n })),
}))

let firestore
let core

beforeEach(() => {
  jest.resetModules()
  firestore = require('firebase/firestore')
  jest.clearAllMocks()
  core = require('../core')
})

const events = () => firestore.addDoc.mock.calls.map(([, data]) => data)
const writesTo = prefix => firestore.setDoc.mock.calls.filter(([ref]) => ref.startsWith(prefix)).map(([, data]) => data)

function configure(consent = () => true) {
  core.configureAnalytics({
    db: {},
    getDeviceId: () => 'dev-1',
    getPlatform: () => 'android_app',
    getCommonProps: async () => ({ uid: 'u-1', appVersion: '1.0.8 (9)', isInternal: false, dropped: undefined }),
    getConsent: consent,
  })
}

test('stamps platform, os and common props on every event and drops undefined fields', async () => {
  configure()
  await core.trackEvent('game_start', 'teri', { bots: 1 })

  expect(events()[0]).toMatchObject({
    event: 'game_start', deviceId: 'dev-1', game: 'teri', platform: 'android_app',
    uid: 'u-1', appVersion: '1.0.8 (9)', isInternal: false, props: { bots: 1 },
  })
  expect(events()[0]).not.toHaveProperty('dropped')
  expect(writesTo('analytics_daily')[0]).toMatchObject({ gamesStarted: { inc: 1 } })
})

test('firstSeen is written only by first_open, not by session_start', async () => {
  configure()
  await core.trackEvent('session_start', null)
  expect(writesTo('analytics_devices')[0]).not.toHaveProperty('firstSeen')

  await core.trackEvent('first_open', null)
  expect(writesTo('analytics_devices')[1]).toMatchObject({ firstSeen: 'SERVER_TS' })
})

test('events queue while consent is unanswered and flush once granted', async () => {
  let consent = null
  configure(() => consent)
  await core.trackEvent('first_open', null)
  await core.trackEvent('game_start', 'teri')
  expect(firestore.addDoc).not.toHaveBeenCalled()

  consent = true
  await core.onConsentChange()
  expect(events().map(e => e.event)).toEqual(['first_open', 'game_start'])
  expect(writesTo('analytics_daily')[0]).toMatchObject({ consentGranted: { inc: 1 } })
})

test('declining drops queued events and only bumps an anonymous counter', async () => {
  let consent = null
  configure(() => consent)
  await core.trackEvent('game_start', 'teri')

  consent = false
  await core.onConsentChange()
  await core.trackEvent('game_complete', 'teri')

  expect(firestore.addDoc).not.toHaveBeenCalled()
  const daily = writesTo('analytics_daily')
  expect(daily).toHaveLength(1)
  expect(daily[0]).toEqual({ date: expect.any(String), consentDenied: { inc: 1 } })
})

describe('session resume', () => {
  let now
  beforeEach(() => {
    now = 1_000_000
    jest.spyOn(Date, 'now').mockImplementation(() => now)
  })
  afterEach(() => jest.restoreAllMocks())

  function setHidden(hidden) {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  test('a short background keeps the session; a long one starts a new session', async () => {
    configure()
    core.startSession()
    await flush()

    now += 60_000
    setHidden(true)
    now += 5 * 60_000
    setHidden(false)
    await flush()

    now += 60_000
    setHidden(true)
    now += 31 * 60_000
    setHidden(false)
    await flush()

    const log = events().map(e => e.event)
    expect(log).toEqual(['session_start', 'session_end', 'session_end', 'session_start'])
    const [first, , second, third] = events()
    expect(second.sessionId).toBe(first.sessionId)
    expect(third.sessionId).not.toBe(first.sessionId)
    expect(second.props.durationMs).toBe(60_000)
  })
})
