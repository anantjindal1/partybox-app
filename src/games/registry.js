import luckyNumberMeta from './lucky-number/metadata'
import LuckyNumber from './lucky-number/index.jsx'
import dumbCharadesMeta from './dumb-charades/metadata'
import DumbCharades from './dumb-charades/DumbCharades.jsx'
import tezHisabMeta from './tez-hisab/metadata.js'
import TezHisab from './tez-hisab/TezHisab.jsx'
import spotTheJugaadMeta from './spot-the-jugaad/metadata.js'
import SpotTheJugaad from './spot-the-jugaad/SpotTheJugaad.jsx'
import desiMemoryMasterMeta from './desi-memory-master/metadata.js'
import DesiMemoryMaster from './desi-memory-master/DesiMemoryMaster.jsx'
import bollywoodEmojiGuessMeta from './bollywood-emoji-guess/metadata.js'
import BollywoodEmojiGuess from './bollywood-emoji-guess/BollywoodEmojiGuess.jsx'
import rapidFireQuizMeta from './rapid-fire-quiz/metadata.js'
import TezDimaagChallenge from './rapid-fire-quiz/TezDimaagChallenge.jsx'
import categoriesMeta from './categories/metadata.js'
import AtoZDhamaka from './categories/AtoZDhamaka.jsx'

export const games = [
  { ...luckyNumberMeta, Component: LuckyNumber },
  { ...dumbCharadesMeta, Component: DumbCharades },
  { ...tezHisabMeta, Component: TezHisab },
  { ...spotTheJugaadMeta, Component: SpotTheJugaad },
  { ...desiMemoryMasterMeta, Component: DesiMemoryMaster },
  { ...bollywoodEmojiGuessMeta, Component: BollywoodEmojiGuess },
  { ...rapidFireQuizMeta, Component: TezDimaagChallenge },
  { ...categoriesMeta, Component: AtoZDhamaka }
]

export function getGame(slug) {
  return games.find(g => g.slug === slug)
}
