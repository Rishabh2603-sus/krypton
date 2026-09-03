import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Krypton Financial',
        short_name: 'Krypton',
        description: 'Financial Resilience Platform',
        theme_color: '#F9F9F8',
        background_color: '#F9F9F8',
        display: 'standalone',
        icons: [] // Ignoring icons for now since we don't have static files
      }
    })
  ],
})
