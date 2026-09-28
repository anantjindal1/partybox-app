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
  Decide whether that's needed before ranked play or Open Tables get
  promoted, or whether to just label ranked as "friendly, not
  cheat-proof" for now.
- **DPDP minors-consent gap.** India's DPDP Act treats anyone under 18 as
  a child requiring verifiable parental consent; PartyBox has no age gate
  or parental-consent flow. The privacy policy discloses this as a general
  audience app but doesn't solve it. Needs a lawyer's read before scaling
  usage, not just an engineering fix.
- **AdSense account.** `AdBanner` is wired for real ads (env-configured,
  consent-gated) but nothing renders until `VITE_ADSENSE_CLIENT` /
  `VITE_ADSENSE_SLOT` are set and an AdSense account + `public/ads.txt`
  line are in place. Account signup/verification needs the user directly.
- **WhatsApp contact number mismatch.** The privacy policy and the
  in-app feedback link (`Home.jsx`) both use `+91 90012 90623`; the user
  separately gave `+91 99718 66240` as a contact number, which was added
  to the policy as a second line rather than replacing the existing one.
  Confirm which number is canonical and update both places to match if
  they should be the same.

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

## Packaging & distribution (added 2026-09-16)

Android launch plan (Capacitor + AdMob + RevenueCat, phased) approved
2026-09-28 — see `~/.claude/plans/look-at-partybox-i-crystalline-pike.md`.
Hidden-hands exposure ships as-is, labelled "friendly play" on Open Tables.

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
- **Package PartyBox for the Play Store.** Capacitor is already chosen and
  scaffolded (`android/`, `ios/`) — see project memory `project_architecture.md` —
  but verified only to the `./gradlew assembleDebug` compile-check stage, no
  emulator/device run, no signed release build, no store listing. Privacy
  policy is DONE (`public/privacy.html`, see "Launch follow-ups" above).
  Still needed: a signed release build (keystore setup), a Play Console
  developer account, store listing assets (icon, screenshots, description),
  the Data Safety form (declare microphone + analytics + ads), and a real
  device/emulator test pass before submission. None of the account/store-
  console steps can be done from this environment — they need the user
  directly.
