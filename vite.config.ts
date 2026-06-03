import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],


      manifest: {
        name: 'Point do SOM',
        short_name: 'Point do SOM',
        description: 'Painel do Cliente - Point do SOM',
        id: '/',
        display: 'standalone',
        start_url: '/',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'portrait',
        icons: [
          {
            src: 'point-logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'point-logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'point-logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

