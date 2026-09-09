# PartyBox — Game Backlog

New game mode concepts. Names + one-line descriptions only — no design/spec yet;
each gets its own detailed build prompt before implementation.

Built on the existing multiplayer engine (event-passing + room state) — not new
infrastructure, except where flagged.

All 17 concepts are kept — nothing cut. Priority waves below reflect build order,
not a keep/cut decision.

## Priority waves

**Wave 1 — no new infra, build first: ✅ COMPLETE (2026-09-09)**
- ✅ Raja Mantri Chor Sipahi — online, plum accent
- ✅ Sabse Zyada Kaun — dual-mode (offline + online), rose accent
- ✅ Tambola (Housie) — online, sapphire accent
- ✅ Bhed (Jasoos) — online, emerald accent

**Wave 2 — next up. Needs the card-dealing engine built first, then validate it with the cheapest card game:**
- Bluff (no trick-tracking needed — proves the deal/claim/reveal loop first)
- Kahani Judge

**Wave 3 — trick-taking depth, once the engine is proven:**
- Call Break
- Judgement (Kachuful)
- Court Piece (Rang)
- Bhabhi
- Satti (Sevens)

**Unscheduled — kept in backlog, no wave assigned yet:**
- Bakwaas Adaalat
- Chugli Detective
- Donkey (Gadha)
- 3-2-5 (Teen Do Paanch)
- Mendikot (Mindi)
- Codenames

## Party / social (reuse existing vote-tally + event engine)

1. ✅ **Sabse Zyada Kaun** — Room votes which player best fits a cheeky superlative; match the majority to score.
2. ✅ **Bhed (Jasoos)** — Everyone gets a secret word except one hidden outsider; players say related words aloud, then vote to find the Bhed.
3. **Bakwaas Adaalat** — Two players argue a ridiculous case ~30s each; the room votes the winner.
4. **Kahani Judge** — Fill a prompt's blank with a funny short answer; room votes the best (typing).
5. **Chugli Detective** — Everyone submits an anonymous "I once…" confession; room guesses who wrote each.
6. ✅ **Raja Mantri Chor Sipahi** — Phone secretly deals the four+ roles; Mantri guesses the Chor to protect the points.

## Card games (need a new card-dealing / trick-tracking layer — shared dependency, see epic below)

7. **Bluff** — Play cards face-down claiming a rank; anyone can call "Bluff!" and the phone reveals.
8. **Satti (Sevens)** — Build sequences up/down from the 7 in each suit; first to empty their hand wins.
9. **Donkey (Gadha)** — Pass cards to collect four of a kind; last to react is the donkey.
10. **3-2-5 (Teen Do Paanch)** — Three-player trick game; each must win an exact target of tricks.
11. **Bhabhi (Get Away)** — Shedding game; follow suit, avoid being left holding cards.
12. **Mendikot (Mindi)** — Four-player partnership trick game; capture the four 10s.
13. **Court Piece (Coatpees / Rang)** — Four-player fixed-partnership trick game; caller picks trump, race to seven tricks.
14. **Judgement (Kachuful)** — Bid exactly how many tricks you'll win each round; score only if you hit it.
15. **Call Break** — Thirteen-card spades-style trick game with per-round bidding.

## Other

16. ✅ **Tambola (Housie)** — Indian bingo; phone generates tickets, host calls numbers, players self-claim and the host manually approves each prize (built as host-verified, not auto-verified — keeps the real "shout it out" tension of the original game).
17. **Codenames** — Team spymaster gives one-word clues linking grid words; teams guess their own, avoid the assassin. (Literate audience.)

## Shared dependency epic

- **Card-dealing / trick-tracking engine** — shared shuffle/deal/trick-resolution layer required by games 7–15. Build once, reuse across all card games.
