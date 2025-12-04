// Global error tracking for debugging storage/other runtime errors in dev
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('error', (event: ErrorEvent) => {
    try {
      const message = event.message || ''
      if (message.toLowerCase().includes('storage') || message.toLowerCase().includes('localstorage') || message.toLowerCase().includes('sessionstorage')) {
        // Provide stack details for easier debugging
        // eslint-disable-next-line no-console
        console.warn('Storage access error captured:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error && event.error.stack,
        })
      }
    } catch (err) {
      // ignore
    }
  })

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    try {
      const reason = event.reason
      const msg = typeof reason === 'string' ? reason : (reason && reason.message) || ''
      if (msg.toLowerCase().includes('storage')) {
        // eslint-disable-next-line no-console
        console.warn('Unhandled promise rejection (storage related):', event.reason)
      }
    } catch (err) {
      // ignore
    }
  })
}

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { getThemeManager } from './lib/themes/themeManager'

// Initialize theme system on app start
// This will load saved theme from localStorage and apply it
// Requirements: 1.5, 7.1, 7.2, 10.5
document.documentElement.classList.add('no-transition')

// Initialize ThemeManager (constructor applies saved theme)
getThemeManager()

// Remove no-transition class after initial render
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('no-transition')
  })
})

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
