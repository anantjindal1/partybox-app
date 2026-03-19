import { lazy } from 'react'
import luckyNumberMeta from './lucky-number/metadata'
import dumbCharadesMeta from './dumb-charades/metadata'
import dumbCharadesOfflineMeta from './dumb-charades/metadata-offline.js'
import tezHisabMeta from './tez-hisab/metadata.js'
import spotTheJugaadMeta from './spot-the-jugaad/metadata.js'
import desiMemoryMasterMeta from './desi-memory-master/metadata.js'
import bollywoodEmojiGuessMeta from './bollywood-emoji-guess/metadata.js'
import thinkFastMeta from './thinkfast/metadata.js'
import categoriesMeta from './categories/metadata.js'
import numberChainMeta from './number-chain/metadata.js'
import firstBellMeta from './firstbell/metadata.js'

// Lazy-loaded game components — each game is a separate JS chunk.
// This keeps the initial bundle small for low-end devices.
const LuckyNumber       = lazy(() => import('./lucky-number/index.jsx'))
const DumbCharades      = lazy(() => import('./dumb-charades/DumbCharades.jsx'))
const DumbCharadesOffline = lazy(() => import('./dumb-charades/DumbCharades.jsx'))
const TezHisab          = lazy(() => import('./tez-hisab/TezHisab.jsx'))
const SpotTheJugaad     = lazy(() => import('./spot-the-jugaad/SpotTheJugaad.jsx'))
const DesiMemoryMaster  = lazy(() => import('./desi-memory-master/DesiMemoryMaster.jsx'))
const BollywoodEmojiGuess = lazy(() => import('./bollywood-emoji-guess/BollywoodEmojiGuess.jsx'))
const ThinkFast           = lazy(() => import('./thinkfast/ThinkFast.jsx'))
const AtoZDhamaka         = lazy(() => import('./categories/AtoZDhamaka.jsx'))
const NumberChain         = lazy(() => import('./number-chain/index.jsx'))
const FirstBell           = lazy(() => import('./firstbell/index.jsx'))

export const games = [
  { ...luckyNumberMeta,         Component: LuckyNumber },
  { ...numberChainMeta,         Component: NumberChain },
  { ...firstBellMeta,           Component: FirstBell },
  { ...dumbCharadesMeta,        Component: DumbCharades },
  { ...dumbCharadesOfflineMeta, Component: DumbCharadesOffline },
  { ...tezHisabMeta,            Component: TezHisab },
  { ...spotTheJugaadMeta,       Component: SpotTheJugaad },
  { ...desiMemoryMasterMeta,    Component: DesiMemoryMaster },
  { ...bollywoodEmojiGuessMeta, Component: BollywoodEmojiGuess },
  { ...thinkFastMeta,           Component: ThinkFast },
  { ...categoriesMeta,          Component: AtoZDhamaka }
]

export function getGame(slug) {
  return games.find(g => g.slug === slug)
}
