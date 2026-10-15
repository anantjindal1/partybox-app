import { useState, useEffect, useRef } from 'react'
import { SpadeIcon, HeartIcon, DiamondIcon, ClubIcon } from '../../components/cards/suitIcons'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'
import { BID_SUIT_KEY, formatBid } from './suitNames'
import { useLang } from '../../store/LangContext'

const SUITS = [
  { suit: 'spades', Icon: SpadeIcon, colorClass: 'text-cardBlack' },
  { suit: 'hearts', Icon: HeartIcon, colorClass: 'text-cardRed' },
  { suit: 'diamonds', Icon: DiamondIcon, colorClass: 'text-cardRed' },
  { suit: 'clubs', Icon: ClubIcon, colorClass: 'text-cardBlack' }
]

export function BiddingScreen({ myHand, seats = [], bidHistory = [], isMyTurn, isFirstTurn, currentHighBid, currentBidderName, iAlreadyPassed, onBid, onPass }) {
  const { t } = useLang()
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [selectedSuit, setSelectedSuit] = useState(null)
  const [passClicked, setPassClicked] = useState(false)
  const bidHistoryRef = useRef(null)

  // Keep the latest bid in view as the auction progresses — a fixed-
  // height scrollable list otherwise stays pinned to wherever it was
  // first scrolled, hiding new entries below the fold.
  useEffect(() => {
    if (bidHistoryRef.current) {
      bidHistoryRef.current.scrollTop = bidHistoryRef.current.scrollHeight
    }
  }, [bidHistory.length])

  // This component stays mounted for the whole 2-round auction, so a
  // round-1 Pass would otherwise leave passClicked stuck true and the
  // button permanently disabled/labeled "Passed" through a legitimate
  // round-2 turn. Reset it whenever a fresh turn starts.
  useEffect(() => {
    if (isMyTurn) setPassClicked(false)
  }, [isMyTurn])

  function handlePass() {
    setPassClicked(true)
    onPass()
  }

  const minNumber = currentHighBid ? currentHighBid.number + 1 : 7
  const numbers = []
  for (let n = minNumber; n <= 13; n++) numbers.push(n)
  // A number picked on an earlier turn (before someone else's bid raised
  // the floor) can outlive that bid and no longer appear in `numbers` at
  // all — the Bid button must not stay live for a number that's since
  // become invalid, even though it's still sitting in local state.
  const isSelectionValid = numbers.includes(selectedNumber)

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-4 max-w-lg w-full mx-auto">
      {seats.length > 0 && (
        <div className="w-full flex flex-wrap justify-center gap-2">
          {seats.map(seat => (
            <div
              key={seat.id}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-[1.5px] min-w-[86px] ${
                seat.isCurrentBidder ? 'border-cobalt bg-cobalt/10' : 'border-border bg-surfaceElevated'
              }`}
            >
              <span className="text-xs font-semibold text-textPrimary truncate max-w-[90px]">{seat.name}</span>
              {seat.isPartner && <span className="text-[10px] text-textMuted">{t('yourPartner')}</span>}
              <span className="text-[10px] font-semibold">
                {seat.isCurrentBidder
                  ? <span className="text-cobalt">{t('tBidding')}</span>
                  : seat.hasPassed
                    ? <span className="text-textMuted">{t('tPassed')}</span>
                    : seat.isHighBidder
                      ? <span className="text-cobalt">{formatBid(currentHighBid.number, currentHighBid.suit, t)}</span>
                      : <span className="text-textMuted">{t('tWaiting')}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
        {currentHighBid
          ? t('tHighBid', { bid: formatBid(currentHighBid.number, currentHighBid.suit, t) })
          : t('tNoBids')}
      </p>

      {bidHistory.length > 0 && (
        <div ref={bidHistoryRef} className="w-full max-h-44 overflow-y-auto rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          {bidHistory.map((entry, i) => (
            <div
              key={i}
              className={`flex justify-between px-3 py-1.5 text-xs ${i !== 0 ? 'border-t border-border/60' : ''}`}
            >
              <span className="font-semibold text-textPrimary">{entry.playerName}</span>
              <span className={entry.type === 'PASS' ? 'text-textMuted' : 'text-cobalt font-semibold'}>
                {entry.type === 'PASS' ? t('tPassed') : formatBid(entry.number, entry.suit, t)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-1.5">
        {myHand.map(cardId => {
          const { rank, suit } = parseCard(cardId)
          return <PlayingCard key={cardId} face="up" rank={rank} suit={suit} size="sm" />
        })}
      </div>

      {isMyTurn ? (
        <div className="flex flex-col gap-3 w-full">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
            {isFirstTurn ? t('tBidFirst') : t('tBidHigher')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {numbers.map(n => (
              <button
                key={n}
                onClick={() => setSelectedNumber(n)}
                className={`min-h-[44px] rounded-xl border-[1.5px] font-bold text-sm ${
                  selectedNumber === n ? 'border-cobalt bg-cobalt/10 text-cobalt' : 'border-border bg-surfaceElevated text-textPrimary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map(({ suit, Icon, colorClass }) => (
              <button
                key={suit}
                onClick={() => setSelectedSuit(suit)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-[1.5px] ${
                  selectedSuit === suit ? 'border-cobalt bg-cobalt/10' : 'border-border bg-surfaceElevated'
                }`}
              >
                <Icon width="22" height="22" className={colorClass} />
                <span className="text-[10px] font-semibold text-textMuted">{t(BID_SUIT_KEY[suit])}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => onBid(selectedNumber, selectedSuit)}
            disabled={!selectedNumber || !selectedSuit || !isSelectionValid}
            className="min-h-[48px] rounded-xl bg-cobalt text-onCobalt font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedNumber && selectedSuit ? t('tBidBtn', { bid: formatBid(selectedNumber, selectedSuit, t) }) : t('tPickNS')}
          </button>
          {!isFirstTurn && (
            <button
              onClick={handlePass}
              disabled={passClicked}
              className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {passClicked ? t('tPassed') : t('tPass')}
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-textMuted text-sm py-8">
          {iAlreadyPassed ? t('tAlreadyPassed') : t('tWaitingFor', { name: currentBidderName })}
        </p>
      )}
    </div>
  )
}
