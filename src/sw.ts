import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

// Auto-update: new SW activates immediately
self.skipWaiting()
clientsClaim()

// Precache App Shell — vite-plugin-pwa injects the manifest automatically
precacheAndRoute(self.__WB_MANIFEST)

// SPA Navigation Fallback — all navigation requests serve cached index.html
const handler = createHandlerBoundToURL('/index.html')
const navigationRoute = new NavigationRoute(handler)
registerRoute(navigationRoute)
