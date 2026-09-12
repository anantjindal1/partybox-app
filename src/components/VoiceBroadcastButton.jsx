import { useState, useEffect, useRef, useCallback } from 'react'
import { db, storage } from '../firebase'
import { doc, setDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const MAX_RECORD_MS = 15000
const EXPIRE_MS = 30000 // wider than ReactionBar's 5s — upload takes real time
const COOLDOWN_MS = 2000

// Safari's audio MediaRecorder support is real but differs from
// Chrome/Firefox's — pick the first type the browser actually supports
// rather than assuming webm/opus everywhere.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type)) ?? ''
}

function extensionFor(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a'
  return 'webm'
}

export function VoiceBroadcastButton({ roomCode, playerName }) {
  const [status, setStatus] = useState('idle') // idle | recording | uploading | cooldown
  const [nowPlaying, setNowPlaying] = useState(null)
  const myId = localStorage.getItem('partybox_device_id')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const maxDurationTimerRef = useRef(null)
  const seenRef = useRef(new Set())
  const queueRef = useRef([])
  const audioElRef = useRef(null)

  const playNext = useCallback(() => {
    if (audioElRef.current || queueRef.current.length === 0) return
    const clip = queueRef.current.shift()
    const audio = new Audio(clip.url)
    audioElRef.current = audio
    setNowPlaying(clip.playerName)
    const done = () => {
      audioElRef.current = null
      setNowPlaying(null)
      playNext()
    }
    audio.addEventListener('ended', done)
    audio.addEventListener('error', done)
    audio.play().catch(done)
  }, [])

  useEffect(() => {
    if (!db || !roomCode) return
    const ref = collection(db, 'rooms', roomCode, 'voice')
    return onSnapshot(ref, snap => {
      const now = Date.now()
      snap.docs.forEach(d => {
        const v = d.data()
        if (!v.createdAt?.toMillis) return
        if (now - v.createdAt.toMillis() > EXPIRE_MS) return
        const key = `${v.playerId}-${v.createdAt.seconds}`
        if (seenRef.current.has(key)) return
        seenRef.current.add(key)
        queueRef.current.push(v)
      })
      playNext()
    })
  }, [roomCode, playNext])

  async function startRecording() {
    if (status !== 'idle' || !db || !storage || !myId || !roomCode) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = pickMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.addEventListener('dataavailable', e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      })
      recorder.addEventListener('stop', () => {
        stream.getTracks().forEach(track => track.stop())
        handleRecordingComplete(recorder.mimeType || mimeType)
      })

      recorder.start()
      setStatus('recording')
      maxDurationTimerRef.current = setTimeout(() => stopRecording(), MAX_RECORD_MS)
    } catch {
      setStatus('idle')
    }
  }

  function stopRecording() {
    clearTimeout(maxDurationTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  async function handleRecordingComplete(mimeType) {
    setStatus('uploading')
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
      const ext = extensionFor(mimeType || '')
      const path = `voice/${roomCode}/${myId}-${Date.now()}.${ext}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, blob)
      const url = await getDownloadURL(storageRef)
      await setDoc(doc(db, 'rooms', roomCode, 'voice', myId), {
        playerId: myId,
        playerName: playerName ?? 'Someone',
        url,
        createdAt: serverTimestamp()
      })
    } catch {
      // fire-and-forget, same posture as ReactionBar
    }
    setStatus('cooldown')
    setTimeout(() => setStatus('idle'), COOLDOWN_MS)
  }

  if (!db || !storage || !roomCode) return null

  const isRecording = status === 'recording'
  const isBusy = status === 'uploading' || status === 'cooldown'

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2">
      {nowPlaying && (
        <p className="text-xs text-textMuted">🔊 {nowPlaying} is talking…</p>
      )}
      <button
        type="button"
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={() => isRecording && stopRecording()}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={isBusy}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors select-none ${
          isRecording
            ? 'bg-error/80 text-white'
            : isBusy
              ? 'bg-surfaceMuted text-textMuted opacity-60'
              : 'bg-surfaceElevated text-textPrimary border border-border/60'
        }`}
      >
        {isRecording ? '🎙️ Recording… release to send' : status === 'uploading' ? 'Sending…' : '🎙️ Hold to talk'}
      </button>
    </div>
  )
}
