import { createContext, useContext } from 'react'

// Set by Room.jsx while a royal-table game is underway, so every card
// component inside — table, bidding screens, piles, overlays — picks the
// royal look without each game threading a prop through.
export const CardVariantContext = createContext(undefined)

export function useCardVariant(explicit) {
  const fromRoom = useContext(CardVariantContext)
  return explicit ?? fromRoom
}
