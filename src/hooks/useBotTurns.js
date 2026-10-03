import { useEffect, useRef } from 'react'
import { writeAction, LOBBY_PHASES } from '../services/room'
import { isBotId, humanDelay, DEFAULT_DIFFICULTY } from '../multiplayer/bots/bots'

/**
 * Runs AI players' moves on the host's device. Each game supplies
 * `getBotTurns(roomState, actions)` → [{ botId, key, act(difficulty) → {type, payload}, delay?(difficulty) }]
 * for every bot that owes a move right now. `key` must differ between
 * a bot's consecutive decisions (e.g. phase + round + cards left) — a bot
 * never acts twice in a row on the same key, which is what stops a double
 * move while the host is between clearing actions and writing the next
 * state. Bots write
 * through the same actions subcollection humans do, so the game's own
 * host-processing effects handle them unchanged.
 */
export function useBotTurns({ code, isHost, room, roomState, actions, getBotTurns }) {
  const lastKey = useRef(new Map())

  useEffect(() => {
    if (LOBBY_PHASES.has(roomState.phase)) lastKey.current.clear()
  }, [roomState.phase])

  useEffect(() => {
    if (!isHost || LOBBY_PHASES.has(roomState.phase)) return
    const difficulty = room?.botDifficulty ?? DEFAULT_DIFFICULTY
    const timers = (getBotTurns(roomState, actions) ?? [])
      .filter(t => isBotId(t.botId))
      .filter(t => lastKey.current.get(t.botId) !== t.key)
      .filter(t => !actions.some(a => a.playerId === t.botId))
      .map(t =>
        setTimeout(() => {
          if (lastKey.current.get(t.botId) === t.key) return
          lastKey.current.set(t.botId, t.key)
          writeAction(code, t.botId, t.act(difficulty)).catch(() => lastKey.current.delete(t.botId))
        }, t.delay?.(difficulty) ?? humanDelay())
      )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, roomState, actions, room?.botDifficulty])
}
