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
  { ...tambolaMeta,               Component: Tambola }
]

export function getGame(slug) {
  return games.find(g => g.slug === slug)
}
