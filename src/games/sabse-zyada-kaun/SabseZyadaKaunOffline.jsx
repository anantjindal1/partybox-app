import { useReducer } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'
import { reducer, getInitialState } from './reducer'
import { SetupScreenOffline } from './SetupScreenOffline'
import { RoundScreen } from './RoundScreen'
import { RoundResultScreen } from './RoundResultScreen'
import { GameEndScreenOffline } from './GameEndScreenOffline'

export default function SabseZyadaKaunOffline({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)
  const title = resolveTitle(gameTitle, lang)

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={state.phase}>
        {state.phase === 'setup' && <SetupScreenOffline state={state} dispatch={dispatch} />}
        {state.phase === 'round' && <RoundScreen state={state} dispatch={dispatch} />}
        {state.phase === 'round_result' && <RoundResultScreen state={state} dispatch={dispatch} />}
        {state.phase === 'game_end' && <GameEndScreenOffline state={state} dispatch={dispatch} />}
      </FadeIn>
    </GameChrome>
  )
}
