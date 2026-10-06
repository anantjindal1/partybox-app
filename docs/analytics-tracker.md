# Analytics v2 tracker

Plan: GA4/Firebase Analytics → BigQuery as source of truth, Firestore for
game-level events, Looker Studio dashboards. Anonymous Auth uid as user id.
India-first (DPDP). iOS after 10k app users. All work ships as one PR from
branch `analytics-v2`.

Status: **Done** · **Pending** · **You** (needs a console/store step only
you can do) · **Deferred** (moved later, with reason) · **Skipped**

## P0 — trust foundations
| Item | Status | Notes |
|---|---|---|
| Common fields on every event: platform (`android_app`/`pwa`/`web`), os, appVersion, uid, sessionId, isInternal, clientTs | Done | Live-verified 2026-10-06 |
| `first_open` event; `firstSeen` set only by it | Done | Pre-2026-10-06 device docs hold last session start — use earliest event |
| Session resume: back within 30 min = same session | Done | Was: session never restarted after app backgrounded. Breaks comparability of session counts before/after deploy |
| Firestore analytics gated on consent; queue until answered; anonymous decline counter | Done | Numbers will step down on deploy (decliners no longer counted) |
| Consent banner + privacy policy text | Done | |
| Tab-close beacon could mint a new device id after storage clear | Done | |
| Enable Anonymous Auth | Done | Was already on |
| Mark own devices internal (`?internal=1` once per device/browser) | You | |
| Lock `analytics_*` rules to write-only | Deferred → after P3 | Would break daily/device counters, Delete my data, and the HTML dashboard |
| Fixed retention period in privacy policy | Deferred → with purge job | Don't promise a period nothing enforces |
| Purge job for old analytics events | Pending | |

## P1 — pipeline
| Item | Status | Notes |
|---|---|---|
| Upgrade `firebase` 10 → 12 | Done | Required by the native plugin; tests, build, room create/join smoke-tested |
| `@capacitor-firebase/analytics` + native collection off until consent | Done | Android compiles; **not yet run on a device** |
| Every consented event forwarded to GA4 (web SDK / native SDK), uid + `is_internal` user props | Done | |
| FirstBell / Dumb Charades GA-only events routed through the core | Done | |
| Delete my data resets native GA id | Done | |
| Enable Google Analytics on the Firebase project (Project settings → Integrations) | You | Without it native events go nowhere |
| Set `VITE_FIREBASE_MEASUREMENT_ID` in `.env` and Vercel | You | Not set anywhere — web GA has never run |
| GA4 data retention → 14 months | You | |
| Blaze plan + ₹500 budget alert | You | |
| GA4 → BigQuery daily export | You | |
| Link AdMob to Firebase (ad revenue events) | You | |
| Verify native events in GA4 DebugView on a phone | Pending | Needs a device connected |
| Backfill Firestore event history (Mar 2026 →) into BigQuery | Pending | After export is on |
| GA4 user deletion for web on Delete my data | Pending | Needs server-side User Deletion API |
| Release app v9 | You | Native analytics only exists from v9 onward |

## P2 — instrumentation
| Item | Status |
|---|---|
| Match events with `match_id`, is_host, human/bot count, duration, abandon phase (`Room.jsx`) | Pending |
| `room_create` / `room_join` with source (link / code / Open Tables / rejoin) | Pending |
| `invite_sent` (WhatsApp / copy) | Pending |
| Offline games match events (`PlayOffline.jsx`) | Pending |
| Rejoin attempt/result, Open Tables, AI players, spectator, voice, reactions | Pending |
| Onboarding funnel + profile set | Pending |
| `GetAppBanner` clicks + UTM-tagged Play links | Pending |
| Purchase start/complete/fail (RevenueCat) | Pending |
| Consolidate FirstBell/DC custom events into the match taxonomy | Pending |

## P3 — dashboards (Looker Studio on BigQuery)
| Item | Status |
|---|---|
| Saved SQL views: DAU/WAU/MAU, cohorts, per-game | Pending |
| 1 Executive/investor (north star, retention triangle, app vs web) | Pending |
| 3 Games — incl. per-game unique users, time, weekly trend (earlier ask) | Pending |
| 2 Growth (acquisition, K-factor, activation, web→app) | Pending |
| 4 App health (versions, crash-free, consent opt-in rate) | Pending |
| 5 Monetization (ARPDAU, ad revenue, remove-ads conversion) | Pending |
| Weekly email of dashboard 1 | Pending |
| Retire `tools/analytics-dashboard.html`; trim Firestore to game-level events | Pending |

## P4 — investor pack
| Item | Status |
|---|---|
| `docs/metrics.md` — one definition per KPI, incl. 2026-10-06 methodology break | Pending |
| Monthly frozen KPI snapshot table | Pending |
| Game-specific events for top 2–3 games | Pending |

## Skipped
| Item | Why |
|---|---|
| iOS instrumentation / ATT | iOS after 10k app users |
| CAC / paid-attribution | No paid acquisition yet |
| Google sign-in | Anonymous Auth chosen; revisit if cross-device identity matters |
