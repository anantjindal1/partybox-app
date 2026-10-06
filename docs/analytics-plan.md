# PartyBox Analytics v2: plan

## Context
The current module (`src/lib/analytics/core.js`, `tools/analytics-dashboard.html`) answers "is anyone playing". It can't support launch decisions or investor due diligence. You want three things on top: an app vs web split, app-specific metrics, and investor-grade metrics (D1/D7/D30 retention and so on). This plan also absorbs the three gaps raised earlier: per-game users and time, retention, and per-game trends.

Decisions you made: **hybrid stack** (Firebase Analytics/GA4 → BigQuery as the source of truth, with Firestore only for game-specific events), **Anonymous Firebase Auth** as the user ID, **India-first** (DPDP Act), **iOS only after 10k app users**.

## What's wrong today
1. **Anyone can rewrite the data.** `firestore.rules:47-57` allows open read and write on every `analytics_*` collection, so anyone with the public API key can edit or delete history. That fails due diligence immediately.
2. **Game counts are per player, not per match.** Every client fires its own `game_start` (`Room.jsx:50-89`), so a 4-player game counts as 4 games.
3. **The app and web aren't told apart.** `defaultPlatform()` (`core.js:74-82`) parses the user agent only, and no app version is recorded.
4. **Retention can't be computed from the devices collection.** `firstSeen` is overwritten on every `session_start` (`core.js:131-143`).
5. **One person counts as several users.** The device ID is a localStorage UUID (`profile.js:22-31`), so web plus the app is 2 users, and clearing storage creates a new one.
6. **Consent is only half applied.** Firestore analytics are written even when a user declines, and only GA4 is gated (`analyticsSetup.js:17-28`).
7. **The dashboard can take games down.** It reads every event on each load (`analytics-dashboard.html:275-288,380-382`). That reads from the same 50k/day free Firestore quota live games use.
8. **No test-traffic filter.** Your own devices and `?testAs=` tabs inflate the numbers.

**Why the first phases come first:** retention can't be backfilled. Every week without a stable user ID, platform and version on events is a cohort lost for good. Phases 0–1 are urgent. Phases 3–4 can wait until there's traction.

---

## 1. Metric framework

### North star
**Weekly completed multiplayer games with ≥2 humans.** It captures the core value (playing together) and the growth loop (each game brings in new people), and bots can't inflate it.

### Tier A: investor and board metrics (monthly snapshot, defined once, never redefined)
| Area | Metrics |
|---|---|
| Scale | DAU, WAU, MAU (users = auth UID), split by app and web |
| Stickiness | DAU/MAU, sessions per user per day, average session length |
| Retention | Cohort triangle D1 / D7 / D30 (plus W1–W12), split by platform and acquisition source |
| Growth | New users per week, MoM growth, share organic vs invited vs store |
| Virality | Invites sent per active user, invite → join rate, joins → new users, **K-factor** |
| App | Installs, uninstalls (Play Console), first_open → first game, web → app conversion |
| Revenue | Ad revenue, ARPDAU, remove-ads conversion %, IAP revenue, rough LTV (CAC once paid acquisition starts) |
| Quality | Crash-free users % (Crashlytics), ANR rate, Play rating |

### Tier B: product and game metrics
- **Activation:** a new user completes a first multiplayer game within the first session (or D0). Track the time to get there.
- **Per game:** unique players, matches started and completed, completion %, abandonment by phase, median duration, players per match, human vs bot ratio, rematch rate, D7 retention of each game's first-time players.
- **Entry points:** home card, share link, room code, Open Tables, rejoin. Track the share of games started from each and their completion.
- **Feature adoption:** AI players, Open Tables, rejoin success rate, spectator mode, voice, reactions, persona/profile.
- **Onboarding funnel:** first open → onboarding screens → name/avatar set → first room → first game completed.

### Tier C: health and ops (light)
- Room create/join failures, Firestore permission errors, version adoption (share of users on the latest build), consent opt-in rate. A low opt-in rate shrinks every other number, so you need to know it.

---

## 2. Event taxonomy

**Common properties on every event** (added once in `core.js`):
- `uid` (anonymous auth), `device_id`, `session_id`
- `platform` = `android_app` | `web` | `pwa`, from `Capacitor.isNativePlatform()` plus `display-mode: standalone`
- `app_version` / `build` (`App.getInfo()` on native, a build-time constant on web)
- `is_internal`: a flag for your own devices and `testAs`
- client timestamp, plus a server timestamp where it's written

| Group | Events (key props) |
|---|---|
| Lifecycle | `first_open`, `session_start`, `session_end` (duration) |
| Onboarding | `onboarding_step` (step), `profile_set` (default_used) |
| Room | `room_create` (game, is_public), `room_join` (source: link/code/open_tables/rejoin, is_new_user), `invite_sent` (channel: whatsapp/copy/native_share), `rejoin_attempt` / `rejoin_result` |
| Match | `match_start` / `match_complete` / `match_abandon` (**match_id**, game, mode online/offline, is_host, human_count, bot_count, duration_ms, abandon_phase), `rematch` |
| Game-specific | 1–3 events for priority games only, via the existing `trackEvent(name, slug, props)` |
| Growth | `get_app_banner_click`, store-link clicks with UTM |
| Monetization | `ad_impression` (comes automatically through the AdMob↔Firebase link), `purchase_start` / `purchase_complete` / `purchase_fail` (RevenueCat) |

