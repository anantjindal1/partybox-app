import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'

const RANK_LABEL = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' }
function rankLabel(rank) {
  return RANK_LABEL[rank] ?? rank
}

export function BluffPile({ pileCount, claimedRank, latestHandPlayerId, players, pendingReveal, isHost, onResolveReveal }) {
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  if (pendingReveal) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {pendingReveal.actualCardIds.map(id => {
            const { rank, suit } = parseCard(id)
            return <PlayingCard key={id} face="up" rank={rank} suit={suit} size="sm" />
          })}
        </div>
        <p className={`text-sm font-bold ${pendingReveal.correct ? 'text-indigo' : 'text-error'}`}>
          {pendingReveal.correct ? '✓ True! The claim was honest.' : '✗ Bluff caught!'}
        </p>
        {isHost && (
          <button
            onClick={onResolveReveal}
            className="min-h-[36px] px-4 rounded-lg bg-indigo text-onIndigo text-sm font-bold"
          >
            Continue →
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {claimedRank ? (
        <>
          <div className="flex">
            {Array.from({ length: Math.min(pileCount, 8) }).map((_, i) => (
              <PlayingCard key={i} face="down" size="sm" style={{ marginLeft: i === 0 ? 0 : -20 }} />
            ))}
          </div>
          <p className="text-xs text-textMuted text-center">
            Round claim: <span className="font-bold text-textPrimary">{rankLabel(claimedRank)}</span>
          </p>
          <p className="text-[10px] text-textMuted">
            Latest hand by <span className="font-bold text-textPrimary">{nameOf(latestHandPlayerId)}</span>
          </p>
        </>
      ) : (
        <p className="text-xs text-textMuted">No round open — waiting for the next player to open one</p>
      )}
      {pileCount > 0 && (
        <p className="text-[10px] text-textMuted">{pileCount} card{pileCount === 1 ? '' : 's'} in the pile</p>
      )}
    </div>
  )
}
