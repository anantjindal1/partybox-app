import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import {
  addTurnScore, averageRating, findPrompt, leaderboard, pickNextSlot, pickPrompt, spinRotation,
} from './logic'
import { SetupOptions } from './SetupOptions'
import { SlotsEditor } from './SlotsEditor'
import { Wheel } from './Wheel'
import { TurnPanel } from './TurnPanel'
import { RatingPanel } from './RatingPanel'
import { Leaderboard, LeaderboardSheet } from './Leaderboard'

const toSlot = p => ({ id: p.id, name: p.name })

function Sheet({ onClose, children }) {
  const { t } = useLang()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-surface border-t border-border p-5 pb-8 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
        <button onClick={onClose} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('close')}
        </button>
      </div>
    </div>
  )
}

function Lobby({ s, players, isHost, busy, write, onStart }) {
  const { t } = useLang()
  const [setting, setSetting] = useState(s.setting ?? 'friends')
  const [spinMode, setSpinMode] = useState(s.spinMode ?? 'random')
  const dummies = s.dummies ?? []
  const removed = s.removed ?? []
  const slots = [...players.filter(p => !removed.includes(p.id)).map(toSlot), ...dummies]

  if (!isHost) {
    return <p className="text-center text-textMuted text-sm pt-2">{t('waitingForHostStart')}</p>
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <SetupOptions setting={setting} setSetting={setSetting} spinMode={spinMode} setSpinMode={setSpinMode} />
      <SlotsEditor
        slots={slots}
        offWheel={players.filter(p => removed.includes(p.id))}
        minSlots={0}
        onRemove={id =>
          dummies.some(d => d.id === id)
            ? write({ dummies: dummies.filter(d => d.id !== id) })
            : write({ removed: [...removed, id] })
        }
        onAddPlayer={id => write({ removed: removed.filter(r => r !== id) })}
        onAddDummy={name => write({ dummies: [...dummies, { id: `d${Date.now()}`, name, dummy: true }] })}
      />
      {slots.length < 2 && <p className="text-center text-xs text-textMuted">{t('tdNeedTwo')}</p>}
      <button
        onClick={() => onStart({ setting, spinMode, wheel: slots })}
        disabled={slots.length < 2 || busy}
        className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold text-base disabled:opacity-40"
      >
        {busy ? t('starting') : `${t('startGame')} →`}
      </button>
    </div>
  )
}

function Play({ s, players, myId, isHost, busy, write, actions, onRate, onCloseRating, onEnd }) {
  const { t } = useLang()
  const [shownRotation, setShownRotation] = useState(s.rotation)
  const [showBoard, setShowBoard] = useState(false)
  const [editing, setEditing] = useState(false)
  const wheel = s.wheel ?? []
  const revealed = shownRotation === s.rotation
  const idle = s.phase === 'play' && s.step === 'idle'
  const isPlayer = players.some(p => p.id === myId)

  function spin() {
    if (!idle || wheel.length < 2) return
    const ids = wheel.map(w => w.id)
    const { id, cycleDone } = pickNextSlot(ids, s.spinMode, s.cycleDone ?? [])
    write({
      step: 'choose',
      turn: wheel.find(w => w.id === id),
      cycleDone,
      rotation: spinRotation(s.rotation ?? 0, ids.indexOf(id), ids.length),
      type: null,
      promptId: null,
      lastResult: null,
    })
  }

  function choose(type) {
    const prompt = pickPrompt(s.setting, type, s.usedIds ?? [])
    write({
      step: 'prompt',
      type,
      promptId: prompt?.id ?? null,
      usedIds: prompt ? [...(s.usedIds ?? []), prompt.id] : s.usedIds ?? [],
    })
  }

  const raters = players.filter(p => p.id !== s.turn?.id).map(p => p.id)
  const myRating = actions.find(a => a.type === 'RATE' && a.playerId === myId && a.payload?.turnNo === s.turnNo)?.payload.value
  const ratingCount = actions.filter(a => a.type === 'RATE' && a.payload?.turnNo === s.turnNo && raters.includes(a.playerId)).length

  return (
    <div className="flex-1 flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setShowBoard(true)}
          className="min-h-[40px] px-4 rounded-xl border-[1.5px] border-border text-sm font-semibold text-textPrimary whitespace-nowrap"
        >
          {t('tdLeaderboard')}
        </button>
        {isHost && (
          <>
            <button
              onClick={() => setEditing(true)}
              disabled={!idle}
              className="min-h-[40px] px-4 rounded-xl border-[1.5px] border-border text-sm font-semibold text-textPrimary whitespace-nowrap disabled:opacity-40"
            >
              {t('players')} · {wheel.length}
            </button>
            <button
              onClick={onEnd}
              className="min-h-[40px] px-4 rounded-xl border-[1.5px] border-border text-sm font-semibold text-rose whitespace-nowrap"
            >
              {t('tdFinish')}
            </button>
          </>
        )}
      </div>

      <Wheel
        names={wheel.map(w => w.name)}
        rotation={s.rotation ?? 0}
        highlight={!idle}
        onSpinEnd={setShownRotation}
      />

      {idle && (
        <>
          {s.lastResult && (
            <p className="text-center text-sm font-semibold text-textPrimary">
              {s.lastResult.avg == null
                ? t('tdNotRated', { name: s.lastResult.name })
                : t('tdScored', { name: s.lastResult.name, score: s.lastResult.avg.toFixed(1) })}
            </p>
          )}
          {isHost ? (
            <button
              onClick={spin}
              disabled={busy || wheel.length < 2}
              className="min-h-[56px] rounded-2xl bg-rose text-onRose font-black text-xl disabled:opacity-40"
            >
              {t('tdSpin')}
            </button>
          ) : (
            <p className="text-center text-sm text-textMuted">{t('tdWaitSpin')}</p>
          )}
        </>
      )}

      {!idle && !revealed && <p className="text-center text-textMuted font-semibold">{t('tdSpinning')}</p>}

      {s.phase === 'play' && !idle && revealed && s.turn && (
        <TurnPanel
          name={s.turn.name}
          isMe={s.turn.id === myId}
          type={s.type}
          prompt={s.type ? findPrompt(s.setting, s.type, s.promptId) : null}
          canAct={isHost && !busy}
          onChoose={choose}
          onSkip={() => choose(s.type)}
          onDone={() => write({ phase: 'rating', turnNo: (s.turnNo ?? 0) + 1 }, true)}
        />
      )}

      {s.phase === 'rating' && s.turn && (
        <RatingPanel
          turn={s.turn}
          type={s.type}
          isTurnPlayer={s.turn.id === myId}
          canRate={isPlayer && raters.includes(myId)}
          myRating={myRating}
          count={ratingCount}
          total={raters.length}
          isHost={isHost}
          onRate={onRate}
          onClose={onCloseRating}
        />
      )}

      {showBoard && <LeaderboardSheet rows={leaderboard(s.scores ?? {})} onClose={() => setShowBoard(false)} />}

      {editing && (
        <Sheet onClose={() => setEditing(false)}>
          <SlotsEditor
            slots={wheel}
            offWheel={players.filter(p => !wheel.some(w => w.id === p.id))}
            minSlots={2}
            onRemove={id => write({ wheel: wheel.filter(w => w.id !== id), cycleDone: (s.cycleDone ?? []).filter(c => c !== id) })}
            onAddPlayer={id => write({ wheel: [...wheel, toSlot(players.find(p => p.id === id))] })}
            onAddDummy={name => write({ wheel: [...wheel, { id: `d${Date.now()}`, name, dummy: true }] })}
          />
        </Sheet>
      )}
    </div>
  )
}

