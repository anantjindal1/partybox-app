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

## NEXT SESSION — start here (added 2026-09-30)

User asked to be reminded of these when they come back. Waiting on:
BillDesk KYC approval (Play payments profile), 12 testers opting in to
the closed test, Play review of v4.

**User's to-dos:**
1. v7 uploaded (2026-10-05). Testers: 12/23 opted in on 2026-10-02 — production ~2026-10-16. Upload v8 (`~/Desktop/partybox-v8.aab`, 1.0.7 — table rejoin after app kill, Open Tables "All tables", royal card table on 9 card games); supersedes v7.
2. PARKED until after production launch: BillDesk appears to want the app live before approving (they asked why the app isn't visible; user replied 2026-10-05, automated reminders continue). After approval: add bank account (Payments → How you get paid).
3. Create one-time product `remove_ads` (₹99) in Play Console, then
   RevenueCat: import product → entitlement `no_ads` → default offering
   (Lifetime package), marked Current.
4. License testing: add own Gmail, make a test purchase on a phone.
5. Delete the RevenueCat service-account JSON from ~/Downloads.
6. Tablet: uninstall the debug build, install from the Play testing link;
   check invite links open the app and that Crashlytics shows the app.
7. Add YouTube video `https://www.youtube.com/watch?v=O9nyqjPLn0w` to the
   store listing.
8. Apply for AdSense (web banners are already coded).
9. PARKED until after launch: buy a custom domain (helps BillDesk "www." field, AdSense, invite trust).
10. Send the list of game UI improvements.

**Claude's to-dos (need the user's go-ahead):**
1. Custom-domain setup once bought (Vercel + assetlinks + App Links in the
   manifest + PUBLIC_ORIGIN).
2. Legal name on terms/refund pages if BillDesk asks for it (left off on
   purpose — pages are public).
3. Flip `PLAY_STORE_LIVE` in `src/components/GetAppBanner.jsx` once the app
   is in production (banner built 2026-09-30, off).
4. Rules requiring `request.auth != null`: the app now signs in anonymously
   (Anonymous auth is already enabled, verified 2026-09-30). Before
   publishing such rules: ship v6 so installed apps carry the sign-in, and
   move the purge job + analytics dashboard off the bare API key (they'd
   403). App Check after that.

## Android launch (plan approved 2026-09-28)

Capacitor app, `com.anantjindal.partybox` (com.partybox.app was taken on Play), links on `partybox-app.vercel.app`.
Full plan: `~/.claude/plans/look-at-partybox-i-crystalline-pike.md`.

**Done (as of 2026-09-29):** Home revamp; public-origin invite links; native
shell (back, deep links, status bar, keep-awake, splash, icon, haptics on card
play / turn start); headers fit at phone width with large fonts; release
signing; Play Console app `com.anantjindal.partybox` (com.partybox.app was
taken) with listing, screenshots and forms; closed-test releases up to v3
(1.0.2); AdMob live IDs (app `~1808564745`, banner + interstitial) with the
dev tablet registered as a test device; `app-ads.txt` and
`.well-known/assetlinks.json` live and verified by Google's Digital Asset
Links API. Promo video cut at `store/video/partybox-promo.mp4` (gitignored;
goes on YouTube).

**Waiting on the 14-day closed test:** 12 testers must opt in via the Play
testing link, then 14 continuous days, then apply for production.

**Still open, in order:**

1. **Remove Ads IAP.** Code DONE (509b2db, `src/lib/purchases.js`,
   RevenueCat entitlement `no_ads`, Profile card). Waiting on: payments
   profile; product `remove_ads` in Play Console (needs v5 uploaded, it
   carries BILLING); RevenueCat product/entitlement/offering setup; a
   license-tester purchase on a real device.
2. **Crashlytics.** DONE in v4 (JS errors forwarded too); first report not
   yet seen in the Firebase console.
3. **Anonymous Auth + App Check.** User enables Anonymous auth in Firebase
   and deploys rules requiring `request.auth != null`; App Check (Play
   Integrity / reCAPTCHA) in monitor mode first. Check the purge job and
   analytics dashboard still work afterwards.
4. **Owed Firebase/GitHub steps:** deploy current `firestore.rules`
   (reactions + voice are 403 in prod); GH secrets `FIREBASE_PROJECT_ID` /
   `FIREBASE_API_KEY` for the purge job.
5. **Production:** add Purchase history to Data Safety when IAP ships; Hindi
   listing; apply for production access after the closed test; staged
   rollout at 20%.

**Web monetisation (user asked 2026-09-30):** AdSense banner on web is
already coded (`AdBanner`, env `VITE_ADSENSE_CLIENT/SLOT`) — blocked on the
user's AdSense application and approval. Web interstitials aren't practical
(AdSense vignettes need full page loads; this is an SPA). App-download nudge
on web: build it switched off, enable at production launch (the Play page
404s for non-testers until then).

**Game UI improvements:** user has a list — waiting for specifics.

**Deferred:** R8/minify (can't verify plugin breakage cheaply), web "Get the app" nudge (needs a public Play link),
content packs + Host Pro subscription (post-launch, gated on Remove Ads
conversion and weekly active hosts).

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
