# Portable usage-analytics module

A small, dependency-light analytics core (`core.js`) for anonymous
product analytics: unique users, sessions, session/screen time, a
start→complete→abandon funnel per "thing" (game, screen, flow — whatever
you call `trackEvent` with), and daily counters ready to plot as a trend.

No login, no PII, no server — just a Firestore project and a couple of
open collections. Built for PartyBox, designed to be lifted wholesale
into another app.

## What it needs from the host app

- A Firestore instance (`getFirestore(app)` from `firebase/firestore`).
- A way to get a stable anonymous id per user/device (a UUID in
  `localStorage` works fine — see `src/services/profile.js`'s
  `getDeviceId()` in this app for the reference implementation).

That's it. `core.js` itself imports nothing from the rest of the app.

## Wiring it into a new app

1. Copy `src/lib/analytics/core.js` into the new app (with or without
   this README).
2. Add the matching Firestore rules (see below) and deploy them.
3. Once, at app startup, call:

   ```js
   import { configureAnalytics, startSession } from './lib/analytics/core'

   configureAnalytics({
     db,                                  // your Firestore instance
     getDeviceId: () => myDeviceIdFn(),   // sync or async, your choice
   })
   startSession()                         // starts the session-time clock
   ```

4. Anywhere in the app, call `trackEvent(event, thing, props)`:

   ```js
   import { trackEvent } from './lib/analytics/core'

   trackEvent('game_start', 'my-game-slug')
   trackEvent('game_complete', 'my-game-slug', { score: 42 })
   ```

   `event` is a free-form string. Four names get special treatment (see
   below); everything else still logs fine, it just won't roll up into
   `analytics_daily` unless you add it to `DAILY_FIELD` in `core.js`.

   `thing` is usually a game/screen slug, or `null` for app-level events
   (`session_start` is `null`, since it isn't about any one game).

That's the entire integration surface. In PartyBox specifically, most
games don't call `trackEvent` at all — see "How PartyBox wires this up"
below for the zero-per-game-code approach used here.

## Firestore rules (required)

```
match /analytics_events/{docId}  { allow read, write: if true; }
match /analytics_devices/{docId} { allow read, write: if true; }
match /analytics_daily/{docId}   { allow read, write: if true; }
```

Reads are public because dashboards are expected to read via the
Firestore REST API directly (no SDK, no auth) — see "Building a
dashboard" below. If you don't want public reads, drop the `read` rule
and build your dashboard as an authenticated Cloud Function or an admin
script instead; the write side doesn't change either way.

**This rule change has to actually be deployed** (Firebase Console →
Firestore → Rules → Publish, or `firebase deploy --only firestore:rules`)
— editing the `firestore.rules` file alone does nothing until it's
published. A write can still succeed against stale rules while reads
404/403 if only the write rule was ever deployed; if a dashboard shows
403s but the app's own writes work, this is almost always why.

## Data shape

Three flat collections, no subcollections:

- **`analytics_events`** — one doc per event: `{ event, deviceId, game, ts, props }`.
  This is the raw log everything else can be recomputed from.
- **`analytics_devices`** — one doc per device, upserted every session:
  `{ deviceId, firstSeen, lastSeen, sessionCount, platform, totalTimeMs }`.
  Row count = unique users. `totalTimeMs` accumulates screen time.
- **`analytics_daily`** — one doc per calendar day (`YYYY-MM-DD`):
  counters incremented per event type (`sessions`, `gamesStarted`,
  `gamesCompleted`, `gamesAbandoned`, `rematches`, `totalTimeMs`, ...).
  This is what makes a 14/30/90-day trend chart a single cheap query.

## Session / screen time

Deliberately the simplest thing that works: one timestamp recorded at
`startSession()`, one duration computed when the tab is hidden or closed
(`visibilitychange` / `pagehide`) and logged as `session_end` with
`durationMs`. No heartbeat, no polling, no ongoing cost while the app
sits idle in a background tab.

**On tab close specifically**, a normal async Firestore write often loses
the race against the browser tearing the page down — confirmed live
while building this (the write simply never landed). Pass `restBeacon:
{ projectId, apiKey }` to `configureAnalytics()` and `endSession()` will
use `navigator.sendBeacon()` for that one write instead, which browsers
guarantee to deliver even mid-unload. A beacon can only make one
fire-and-forget request, so that path writes ONLY the raw
`analytics_events` entry — it skips the `analytics_devices`/
`analytics_daily` rollup increments the normal path also does. A
dashboard should sum `session_end` events' `durationMs` straight from
the event log for session-time metrics (as the reference dashboard
does), not rely on those pre-aggregated fields, since this is the one
event type that can legitimately arrive via either path.

## Building a dashboard

Fetch the three collections via the Firestore REST API
(`https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/{collection}?key={API_KEY}`)
from a plain static HTML file — no build step, no npm install, works
from a `file://` URL. `tools/analytics-dashboard.html` in this repo is
the reference implementation: unique users, sessions, a 14-day trend,
a per-"thing" breakdown table (auto-discovered from `analytics_events`,
no hardcoded list), a funnel, and top devices. Copy it as a starting
point for a new app; it only assumes the three collections above.

Three easy-to-miss gotchas, all already handled in the reference
dashboard, worth keeping if you fork it:
- The REST API needs `?key=<API_KEY>` even when your rules allow
  anonymous reads — Firestore's API-gateway auth layer sits in front of
  your security rules, not instead of them.
- Page through `nextPageToken` on every fetch. `analytics_events` grows
  fast; a single-page fetch will silently truncate and quietly
  under-count everything computed from it.
- The REST API's field-value unwrapping is recursive: a `mapValue` field
  (like `props`) comes back as `{ fields: { key: { stringValue: ... } } }`,
  not a plain object. Unwrap it recursively (see `fv()`/`fvMap()` in the
  reference dashboard) — a shallow unwrap silently turns every event's
  `props` into `{}` for anything downstream that does `Object.keys(props)`,
  which looks like "this event just has no extra data" instead of an error.

## How PartyBox wires this up (example integration)

- `src/services/analyticsSetup.js` — the only file that connects this
  generic core to PartyBox's own Firebase instance and device-id system.
  Calls `configureAnalytics()` + `startSession()` once, from `App.jsx`.
- `src/pages/Room.jsx` — fires `game_start` / `game_complete` /
  `game_abandon` / `rematch` automatically for every online multiplayer
  game, driven off the shared `roomState.phase` state machine every game
  already has. This is what makes it "plug and play": a new game gets
  full funnel tracking for free, no code in the game itself required.
- A game that wants richer tracking than the generic funnel (its own
  event names, extra props) can still opt out of the generic layer via
  `metadata.js`'s `analyticsSelfInstrumented: true` and call `trackEvent`
  directly wherever it wants — see FirstBell or Dumb Charades for the
  pattern. Skipping that flag while also calling `trackEvent` yourself
  double-counts the generic funnel events, so pick one or the other per
  game, not both.