export default function TruthDareOnline({ code }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const { room, roomState: s, actions, sendAction, setState, clearActions, isHost, myId, players } = useOnlineRoom(code)
  const phase = s.phase || 'waiting'
  const [busy, setBusy] = useState(false)
  const closedTurn = useRef(null)

  // Host is the only writer, so every write is a full replace built on the
  // latest snapshot. `clear` wipes the actions (ratings) first.
  async function write(patch, clear = false) {
    if (busy) return
    setBusy(true)
    try {
      if (clear) await clearActions()
      await setState({ ...s, ...patch })
    } finally {
      setBusy(false)
    }
  }

  const raters = players.filter(p => p.id !== s.turn?.id).map(p => p.id)
  const ratings = actions
    .filter(a => a.type === 'RATE' && a.payload?.turnNo === s.turnNo && raters.includes(a.playerId))
    .map(a => a.payload.value)

  async function closeRating() {
    if (phase !== 'rating' || closedTurn.current === s.turnNo) return
    closedTurn.current = s.turnNo
    const avg = averageRating(ratings)
    try {
      await clearActions()
      await setState({
        ...s,
        phase: 'play',
        step: 'idle',
        type: null,
        promptId: null,
        scores: avg == null ? s.scores ?? {} : addTurnScore(s.scores ?? {}, s.turn.id, s.turn.name, avg),
        lastResult: { name: s.turn.name, avg },
      })
    } catch (e) {
      closedTurn.current = null
      throw e
    }
  }

  useEffect(() => {
    if (isHost && phase === 'rating' && ratings.length >= raters.length) closeRating()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, ratings.length, raters.length, s.turnNo])

  function start({ setting, spinMode, wheel }) {
    write(
      {
        phase: 'play',
        setting,
        spinMode,
        wheel,
        rotation: s.rotation ?? 0,
        cycleDone: [],
        step: 'idle',
        turn: null,
        type: null,
        promptId: null,
        usedIds: [],
        scores: {},
        lastResult: null,
        turnNo: s.turnNo ?? 0,
      },
      true,
    )
  }

  async function playAgain() {
    await clearActions()
    await setState({
      phase: 'waiting',
      setting: s.setting,
      spinMode: s.spinMode,
      dummies: s.dummies ?? [],
      removed: s.removed ?? [],
      rotation: s.rotation ?? 0,
      turnNo: s.turnNo ?? 0,
    })
  }

  if (!room || !myId) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-textMuted animate-pulse">{t('connecting')}</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return <Lobby s={s} players={players} isHost={isHost} busy={busy} write={write} onStart={start} />
  }

  if (phase === 'results') {
    return (
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        <p className="text-center text-2xl font-black font-display text-textPrimary">{t('tdFinal')}</p>
        <Leaderboard rows={leaderboard(s.scores ?? {})} />
        {isHost && (
          <button onClick={playAgain} className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold">
            {t('rematch')}
          </button>
        )}
        <button onClick={() => navigate('/')} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('home')}
        </button>
      </div>
    )
  }

  return (
    <Play
      s={s}
      players={players}
      myId={myId}
      isHost={isHost}
      busy={busy}
      write={write}
      actions={actions}
      onRate={value => sendAction({ type: 'RATE', payload: { turnNo: s.turnNo, value } })}
      onCloseRating={closeRating}
      onEnd={() => write({ phase: 'results' })}
    />
  )
}
