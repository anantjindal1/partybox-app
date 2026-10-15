import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'
import { useLang } from '../../store/LangContext'

const RANK_KEY = { A: 'rankA', J: 'rankJ', Q: 'rankQ', K: 'rankK' }

function rankLabel(rank, t) {
  return RANK_KEY[rank] ? t(RANK_KEY[rank]) : rank
}

export function BluffPile({ pileCount, claimedRank, latestHandPlayerId, players, pendingReveal }) {
  const { t } = useLang()
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? t('player')
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
          {pendingReveal.correct ? t('bHonest') : t('bCaught')}
        </p>
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
            {t('bRoundClaim', { rank: rankLabel(claimedRank, t) })}
          </p>
          <p className="text-[10px] text-textMuted">
            {t('bLatestBy', { name: nameOf(latestHandPlayerId) })}
          </p>
        </>
      ) : (
        <p className="text-xs text-textMuted">{t('bNoRound')}</p>
      )}
      {pileCount > 0 && (
        <p className="text-[10px] text-textMuted">{pileCount === 1 ? t('bPileOne') : t('bPileN', { n: pileCount })}</p>
      )}
    </div>
  )
}
