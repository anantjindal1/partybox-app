# PartyBox — Game Backlog

Open items only. Shipped work (all 20 games, the shared card-dealing
engine, cross-game UX items, the 2026-09-20 playtesting round, and the
2026-09-21/28 launch-privacy prep) is trimmed from here — see git log and
project memory's `project_backlog_status.md`/`project_game_implementations.md`/
`project_playtesting_round_2026_09_20.md`/`project_launch_privacy_prep.md`
for that history.

## Launch follow-ups (added 2026-09-28)

Privacy policy, consent banner, delete-my-data, ad infra, and the daily
room-purge job are all live and verified (see `project_launch_privacy_prep.md`).
Left open:

- **Hidden-hands exposure.** Every card game's full room state — including
  every player's hand — is downloaded to every client; the UI just doesn't
  render other players' cards. Fine for a casual game among friends, real
  for ranked play and for the new Open Tables page where strangers can
  join. Fixing it properly means moving dealing/hand-state to a server the
  client can't read directly — a real architecture change, not a patch.
  DECIDED 2026-09-28: ship as-is, labelled "friendly play" on Open
  Tables; server-side fix only after moving to Blaze or on cheating
  complaints.
- **DPDP minors-consent gap.** India's DPDP Act treats anyone under 18 as
  a child requiring verifiable parental consent; PartyBox has no age gate
  or parental-consent flow. The privacy policy discloses this as a general
  audience app but doesn't solve it. Mitigation for launch: Play target
  audience 18+. Still needs a lawyer's read before scaling usage.
- **AdSense account (web only).** `AdBanner` is wired for real ads
  (env-configured; declined consent = non-personalised) but nothing renders until `VITE_ADSENSE_CLIENT` /
  `VITE_ADSENSE_SLOT` are set and an AdSense account + `public/ads.txt`
  line are in place. Account signup/verification needs the user directly.

## Analytics dashboards — gated access before going live (added 2026-09-18)

`tools/analytics-dashboard.html` (and `tools/dc-stats.html`, separately)
are plain static HTML files that read straight from Firestore via the
REST API with an embedded public API key — anyone with the URL and the
project's rules can see full usage data. Fine for local-only use (open
via `npm run dev` and visit `/tools/analytics-dashboard.html`), but NOT
fine to publish to the live Vercel URL as-is: no auth, no gate, findable
by anyone who guesses or is given the path. Needs real access control
before deploying — e.g. a basic password gate, a Vercel deployment
protection rule, or moving the read behind an authenticated endpoint
instead of the open REST API — decided and built later, deliberately
deferred for now. `tools/dc-stats.html` also still has its own standing
"never bundle into a commit" hold from earlier, unrelated DC-analytics
work — see project memory's known-issues note before touching it.

## Android launch (plan approved 2026-09-28)

Capacitor app, `com.anantjindal.partybox` (com.partybox.app was taken on Play), links on `partybox-app.vercel.app`.
Full plan: `~/.claude/plans/look-at-partybox-i-crystalline-pike.md`.

**Done and verified on a real device (Samsung tablet SM-X216B, 2026-09-28):**
Home revamp (categories + filters), public-origin invite links, native shell
(back button, deep-link handler, status bar, keep-awake, splash, icon),
release signing config, AdMob banner + interstitial on test IDs, declined
consent = non-personalised ads (banner copy + privacy policy updated).

**Critical path — the 14-day closed test starts only when a build is on the
closed track with 12 testers opted in:**

1. **First signed AAB → closed testing.** Waiting on Play Console identity
   verification. User creates the upload keystore (`keytool`) and
   `android/keystore.properties` (gitignored); then `./gradlew bundleRelease`
   (`JAVA_HOME=/opt/homebrew/opt/openjdk@21`), upload, send opt-in link.
   Bump `versionCode` in `android/app/build.gradle` on every upload.
2. **Real AdMob IDs.** Waiting on AdMob approval: app ID replaces the test ID
   in `AndroidManifest.xml`; banner/interstitial unit IDs go in
   `VITE_ADMOB_BANNER_ID` / `VITE_ADMOB_INTERSTITIAL_ID` (unset = test ads).
   Also publish a GDPR message in AdMob and set max ad rating to T.
3. **`public/.well-known/assetlinks.json`.** Needs the Play App Signing
   SHA-256 (Play Console → App integrity) after the first upload. Until
   then invite links open in the browser, not the app.
4. **Remove Ads IAP (RevenueCat).** Needs the payments profile and an
   uploaded build before Play allows creating the product. Restore button
   in Profile; entitlement read from RevenueCat, never Firestore.
5. **Crashlytics.** Needs `google-services.json` (register the Android app
   in the Firebase console) in `android/app/`.
6. **Anonymous Auth + App Check.** User enables Anonymous auth in Firebase
   and deploys rules requiring `request.auth != null`; App Check (Play
   Integrity / reCAPTCHA) in monitor mode first. Check the purge job and
   analytics dashboard still work afterwards.
7. **Play Console forms.** Store listing (EN + HI, 6–8 screenshots), Data
   Safety (mic, device ID, analytics, ads, purchases), IARC rating, target
   audience 18+. Then apply for production access, staged rollout at 20%.

**Deferred:** R8/minify (can't verify plugin breakage cheaply), haptics
(installed, not wired), web "Get the app" nudge (needs a public Play link),
content packs + Host Pro subscription (post-launch, gated on Remove Ads
conversion and weekly active hosts).

**Known test noise:** `categories dictionary › letter distribution` is flaky
(random sampling, ~1 in 4 runs); `tests/dumbCharades.reducer.test.js` imports
a deleted `scoring` module and fails to load.

## Packaging & distribution (added 2026-09-16)

- **Spin off all card games into a separate app.** DEFERRED (2026-09-28):
  contradicts the one-app Android launch; revisit after launch data. Cut Bhabhi, Bluff, Call
  Break, Court Piece, Judgement, Mendikot, Satti, Teen Do Paanch, Teri, and
  Donkey out of PartyBox and package them as their own standalone product
  (own name/branding, own registry, own Home screen), reusing the shared
  `src/multiplayer/{deck,deal,hand,trick,partnerships,turnManager}.js`
  engine and `src/components/cards/` UI system as the new app's
  foundation rather than rebuilding either. Needs real scoping before
  starting: a new repo or a monorepo split, whether Firebase
  project/config is shared or duplicated, what (if anything) stays behind
  in PartyBox itself, and whether Donkey (no `CardTable`, real-time
  reaction game rather than trick-taking) belongs in a "card games" app
  at all.
