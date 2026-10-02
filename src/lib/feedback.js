import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const FEEDBACK_NUMBER = '+919001290623'

// Resolved up front: window.open must run synchronously inside the tap, or
// mobile browsers block it as a pop-up.
let version = Capacitor.isNativePlatform() ? 'app' : 'web'
if (Capacitor.isNativePlatform()) {
  App.getInfo().then(info => { version = `app ${info.version} (${info.build})` }).catch(() => {})
}

// Prefills the WhatsApp message with what's needed to act on a report, so
// "cards froze" arrives with the game, room and build attached.
export function openFeedback({ game, roomCode } = {}) {
  const lines = [
    'PartyBox feedback:',
    '',
    '',
    '---',
    `Version: ${version}`,
    game && `Game: ${game}`,
    roomCode && `Room: ${roomCode}`,
    `Screen: ${window.location.pathname}`,
    `Device: ${navigator.userAgent.match(/\(([^)]+)\)/)?.[1] ?? 'unknown'}`,
  ].filter(line => typeof line === 'string')
  const url = `https://wa.me/${FEEDBACK_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
