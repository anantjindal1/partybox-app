import { useEffect, useRef } from 'react'
import { writeAction, LOBBY_PHASES } from '../services/room'
import { isBotId, humanDelay, DEFAULT_DIFFICULTY } from '../multiplayer/bots/bots'

/**
 * Runs AI players' moves on the host's device. Each game supplies
 * `getBotTurns(roomState)` → [{ botId, key, act(difficulty) → {type, payload} }]
 * for every bot that owes a move right now. `key` must be unique per
 * decision within a game (e.g. phase + round + cards left) — a bot acts
 * at most once per key, which is what stops a double move while the
 * host is between clearing actions and writing the next state. Bots write
 * through the same actions subcollection humans do, so the game's own
 * host-processing effects handle them unchanged.
 */
export function useBotTurns({ code, isHost, room, roomState, actions, getBotTurns }) {
  const acted = useRef(new Set())

  useEffect(() => {
    if (LOBBY_PHASES.has(roomState.phase)) acted.current.clear()
  }, [roomState.phase])

  useEffect(() => {
    if (!isHost || LOBBY_PHASES.has(roomState.phase)) return
    const difficulty = room?.botDifficulty ?? DEFAULT_DIFFICULTY
    const timers = (getBotTurns(roomState) ?? [])
      .filter(t => isBotId(t.botId))
      .filter(t => !acted.current.has(`${t.botId}|${t.key}`))
      .filter(t => !actions.some(a => a.playerId === t.botId))
      .map(t =>
        setTimeout(() => {
          const marker = `${t.botId}|${t.key}`
          if (acted.current.has(marker)) return
          acted.current.add(marker)
          writeAction(code, t.botId, t.act(difficulty)).catch(() => acted.current.delete(marker))
        }, humanDelay())
      )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, roomState, actions, room?.botDifficulty])
}
