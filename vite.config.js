// vite.config.js
// WorkLedger — Production Vite Configuration
// Updated: PWA + iOS/Android installability (Session 19)
// ⚠️  Service workers ONLY run after: npm run build && npm run preview
//     Never test PWA/SW in npm run dev — it will NOT work.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      // Auto-update the service worker when a new build is deployed.
      // Users get the new version on next reload — no stale SW prompt.
      registerType: 'autoUpdate',

      // Inject SW registration script automatically into the built HTML.
      injectRegister: 'auto',

      // Precache: include all static assets + icons + splash screens.
      // Workbox scans the build output for JS/CSS/HTML automatically;
      // we only need to list things that live in /public directly.
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'icons/*.png',
        'icons/*.svg',
        'apple-splash-*.png',   // ✅ matches actual filenames in public/
        'apple-icon-*.png',     // ✅ matches apple-icon-180.png
      ],

      // ── DO NOT ENABLE devOptions ───────────────────────────────────────
      // Service workers break Vite HMR in dev mode.
      // Always test PWA behaviour with: npm run build && npm run preview
      devOptions: {
        enabled: false,
      },

      // ── Web App Manifest ───────────────────────────────────────────────
      // Android Chrome reads this for install criteria.
      // iOS Safari (17+) reads this partially; index.html meta tags are
      // still required for full iOS support (see index.html).
      manifest: {
        name: 'WorkLedger',
        short_name: 'WorkLedger',
        description: 'Contract-aware work reporting for field technicians',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        lang: 'en-MY',
        categories: ['business', 'productivity', 'utilities'],

        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Maskable = adaptive icon for Android (rounded, squircle, etc.)
            // Logo must be within the inner 80% "safe zone" circle.
            // Use icon-512-maskable.png: same logo but with ~10% padding +
            // solid #0f172a background fill.
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

        // Long-press shortcuts on Android launcher icon
        shortcuts: [
          {
            name: 'New Work Entry',
            short_name: 'New Entry',
            description: 'Create a new work entry',
            url: '/work/new',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
          {
            name: 'Pending Approvals',
            short_name: 'Approvals',
            description: 'Review work entries awaiting approval',
            url: '/work/approvals',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
        ],
      },

      // ── Workbox Service Worker Strategy ───────────────────────────────
      workbox: {
        // SPA fallback: all navigation requests serve index.html
        // so React Router handles the route client-side.
        navigateFallback: '/index.html',

        // Do NOT serve index.html for API calls — let those fail naturally
        // so the offline context can detect the network status accurately.
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/rest/,
          /^\/auth/,
          /^\/storage/,
        ],

        // Precache all build output assets (JS, CSS, HTML, images).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Skip files larger than 3MB from precache to keep SW lean.
        // Large PDFs or attachments are handled by runtime cache below.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        runtimeCaching: [
          // ── Supabase REST API — NetworkFirst ──────────────────────────
          // Try live network first; fall back to last-known cached response.
          // This keeps data fresh when online but usable offline.
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // ── Supabase Auth — NetworkOnly ───────────────────────────────
          // Auth endpoints must NEVER be served from cache.
          // A stale auth response would silently break login/logout.
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly',
          },

          // ── Supabase Storage (photos / attachments) — CacheFirst ──────
          // Static assets from storage bucket rarely change.
          // Cache aggressively; expire after 7 days.
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          // ── Google Fonts CSS — StaleWhileRevalidate ───────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },

          // ── Google Fonts Files — CacheFirst (immutable) ───────────────
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  // ── Build Optimisation ─────────────────────────────────────────────────
  // Split vendor bundles so the browser can cache them independently.
  // Offline-critical libs (dexie) are isolated so they load first.
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Must be cached and available before any offline sync runs
          'vendor-offline': ['dexie'],
          // Auth + DB client — loaded on every authenticated page
          'vendor-auth': ['@supabase/supabase-js'],
          // PDF generation is large and only used on report pages
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
