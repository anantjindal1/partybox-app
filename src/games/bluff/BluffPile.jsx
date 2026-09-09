import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'

const RANK_LABEL = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' }
function rankLabel(rank) {
  return RANK_LABEL[rank] ?? rank
}

export function BluffPile({ pileCount, lastPlay, players, pendingReveal, isHost, onResolveReveal }) {
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
      {lastPlay ? (
        <>
          <div className="flex" style={{ marginLeft: 0 }}>
            {lastPlay.cardIds.map((id, i) => (
              <PlayingCard key={id} face="down" size="sm" style={{ marginLeft: i === 0 ? 0 : -20 }} />
            ))}
          </div>
          <p className="text-xs text-textMuted text-center">
            <span className="font-bold text-textPrimary">{nameOf(lastPlay.playerId)}</span> claims{' '}
            {lastPlay.cardIds.length} × {rankLabel(lastPlay.claimedRank)}
          </p>
        </>
      ) : (
        <p className="text-xs text-textMuted">No cards played yet</p>
      )}
      {pileCount > 0 && (
        <p className="text-[10px] text-textMuted">{pileCount} hidden card{pileCount === 1 ? '' : 's'} in the pile</p>
      )}
    </div>
  )
}
