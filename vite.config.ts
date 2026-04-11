import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'Gleaner',
        short_name: 'Gleaner',
        description: 'GitHub-based read-only knowledge base',
        theme_color: '#18181b',
        background_color: '#18181b',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/gleaner.png', sizes: '768x768', type: 'image/png', purpose: 'any' },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
})
