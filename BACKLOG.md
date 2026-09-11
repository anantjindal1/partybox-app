# PartyBox — Game Backlog

New game mode concepts. Names + one-line descriptions only — no design/spec yet;
each gets its own detailed build prompt before implementation.

Built on the existing multiplayer engine (event-passing + room state) — not new
infrastructure, except where flagged.

All 17 concepts are kept — nothing cut. Priority waves below reflect build order,
not a keep/cut decision.

## HIGH PRIORITY — card-game UX gaps (raised 2026-09-10)

Affects every shipped card game (Bluff, Bhabhi, Call Break) and every
future one.

- ✅ **A. Hand sorting** — DONE (2026-09-10). `sortHand()` (suit-grouped)
  now actually wired up for Bhabhi/Call Break; new `sortHandByRank()`
  (same-rank grouped, ranks increasing) added and wired for Bluff. Both
  render-time-only, never persisted.
- ✅ **B. Highlight important cards** — DONE (2026-09-10). New
  `CardTable.highlightedCardIds` prop (reuses the existing `turn-glow`
  keyframe with a gold color). Call Break highlights its spades (trump);
  future trump games compute their own the same way.
- ✅ **C. Card-game tutorials** — DONE (2026-09-10). Bilingual (English +
  Hindi) written rules on every card game's waiting screen plus a "How
  to Play" 2-3 slide tutorial sheet, auto-dismissing the instant the
  game actually starts. New shared `GameRulesPanel`/`HowToPlaySheet`
  components. All 4 items (A/B/C/D) now complete.
- ✅ **D. Even card distribution** — DONE (2026-09-10). `dealUneven()`
  (round-robin, uneven) replaced by `dealEven()` (equal cards per player,
  leftover simply never dealt) in Bluff and Bhabhi. Reverses a deliberate
  Wave-2 design decision, per explicit request.

## Priority waves

**Wave 1 — no new infra, build first: ✅ COMPLETE (2026-09-09)**
- ✅ Raja Mantri Chor Sipahi — online, plum accent
- ✅ Sabse Zyada Kaun — dual-mode (offline + online), rose accent
- ✅ Tambola (Housie) — online, sapphire accent
- ✅ Bhed (Jasoos) — online, emerald accent

**Wave 2 — infra ✅ DONE (2026-09-09):**
- Shared card-dealing engine + card-table UI built (`src/multiplayer/{deck,deal,hand,trick}.js`, `src/components/cards/`) — see the shared dependency epic below.
- ✅ Bluff — online, indigo accent (2026-09-09). First real game built on the engine — proved it out, one small generic addition to `CardTable` (`centerSlot` prop) along the way.
- ✅ Bakwaas (renamed from "Kahani Judge") — online, fuchsia accent (2026-09-09). Fill-a-prompt's-blank + anonymous room voting, extending Sabse Zyada Kaun's prompt/tag/voting pattern with a new free-text answering phase.
- Wave 2 complete.

