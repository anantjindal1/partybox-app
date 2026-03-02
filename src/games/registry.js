import { lazy } from 'react'
import luckyNumberMeta from './lucky-number/metadata'
import dumbCharadesMeta from './dumb-charades/metadata'
import tezHisabMeta from './tez-hisab/metadata.js'
import spotTheJugaadMeta from './spot-the-jugaad/metadata.js'
import desiMemoryMasterMeta from './desi-memory-master/metadata.js'
import bollywoodEmojiGuessMeta from './bollywood-emoji-guess/metadata.js'
import rapidFireQuizMeta from './rapid-fire-quiz/metadata.js'
import categoriesMeta from './categories/metadata.js'
import numberChainMeta from './number-chain/metadata.js'
import rapidFireBattleMeta from './rapid-fire-battle/metadata.js'

// Lazy-loaded game components — each game is a separate JS chunk.
// This keeps the initial bundle small for low-end devices.
const LuckyNumber       = lazy(() => import('./lucky-number/index.jsx'))
const DumbCharades      = lazy(() => import('./dumb-charades/DumbCharades.jsx'))
const TezHisab          = lazy(() => import('./tez-hisab/TezHisab.jsx'))
const SpotTheJugaad     = lazy(() => import('./spot-the-jugaad/SpotTheJugaad.jsx'))
const DesiMemoryMaster  = lazy(() => import('./desi-memory-master/DesiMemoryMaster.jsx'))
const BollywoodEmojiGuess = lazy(() => import('./bollywood-emoji-guess/BollywoodEmojiGuess.jsx'))
const TezDimaagChallenge  = lazy(() => import('./rapid-fire-quiz/TezDimaagChallenge.jsx'))
const AtoZDhamaka         = lazy(() => import('./categories/AtoZDhamaka.jsx'))
const NumberChain         = lazy(() => import('./number-chain/index.jsx'))
const RapidFireBattle     = lazy(() => import('./rapid-fire-battle/index.jsx'))

export const games = [
  { ...luckyNumberMeta,         Component: LuckyNumber },
  { ...numberChainMeta,         Component: NumberChain },
  { ...rapidFireBattleMeta,     Component: RapidFireBattle },
  { ...dumbCharadesMeta,        Component: DumbCharades },
  { ...tezHisabMeta,            Component: TezHisab },
  { ...spotTheJugaadMeta,       Component: SpotTheJugaad },
  { ...desiMemoryMasterMeta,    Component: DesiMemoryMaster },
  { ...bollywoodEmojiGuessMeta, Component: BollywoodEmojiGuess },
  { ...rapidFireQuizMeta,       Component: TezDimaagChallenge },
  { ...categoriesMeta,          Component: AtoZDhamaka }
]

export function getGame(slug) {
  return games.find(g => g.slug === slug)
}
