import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { initInstallPrompt } from './lib/pwa'
import { initAnalytics } from './lib/analytics'

registerSW({ immediate: true })
initInstallPrompt()
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
