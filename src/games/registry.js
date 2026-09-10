import { lazy } from 'react'
import dumbCharadesMeta from './dumb-charades/metadata'
import dumbCharadesOfflineMeta from './dumb-charades/metadata-offline.js'
import tezHisabMeta from './tez-hisab/metadata.js'
import spotTheJugaadMeta from './spot-the-jugaad/metadata.js'
import desiMemoryMasterMeta from './desi-memory-master/metadata.js'
import thinkFastMeta from './thinkfast/metadata.js'
import firstBellMeta from './firstbell/metadata.js'
import rajaMantriMeta from './raja-mantri/metadata.js'
import sabseZyadaKaunMeta from './sabse-zyada-kaun/metadata.js'
import sabseZyadaKaunOfflineMeta from './sabse-zyada-kaun/metadata-offline.js'
import tambolaMeta from './tambola/metadata.js'
import bhedMeta from './bhed/metadata.js'
import bluffMeta from './bluff/metadata.js'
import bakwaasMeta from './bakwaas/metadata.js'
import bhabhiMeta from './bhabhi/metadata.js'
import callBreakMeta from './call-break/metadata.js'
import judgementMeta from './judgement/metadata.js'
import courtPieceMeta from './court-piece/metadata.js'

// Lazy-loaded game components — each game is a separate JS chunk.
// This keeps the initial bundle small for low-end devices.
const DumbCharades      = lazy(() => import('./dumb-charades/DumbCharades.jsx'))
const DumbCharadesOffline = lazy(() => import('./dumb-charades/DumbCharades.jsx'))
const TezHisab          = lazy(() => import('./tez-hisab/TezHisab.jsx'))
const SpotTheJugaad     = lazy(() => import('./spot-the-jugaad/SpotTheJugaad.jsx'))
const DesiMemoryMaster  = lazy(() => import('./desi-memory-master/DesiMemoryMaster.jsx'))
const ThinkFast           = lazy(() => import('./thinkfast/ThinkFast.jsx'))
const FirstBell           = lazy(() => import('./firstbell/index.jsx'))
const RajaMantri          = lazy(() => import('./raja-mantri/index.jsx'))
const SabseZyadaKaun        = lazy(() => import('./sabse-zyada-kaun/index.jsx'))
const SabseZyadaKaunOffline = lazy(() => import('./sabse-zyada-kaun/SabseZyadaKaunOffline.jsx'))
const Tambola               = lazy(() => import('./tambola/index.jsx'))
const Bhed                  = lazy(() => import('./bhed/index.jsx'))
const Bluff                 = lazy(() => import('./bluff/index.jsx'))
const Bakwaas                = lazy(() => import('./bakwaas/index.jsx'))
const Bhabhi                 = lazy(() => import('./bhabhi/index.jsx'))
const CallBreak               = lazy(() => import('./call-break/index.jsx'))
const Judgement                = lazy(() => import('./judgement/index.jsx'))
const CourtPiece                = lazy(() => import('./court-piece/index.jsx'))

export const games = [
  { ...firstBellMeta,           Component: FirstBell },
  { ...dumbCharadesMeta,        Component: DumbCharades },
  { ...dumbCharadesOfflineMeta, Component: DumbCharadesOffline },
  { ...tezHisabMeta,            Component: TezHisab },
  { ...spotTheJugaadMeta,       Component: SpotTheJugaad },
  { ...desiMemoryMasterMeta,    Component: DesiMemoryMaster },
  { ...thinkFastMeta,           Component: ThinkFast },
  { ...rajaMantriMeta,          Component: RajaMantri },
  { ...sabseZyadaKaunMeta,        Component: SabseZyadaKaun },
  { ...sabseZyadaKaunOfflineMeta, Component: SabseZyadaKaunOffline },
  { ...tambolaMeta,               Component: Tambola },
  { ...bhedMeta,                   Component: Bhed },
  { ...bluffMeta,                   Component: Bluff },
  { ...bakwaasMeta,                  Component: Bakwaas },
  { ...bhabhiMeta,                   Component: Bhabhi },
  { ...callBreakMeta,                 Component: CallBreak },
  { ...judgementMeta,                  Component: Judgement },
  { ...courtPieceMeta,                  Component: CourtPiece }
]

export function getGame(slug) {
  return games.find(g => g.slug === slug)
}
