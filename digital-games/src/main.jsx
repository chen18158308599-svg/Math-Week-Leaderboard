import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './performance.css'
import GameLoadBoundary from './components/GameLoadBoundary.jsx'
import { installHostActivity } from './integration/hostActivity.js'

const stopHostActivity = installHostActivity(window, [
  import.meta.env.VITE_LEADERBOARD_ORIGIN,
  ...(import.meta.env.VITE_HOST_ORIGINS || '').split(','),
].filter(Boolean))
if (import.meta.hot) import.meta.hot.dispose(stopHostActivity)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameLoadBoundary><App /></GameLoadBoundary>
  </StrictMode>,
)
