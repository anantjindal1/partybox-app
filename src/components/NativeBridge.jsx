import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { useTheme } from '../store/ThemeContext'
import { PUBLIC_ORIGIN } from '../lib/publicUrl'

const isNative = Capacitor.isNativePlatform()
const IN_GAME = /^\/(room|play)\//

// Native-only glue: hardware back, deep links from invite URLs, status bar
// theming, and keeping the screen on during games. Renders nothing.
export default function NativeBridge() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname

  useEffect(() => {
    if (!isNative) return
    SplashScreen.hide()

    const back = App.addListener('backButton', () => {
      const path = pathRef.current
      if (path === '/') return App.exitApp()
      if (IN_GAME.test(path) && !window.confirm('Leave this game?')) return
      navigate(-1)
    })

    const deepLink = App.addListener('appUrlOpen', ({ url }) => {
      if (!url.startsWith(PUBLIC_ORIGIN)) return
      navigate(url.slice(PUBLIC_ORIGIN.length) || '/')
    })

    return () => {
      back.then(h => h.remove())
      deepLink.then(h => h.remove())
    }
  }, [navigate])

  useEffect(() => {
    if (!isNative) return
    StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light })
    StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#1C0F13' : '#FBF3E7' })
  }, [theme])

  useEffect(() => {
    if (!isNative) return
    if (IN_GAME.test(location.pathname)) KeepAwake.keepAwake()
    else KeepAwake.allowSleep()
  }, [location.pathname])

  return null
}
