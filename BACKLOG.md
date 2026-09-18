# PartyBox — Game Backlog

Open items only. Shipped work (all 20 games, the shared card-dealing
engine, cross-game UX items) is trimmed from here — see git log and
project memory's `project_backlog_status.md`/`project_game_implementations.md`
for that history.

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

## Post-Wave-3 full regression pass (not yet started)

Now that every card game is built, spawn multiple agents in parallel to
comprehensively test every game in the app for regressions and bugs.
Queued since the original card-game backlog completed; never started.

## Packaging & distribution (added 2026-09-16)

- **Spin off all card games into a separate app.** Cut Bhabhi, Bluff, Call
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
  emulator/device run, no signed release build, no store listing. Actually
  shipping needs: a signed release build (keystore setup), a Play Console
  developer account, store listing assets (icon, screenshots, description,
  privacy policy — this app touches Firebase/analytics so a privacy
  policy is a hard requirement, not optional), and a real device/emulator
  test pass before submission. None of the account/store-console steps
  can be done from this environment — they need the user directly.
