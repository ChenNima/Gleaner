import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { initInstallPrompt, setSWRegistration } from './lib/pwa'
import { initAnalytics } from './lib/analytics'

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setSWRegistration(registration);
      // Check for SW updates every hour
      setInterval(() => { registration.update() }, 60 * 60 * 1000)
    }
  },
})

// Auto-reload when a new SW takes control (skipWaiting + clientsClaim)
let refreshing = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return
  refreshing = true
  window.location.reload()
})
initInstallPrompt()
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
