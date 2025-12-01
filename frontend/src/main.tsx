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