`match_id` = room code + round counter. That gives match-level counts, while player-level counts still come from the individual events.

---

## 3. Architecture
- **One API, two destinations.** `src/lib/analytics/core.js` stays the app-agnostic, portable layer. `trackEvent` sends each event to:
  - **GA4 / Firebase Analytics:** every event. Web uses the existing JS SDK in `src/firebase.js`. The app uses **`@capacitor-firebase/analytics`** (new plugin, same family as the Crashlytics plugin already installed).
  - **Firestore:** only game-specific and match events, write-only, kept small. GA4 stays the source of truth.
- **BigQuery:** turn on the daily GA4 → BigQuery export. This needs the **Blaze plan**; set a budget alert at ₹500. Cohort and retention SQL runs there.
- **Backfill:** export the existing Firestore `analytics_events` (back to March 2026) into BigQuery once, so trend history isn't lost.
- **Revenue links:** link AdMob to Firebase for ad revenue events. Track RevenueCat events client-side; use its dashboard for IAP revenue.
- **External sources, used directly and not rebuilt:**
  - Play Console: installs, uninstalls, ratings, store-listing conversion
  - Crashlytics: crash-free rate

---

## 4. Dashboards
**Looker Studio on BigQuery**, free. Access goes through your Google account, which **also closes the "gated dashboard access" backlog item**.
1. **Executive / investor:** north star, DAU/WAU/MAU, stickiness, retention triangle, growth, revenue. Split everything by platform.
2. **Growth:** acquisition mix, invite loop and K-factor, activation funnel, web → app conversion.
3. **Games:** per-game table plus weekly per-game trend. This covers the earlier ask.
4. **App health:** version adoption, crash-free %, consent opt-in rate.
5. **Monetization:** ARPDAU, ad revenue, remove-ads conversion.

Add a scheduled weekly email of dashboard 1 to yourself. **Retire `tools/analytics-dashboard.html`** once dashboard 1 is live.

## 5. Easy-to-miss items
- **Metric definitions doc** (`docs/metrics.md`): one exact definition per KPI, for example "active user = uid with ≥1 session_start that day, internal traffic excluded". Investors check that definitions stay the same over time.
- **Monthly frozen snapshot** of Tier A, saved as a table in BigQuery, so past numbers never quietly change.
- **Internal traffic exclusion** from day one.
- **DPDP compliance:**
  - Rewrite the consent text to cover usage analytics, and gate the Firestore destination on consent too.
  - Set GA4 retention to 14 months and state a fixed retention period in `public/privacy.html:114`.
  - Extend `deleteMyData.js` to call GA4 user deletion.
- **Store attribution:** UTM-tagged Play links (install referrer) on the web `GetAppBanner` and in share text.
- **Cost guardrails:** Blaze budget alert, and keep Firestore analytics writes to a minimum.

---

## Phases
**P0 — trust foundations (urgent, small)**
- Enable Anonymous Auth (console step: you). Use `auth.uid` as `uid` in `analyticsSetup.js`.
- Add the common properties (platform, app_version, session_id, is_internal) in `core.js`. Fix `firstSeen` (set it only if missing).
- `firestore.rules`: make `analytics_*` create-only, with no read, update or delete.
- Consent text and gating, plus the privacy policy retention line.

**P1 — pipeline (needs a new app version, v9)**
- Add `@capacitor-firebase/analytics`. Route `trackEvent` to GA4 on both platforms.
- You: Blaze plus budget alert, BigQuery export, AdMob link. Run the backfill script.

**P2 — instrumentation**
- `Room.jsx`: match events with full properties, room create/join with source, invite buttons (`:214-231`).
- `PlayOffline.jsx`: offline match events.
- Also: Open Tables, rejoin, bots (`BotControls.jsx`), onboarding, `GetAppBanner`, `purchases.js`, `AdBanner`.

**P3 — dashboards**
- Saved SQL views (DAU, cohorts, per-game) plus Looker Studio dashboards 1 and 3 first, then 2, 4 and 5.
- Retire the HTML dashboard.

**P4 — investor pack**
- `docs/metrics.md`, the monthly snapshot job, and game-specific events for the top 2–3 games.

**Steps only you can do:** enable Anonymous Auth, upgrade to Blaze, enable the BigQuery export, link AdMob, deploy the rules, release v9 on Play.

## Critical files
`src/lib/analytics/core.js`, `src/services/analyticsSetup.js`, `src/services/analytics.js`, `src/firebase.js`, `src/pages/Room.jsx`, `src/pages/PlayOffline.jsx`, `src/services/deleteMyData.js`, `src/components/ConsentBanner.jsx`, `firestore.rules`, `public/privacy.html`, `package.json`, `src/lib/analytics/README.md`.

## Verification
- **GA4 DebugView**, web (`?debug_mode`) and Android (`adb shell setprop debug.firebase.analytics.app com.anantjindal.partybox`): every event arrives with uid, platform and app_version.
- **Rules:** `curl` a read on `analytics_events` and expect 403. A write from the app should still succeed.
- **Match dedupe:** a 4-player test game yields 1 `match_id` and 4 player events.
- **BigQuery:** the next day's `events_YYYYMMDD` table exists. The D1 retention query is close to the Play Console figure for the same cohort (you check this).
- **Internal filter:** `testAs` tabs are excluded from dashboard 1.
- **Unit tests** for the `core.js` routing and consent gating. `npm test` stays green.
