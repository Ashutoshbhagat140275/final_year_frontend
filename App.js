import { enableScreens } from 'react-native-screens'
enableScreens()

import { useEffect } from 'react'
import { Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'

// On web, turn the exported SPA into an installable PWA: link the manifest,
// set the theme color + apple-touch icon, and register the service worker.
function usePwaSetup() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return

    const ensureHead = (selector, create) => {
      if (!document.head.querySelector(selector)) document.head.appendChild(create())
    }

    ensureHead('link[rel="manifest"]', () => {
      const link = document.createElement('link')
      link.rel = 'manifest'
      link.href = '/manifest.json'
      return link
    })
    ensureHead('meta[name="theme-color"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = '#4F46E5'
      return meta
    })
    ensureHead('meta[name="apple-mobile-web-app-capable"]', () => {
      const meta = document.createElement('meta')
      meta.name = 'apple-mobile-web-app-capable'
      meta.content = 'yes'
      return meta
    })
    ensureHead('link[rel="apple-touch-icon"]', () => {
      const link = document.createElement('link')
      link.rel = 'apple-touch-icon'
      link.href = '/icons/icon-192.png'
      return link
    })

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {})
      })
    }
  }, [])
}

export default function App() {
  usePwaSetup()

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