**Wave 3 — trick-taking depth, once the engine is proven:**
- ✅ Call Break — online, turquoise accent (2026-09-10). Exactly 4 players, spades always trump, 5-round bidding game. First real test of `dealCards()` (exact 13-per-player split) and `resolveTrick()`'s trump branch. Cumulative scores can go negative, which required deliberately diverging from Bakwaas's tie-handling/XP pattern rather than copying it verbatim.
- ✅ Judgement (Kachuful) — online, peridot accent (2026-09-10). 3-9 players, hill-shaped hand sizes (1..max..1), blind bidding then highest-bidder-picks-trump, hook rule, exact-match scoring. Most rule-complex card game built so far.
- ✅ Court Piece (Rang) — online, jade accent (2026-09-10). Exactly 4 players, fixed 2v2 partnerships (seats 0+2 vs 1+3). Two-stage deal (5 cards to call trump, then the remaining 8), caller = winner of the previous hand's final trick. First team-scored card game (not per-player) — first real use of `TableScoreBar`, first opt-in `PlayerSeat`/`CardTable` "Partner" label. Match target 7 points (kot = 2, normal win = 1), with a shutout-extension exception: if a team hits 7 while the other has won zero hands, play continues until the leader reaches 13 or the trailing team wins their first hand. Hands-won tracked and displayed separately from match points since a kot makes them diverge.
- ✅ Bhabhi — online, slate accent (2026-09-09). First real trick-taking game — first exercise of `resolveTrick()`, first no-trump caller. Sudden-death win condition (first to empty hand wins immediately) made this simpler than a classic scored trick game. Promoted Bluff's `dealUneven` into the shared engine; added `getLegalPlays()` and `CardTable`'s `disabledCardIds` prop, both reusable by the remaining Wave 3 games.
- ✅ Satti (Sevens) — online, amethyst accent (2026-09-10). 4-8 players, fifth and final Wave 3 game — no tricks, no trump, no bidding, a sequence-building shedding game instead. Full deck dealt out completely (new `dealAll()`, a deliberate one-off exception to `dealEven`'s discard-the-remainder policy — some players legitimately hold one extra card). All four 7s open independently; each suit then extends up (8...K) and down (6...A). Sudden death win (first to empty hand), with a rare fallback: if every player passes in a row, whoever holds the fewest cards wins (genuine co-winner ties supported).

**Wave 3 — COMPLETE (2026-09-10).** All 5 games shipped: Bhabhi, Call Break, Judgement, Court Piece, Satti.

**Post-Wave-3 card games — building the remaining unscheduled card games one by one (started 2026-09-11):**
- ✅ Mendikot (Mindi) — online, citrine accent (2026-09-11). Exactly 4 players, fixed 2v2 partnerships. No trump, no bidding, decided in a single hand: capture all four 10s for an outright "Mendikot" win, else whoever captured more 10s wins, a 2-2 split broken by trick count. Promoted Court Piece's team-derivation helpers into a shared `src/multiplayer/partnerships.js` rather than duplicating them.
- ✅ 3-2-5 (Teen Do Paanch) — online, orchid accent (2026-09-11). Exactly 3 players, no partnerships. Reduced 30-card deck, every hand all three players get a fixed rotating trick target (3, 2, 5 — summing to the 10-trick hand); score = tricksWon - target (surplus/deficit, not exact-match), first to 10 cumulative wins (co-winners possible). Two-stage deal, the "5"-target holder calls trump with a choice of declared (everyone sees it) or hidden (revealed only when a stuck player asks) mode — the app's first hidden/revealable-mid-hand mechanic.
- ✅ Teri — online, cobalt accent (2026-09-11). Rules specified directly by the user. Exactly 4 players, fixed 2v2 partnerships, a 2-round sequential bidding auction, and a bridge-style dummy hand — GameLead's partner's cards are shown to everyone and GameLead plays for them (partner can suggest, GameLead decides). Hands can end early once a side crosses its trick threshold, with a symmetric "Teri" exception (play continues to a full 13-trick sweep if the trailing side is still at zero). The standout mechanic: a single running score tied to whichever player currently holds the "shuffler" role, mirrored to their own team's result each hand — drop below zero and the role rotates with the score sign-flipped, cross 52 and it passes to your own partner at zero (a "burst"); the match ends once both players on a team have burst.
- Donkey (Gadha) remains — last unscheduled card game.

**Post-Wave-3 — full regression pass (not yet started):**
- Once the remaining card games are built (or whenever picked up), spawn
  multiple agents in parallel to comprehensively test every game in the app
  (Wave 1 + Wave 2 + Wave 3 + these) for regressions and bugs before moving
  on to any other unscheduled backlog item.

**Unscheduled — kept in backlog, no wave assigned yet:**
- Bakwaas Adaalat
- Chugli Detective
- Donkey (Gadha)
- Codenames

## Party / social (reuse existing vote-tally + event engine)

1. ✅ **Sabse Zyada Kaun** — Room votes which player best fits a cheeky superlative; match the majority to score.
2. ✅ **Bhed (Jasoos)** — Everyone gets a secret word except one hidden outsider; players say related words aloud, then vote to find the Bhed.
3. **Bakwaas Adaalat** — Two players argue a ridiculous case ~30s each; the room votes the winner.
4. ✅ **Bakwaas** (formerly "Kahani Judge") — Fill a prompt's blank with a funny short answer; room votes the best (typing).
5. **Chugli Detective** — Everyone submits an anonymous "I once…" confession; room guesses who wrote each.
6. ✅ **Raja Mantri Chor Sipahi** — Phone secretly deals the four+ roles; Mantri guesses the Chor to protect the points.

## Card games (need a new card-dealing / trick-tracking layer — shared dependency, see epic below)

7. ✅ **Bluff** — Play cards face-down claiming a rank; anyone can call "Bluff!" and the phone reveals (round-based: one player fixes a rank per round, others pass/add-more/challenge the latest addition only; three ways a round ends, each opening the next round with a different player).
8. ✅ **Satti (Sevens)** — Build sequences up/down from the 7 in each suit; first to empty their hand wins.
9. **Donkey (Gadha)** — Pass cards to collect four of a kind; last to react is the donkey.
10. ✅ **3-2-5 (Teen Do Paanch)** — Three-player trick game; each must win a target number of tricks (surplus/deficit scoring, not exact-match).
11. ✅ **Bhabhi (Get Away)** — Sudden-death shedding game; follow suit or dump, first to empty your hand wins immediately.
12. ✅ **Mendikot (Mindi)** — Four-player partnership trick game; capture the four 10s.
13. ✅ **Court Piece (Coatpees / Rang)** — Four-player fixed-partnership trick game; caller picks trump, race to seven match points (with a shutout-extension exception).
14. ✅ **Judgement (Kachuful)** — Bid exactly how many tricks you'll win each round; score only if you hit it.
15. ✅ **Call Break** — Thirteen-card spades-style trick game with per-round bidding.

## Other

16. ✅ **Tambola (Housie)** — Indian bingo; phone generates tickets, host calls numbers, players self-claim and the host manually approves each prize (built as host-verified, not auto-verified — keeps the real "shout it out" tension of the original game).
17. **Codenames** — Team spymaster gives one-word clues linking grid words; teams guess their own, avoid the assassin. (Literate audience.)

## Shared dependency epic

- ✅ **Card-dealing / trick-tracking engine** — DONE (2026-09-09). Shared shuffle/deal/trick-resolution layer required by games 7–15, plus a reusable card-table UI (opponent seats with face-down stacks, own hand fanned face-up, center play zone, score bar). `src/multiplayer/{deck,deal,hand,trick}.js` + `src/components/cards/`. Proven out by Bluff — `resolveTrick()` itself remains unexercised by a real game until the first Wave 3 trick-taking game.
