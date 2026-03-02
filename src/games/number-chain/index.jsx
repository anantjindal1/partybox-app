import { useState, useEffect } from 'react'
import { useLang } from '../../store/LangContext'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { getProfile } from '../../services/profile'

const OPS = [
  { symbol: '+', label: '+', key: '+' },
  { symbol: '−', label: '−', key: '-' },
  { symbol: '×', label: '×', key: '*' },
  { symbol: '=', label: '=', key: '=' },
]

export default function NumberChain({ code }) {
  const { t } = useLang()
  const {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    clearActions,
    isHost,
    myId,
  } = useOnlineRoom(code)

  const [profile, setProfile] = useState(null)
  const [startInput, setStartInput] = useState('')
  const [selectedOp, setSelectedOp] = useState('+')
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    getProfile().then(setProfile)
  }, [])

  // Host processes incoming CHANGE actions
  useEffect(() => {
    if (!isHost || actions.length === 0 || roomState.phase !== 'playing') return
    const sorted = [...actions].sort((a, b) => (a.ts?.seconds || 0) - (b.ts?.seconds || 0))
    let current = roomState.currentNumber
    const newEntries = []
    let lastBy = roomState.lastChangedBy
    let lastByName = roomState.lastChangedByName
    for (const { playerId, action } of sorted) {
      if (action.type !== 'CHANGE') continue
      const { operation, value, playerName } = action.payload
      const from = current
      if (operation === '+') current = from + value
      else if (operation === '-') current = from - value
      else if (operation === '*') current = from * value
      else if (operation === '=') current = value
      else continue
      lastBy = playerId
      lastByName = playerName
      newEntries.push({
        playerId,
        playerName,
        operation: `${operation === '*' ? '×' : operation} ${value}`,
        from,
        to: current,
        ts: Date.now(),
      })
    }
    if (newEntries.length === 0) return
    setState({
      ...roomState,
      currentNumber: current,
      lastChangedBy: lastBy,
      lastChangedByName: lastByName,
      log: [...(roomState.log || []), ...newEntries],
    })
    clearActions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  if (!room || !myId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 animate-pulse">Connecting...</p>
      </div>
    )
  }

  async function handleStart() {
    const n = parseInt(startInput, 10)
    if (isNaN(n) || n < 1 || n > 999) return
    const playerName = profile?.name || 'Host'
    await clearActions()
    await setState({
      phase: 'playing',
      currentNumber: n,
      lastChangedBy: myId,
      lastChangedByName: playerName,
      log: [{ playerId: myId, playerName, operation: `= ${n}`, from: null, to: n, ts: Date.now() }],
    })
  }

  function handleApply() {
    if (!inputValue || !selectedOp) return
    const val = parseInt(inputValue, 10)
    if (isNaN(val) || val < 1 || val > 999) return
    sendAction({
      type: 'CHANGE',
      payload: { operation: selectedOp, value: val, playerName: profile?.name || 'Player' },
    })
    setInputValue('')
  }

  const phase = roomState.phase || 'picking'
  const log = roomState.log || []

  // Picking phase
  if (phase === 'picking') {
    return (
      <div className="space-y-4">
        {isHost ? (
          <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
            <p className="text-slate-300 font-semibold">{t('pickStartNumber')}</p>
            <input
              type="number"
              min={1}
              max={999}
              value={startInput}
              onChange={e => setStartInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              className="w-full bg-slate-700 text-white text-2xl text-center rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="1–999"
            />
            <button
              onClick={handleStart}
              className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold text-lg py-3 rounded-xl transition-colors"
            >
              {t('startChain')}
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-6 text-center">
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-slate-300">{t('waitingForStart')}</p>
          </div>
        )}
      </div>
    )
  }

  // Playing phase
  return (
    <div className="space-y-4">
      {/* Current number */}
      <div className="bg-slate-800 rounded-2xl p-5 text-center">
        <p className="text-slate-400 text-sm uppercase tracking-wide mb-1">Current Number</p>
        <p className="text-7xl font-black text-yellow-400 leading-none">{roomState.currentNumber}</p>
        {roomState.lastChangedByName && (
          <p className="text-slate-400 text-sm mt-2">Last changed by: {roomState.lastChangedByName}</p>
        )}
      </div>

      {/* Operation controls */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {OPS.map(op => (
            <button
              key={op.key}
              onClick={() => setSelectedOp(op.key)}
              className={`py-3 rounded-xl text-xl font-bold transition-colors ${
                selectedOp === op.key
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={999}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            className="flex-1 bg-slate-700 text-white text-xl text-center rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="1–999"
          />
          <button
            onClick={handleApply}
            className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-5 rounded-xl transition-colors"
          >
            {t('applyChange')}
          </button>
        </div>
      </div>

      {/* Change log */}
      <div className="bg-slate-800 rounded-2xl p-4">
        <p className="text-slate-400 text-sm uppercase tracking-wide mb-3">{t('changeLog')}</p>
        {log.length === 0 ? (
          <p className="text-slate-500 text-sm">{t('noChangesYet')}</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...log].reverse().map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-semibold truncate max-w-[40%]">{entry.playerName}</span>
                <span className="text-rose-400 font-mono">{entry.operation}</span>
                <span className="text-yellow-400 font-bold">→ {entry.to}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
