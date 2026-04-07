# WorkLedger — PWA Installation Readiness
## Android & iOS Full Deployment Guide

**Prepared:** April 7, 2026  
**Session Context:** Post-Session 18 (Offline-First architecture complete)  
**Live URL:** https://workledger-lemon.vercel.app  
**Status:** PWA foundation exists — this document closes the gap to real installability

---

## 🎯 Executive Summary

| Platform | Current State | What's Missing | Effort |
|----------|--------------|----------------|--------|
| **Android (Chrome)** | ~80% ready | Icon maskable variant + correct manifest display | ~30 min |
| **iOS (Safari)** | ~40% ready | Apple meta tags, 10 icon sizes, splash screens, index.html changes | ~2–3 hours |

**The hard truth about iOS:** Apple has intentionally NOT followed the standard PWA install flow. There is no install prompt. Users must manually tap **Share → Add to Home Screen**. Your app must also carry a separate set of `<meta>` and `<link>` tags in `index.html` that Safari reads directly — the Web App Manifest alone is NOT enough for iOS.

---

## 📋 Platform Differences: The Core Issue

```
Android Chrome                          iOS Safari
─────────────────────────────────────   ─────────────────────────────────────
✅ Reads Web App Manifest natively      ❌ Partially reads manifest (iOS 17+)
✅ Shows "Add to Home Screen" banner    ❌ Manual only: Share → Add to Home Screen
✅ Respects maskable icons              ❌ Uses apple-touch-icon link tags
✅ Handles splash screens from manifest ❌ Needs apple-touch-startup-image tags
✅ Full SW Push Notifications           ⚠️  Push only on iOS 16.4+ (opt-in)
✅ Background Sync API                  ❌ Not supported
✅ Persistent IndexedDB storage         ⚠️  May clear under storage pressure
✅ Install criteria auto-detected       ❌ No detection — user-initiated only
```

---

## 🔢 Section 1: Required Icon Sizes

### 1.1 Android — What's Needed

| Size | File | Purpose |
|------|------|---------|
| 192×192 | `public/icons/icon-192.png` | ✅ Already in place |
| 512×512 | `public/icons/icon-512.png` | ✅ Already in place |
| 512×512 | `public/icons/icon-512-maskable.png` | ⚠️ MISSING — for adaptive icons |

A **maskable icon** has extra padding (safe zone = inner 80% circle) so Android can shape it into circles, squircles, etc. Use the same logo but with ~10% padding on all sides and a solid background fill.

> **Quick fix:** Duplicate `icon-512.png`, add padding + solid background colour (#0f172a or your brand colour), save as `icon-512-maskable.png`.

### 1.2 iOS — Full Required Set

Apple checks for `<link rel="apple-touch-icon">` in the HTML, not the manifest. These are the sizes you need:

| Size | File | Used For |
|------|------|---------|
| 180×180 | `public/icons/apple-touch-icon-180.png` | iPhone (most common, recommended) |
| 167×167 | `public/icons/apple-touch-icon-167.png` | iPad Pro |
| 152×152 | `public/icons/apple-touch-icon-152.png` | iPad, iPad mini |
| 120×120 | `public/icons/apple-touch-icon-120.png` | iPhone Retina (legacy) |
| 76×76  | `public/icons/apple-touch-icon-76.png`  | iPad (non-retina, legacy) |

**Critical:** These must be:
- PNG format only
- No transparency (Safari fills transparent areas with black)
- Rounded corners are added by iOS — do NOT add them yourself
- No gloss effect (deprecated)
- Solid background with logo centered

### 1.3 iOS Splash Screens (Launch Images)

Apple requires specific splash screen images for each device. Without them, the app shows a blank white screen during launch, which looks broken. Use the `<link rel="apple-touch-startup-image">` tag with media queries.

Full required set:

| Device | Size (portrait) | File |
|--------|----------------|------|
| iPhone 14 Pro Max | 1290×2796 | `splash-1290x2796.png` |
| iPhone 14 Pro | 1179×2556 | `splash-1179x2556.png` |
| iPhone 14 Plus | 1284×2778 | `splash-1284x2778.png` |
| iPhone 14 / 13 / 12 | 1170×2532 | `splash-1170x2532.png` |
| iPhone 13 mini | 1080×2340 | `splash-1080x2340.png` |
| iPhone 11 Pro Max / XS Max | 1242×2688 | `splash-1242x2688.png` |
| iPhone 11 / XR | 828×1792 | `splash-828x1792.png` |
| iPhone 11 Pro / XS / X | 1125×2436 | `splash-1125x2436.png` |
| iPhone 8 Plus / 7 Plus | 1242×2208 | `splash-1242x2208.png` |
| iPhone 8 / SE 2nd gen | 750×1334 | `splash-750x1334.png` |
| iPad Pro 12.9" (5th gen) | 2048×2732 | `splash-2048x2732.png` |
| iPad Pro 11" | 1668×2388 | `splash-1668x2388.png` |
| iPad Air (4th gen) | 1640×2360 | `splash-1640x2360.png` |
| iPad (10th gen) | 1620×2160 | `splash-1620x2160.png` |
| iPad mini (6th gen) | 1488×2266 | `splash-1488x2266.png` |

> **Practical approach:** Generate these programmatically. See Section 4 for the script.  
> Store in `public/splash/` folder.

---

## 🛠️ Section 2: Files to Create/Modify

### 2.1 `public/manifest.json` — Full Production Version

Replace your current manifest with this complete version:

```json
{
  "name": "WorkLedger",
  "short_name": "WorkLedger",
  "description": "Contract-aware work reporting for field technicians",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "lang": "en-MY",
  "categories": ["business", "productivity", "utilities"],
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "New Work Entry",
      "short_name": "New Entry",
      "description": "Create a new work entry",
      "url": "/work/new",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Pending Approvals",
      "short_name": "Approvals",
      "description": "View pending approvals",
      "url": "/work/approvals",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [],
  "related_applications": [],
  "prefer_related_applications": false
}
```

**Note on `shortcuts`:** These appear as long-press options on Android home screen icons. Very useful for technicians — quick jump to "New Entry" without opening app fully.

---

### 2.2 `index.html` — Full iOS Meta Tags Block

This is the most critical change for iOS. Add the following inside `<head>`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

    <!-- ============================================
         STANDARD PWA
    ============================================ -->
    <title>WorkLedger</title>
    <meta name="description" content="Contract-aware work reporting for field technicians" />
    <meta name="theme-color" content="#0f172a" />
    <link rel="manifest" href="/manifest.json" />

    <!-- ============================================
         iOS / APPLE SPECIFIC — CRITICAL FOR SAFARI
    ============================================ -->

    <!-- Tells Safari this is a PWA (standalone mode) -->
    <meta name="apple-mobile-web-app-capable" content="yes" />

    <!-- Status bar appearance when installed:
         "default"       = white status bar
         "black"         = black status bar
         "black-translucent" = overlaps content — use with viewport-fit=cover -->
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

    <!-- App name on home screen (defaults to page title if omitted) -->
    <meta name="apple-mobile-web-app-title" content="WorkLedger" />

    <!-- Apple Touch Icons — Safari reads these, NOT the manifest icons -->
    <!-- Fallback (iOS picks the closest size automatically) -->
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
    <!-- Explicit sizes (recommended) -->
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
    <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120.png" />
    <link rel="apple-touch-icon" sizes="76x76"   href="/icons/apple-touch-icon-76.png" />

    <!-- ============================================
         iOS SPLASH SCREENS — prevents white flash on launch
         media query = device-width × device-pixel-ratio
    ============================================ -->
    <!-- iPhone 14 Pro Max -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1290x2796.png" />
    <!-- iPhone 14 Pro -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1179x2556.png" />
    <!-- iPhone 14 Plus / 13 Pro Max / 12 Pro Max -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1284x2778.png" />
    <!-- iPhone 14 / 13 / 13 Pro / 12 / 12 Pro -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1170x2532.png" />
    <!-- iPhone 13 mini / 12 mini -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1125x2436.png" />
    <!-- iPhone 11 Pro Max / XS Max -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1242x2688.png" />
    <!-- iPhone 11 / XR -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splash/splash-828x1792.png" />
    <!-- iPhone 11 Pro / XS / X -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1125x2436.png" />
    <!-- iPhone 8 Plus / 7 Plus / 6s Plus / 6 Plus -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splash/splash-1242x2208.png" />
    <!-- iPhone SE (2nd & 3rd gen) / 8 / 7 / 6s / 6 -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splash/splash-750x1334.png" />
    <!-- iPad Pro 12.9" (3rd-6th gen) -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splash/splash-2048x2732.png" />
    <!-- iPad Pro 11" (1st-4th gen) / iPad Air 4th-5th gen -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splash/splash-1668x2388.png" />
    <!-- iPad (10th gen) -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splash/splash-1620x2160.png" />
    <!-- iPad mini (6th gen) -->
    <link rel="apple-touch-startup-image"
          media="screen and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splash/splash-1488x2266.png" />

    <!-- ============================================
         OTHER MOBILE / BROWSER META
    ============================================ -->
    <!-- Microsoft Tiles (Windows phone/Edge) -->
    <meta name="msapplication-TileColor" content="#0f172a" />
    <meta name="msapplication-TileImage" content="/icons/icon-144.png" />

    <!-- Disable phone number detection on iOS -->
    <meta name="format-detection" content="telephone=no" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### 2.3 `vite.config.js` — Complete VitePWA Configuration

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      
      // Include all assets in the precache manifest
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'icons/*.png',
        'icons/*.svg',
        'splash/*.png',
      ],

      // This injects the sw registration into the built app
      injectRegister: 'auto',

      // For iOS: disable the periodic service worker update check
      // to avoid the "new version available" toast disrupting field work
      devOptions: {
        enabled: false, // NEVER enable in dev — SW breaks HMR
      },

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
        categories: ['business', 'productivity'],
        icons: [
          { src: '/icons/icon-72.png',  sizes: '72x72',   type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'New Work Entry',
            short_name: 'New Entry',
            url: '/work/new',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
          {
            name: 'Pending Approvals',
            short_name: 'Approvals',
            url: '/work/approvals',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
        ],
      },

      workbox: {
        // App shell — cache all routes (React SPA)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/rest/],

        // Precache all built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Exclude large files from precache
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit

        runtimeCaching: [
          // ─── Supabase REST API — NetworkFirst ───────────────────────────
          // Try network, fall back to cache. Good for data that changes often
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
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

          // ─── Supabase Auth — NetworkOnly ──────────────────────────────
          // Auth must always be fresh — never cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly',
          },

          // ─── Supabase Storage (photos/attachments) — CacheFirst ───────
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
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

          // ─── Google Fonts ─────────────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
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

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Offline vendor chunk (must load before service worker)
          'vendor-offline': ['dexie'],
          // Auth chunk
          'vendor-auth': ['@supabase/supabase-js'],
          // PDF chunk (large, lazy-loaded)
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
```

---

## 🖼️ Section 3: Icon & Splash Generation Strategy

### 3.1 The Reality of Splash Screens

Creating 15+ device-specific splash screens manually is impractical. Two practical approaches:

**Option A (Recommended — Free):** Use the `pwa-asset-generator` npm package to generate all icons and splash screens automatically from a single source SVG/PNG.

```bash
# Install globally (one-time)
npm install -g pwa-asset-generator

# Generate from your logo (1024×1024 source recommended)
npx pwa-asset-generator ./public/icons/logo-source-1024.png ./public \
  --background "#0f172a" \
  --padding "20%" \
  --splash-only false \
  --icon-only false \
  --type png \
  --index ./index.html \
  --manifest ./public/manifest.json \
  --xhtml false
```

This will:
- Generate all icon sizes
- Generate all iOS splash screens
- Automatically inject `<link>` tags into `index.html`
- Automatically update `manifest.json`

**Option B (Manual — if no CLI available):** Use [pwabuilder.com](https://www.pwabuilder.com) — upload your 512×512 icon and download a complete icon/splash ZIP.

### 3.2 Source Image Requirements

Your source image for generation must be:
- At least 1024×1024 pixels (2048×2048 preferred)
- PNG or SVG format
- Logo on transparent or solid background
- Square ratio

---

## 📱 Section 4: iOS-Specific Behaviour to Document for Clients

These are **known iOS limitations** that are not bugs in WorkLedger — they are Apple's platform restrictions. Document these for clients before onboarding:

### 4.1 Installation Process (Must Guide Users)

iOS has NO automatic install prompt. You must train users to install manually:

```
iPhone:
1. Open Safari (MUST be Safari — Chrome/Firefox on iOS cannot install PWAs)
2. Navigate to https://workledger-lemon.vercel.app
3. Tap the Share button (box with upward arrow) at the bottom
4. Scroll down → tap "Add to Home Screen"
5. Edit name if desired → tap "Add"
6. App now appears on home screen with WorkLedger icon

⚠️ Important: Chrome, Firefox, Edge on iOS CANNOT install PWAs.
   Only Safari can do this on iPhone/iPad.
```

> **Recommendation:** Create a one-page PDF "Installation Guide" in BM/English for each client persona (technician, manager). Show screenshots. Keep it simple.

### 4.2 Storage Behaviour

- Safari may delete IndexedDB data when device storage is low or after 7 days of no use (pre-iOS 16.4)
- From iOS 16.4+: PWAs installed to home screen have persistent storage (no longer auto-cleared)
- **Recommendation:** Always target iOS 16.4+ users. Mention minimum iOS version in your client onboarding doc.

### 4.3 Push Notifications

- Push notifications for PWAs are only available on iOS 16.4+ AND only when the PWA is installed to home screen
- The user must explicitly grant notification permission
- This will matter for the email/approval notification feature — for iOS field technicians, browser push is the only option (WhatsApp notifications work fine as an alternative)

### 4.4 Offline Behaviour

- Works correctly when installed to home screen on iOS 16.4+
- Service Worker + IndexedDB function normally
- Full offline-first sync works as designed in Session 18
- base64 for attachments (already decided) is the correct approach — Safari has known issues with Blob storage in IndexedDB

### 4.5 Status Bar and Safe Areas

With `viewport-fit=cover` and `black-translucent` status bar:
- Content extends behind the status bar
- You need CSS `env(safe-area-inset-top)` padding on your header
- Add to your AppLayout / Header component:

```css
/* In your header's top padding */
padding-top: calc(env(safe-area-inset-top) + 1rem);
```

Or in Tailwind (with the `safe-area` plugin or custom CSS):
```jsx
<header style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
```

---

## 📋 Section 5: Implementation Checklist

### Phase A: Icons (30 min)

- [ ] Prepare 1024×1024 source logo PNG with solid background (#0f172a)
- [ ] Run `pwa-asset-generator` OR use pwabuilder.com
- [ ] Verify these files exist in `public/icons/`:
  - [ ] `icon-72.png` through `icon-512.png` (all standard sizes)
  - [ ] `icon-512-maskable.png` (with padding + solid bg)
  - [ ] `apple-touch-icon-180.png`
  - [ ] `apple-touch-icon-167.png`
  - [ ] `apple-touch-icon-152.png`
  - [ ] `apple-touch-icon-120.png`
  - [ ] `apple-touch-icon-76.png`
- [ ] Verify splash images exist in `public/splash/` (15 device sizes)

### Phase B: Config Files (20 min)

- [ ] Replace `public/manifest.json` with full version from Section 2.1
- [ ] Update `index.html` with complete iOS meta tags block from Section 2.2
- [ ] Update `vite.config.js` with complete VitePWA config from Section 2.3

### Phase C: CSS Safe Areas (15 min)

- [ ] Check `AppLayout.jsx` or `Header.jsx` for status bar overlap on notched phones
- [ ] Add `env(safe-area-inset-top)` padding to header if needed
- [ ] Add `env(safe-area-inset-bottom)` padding to `BottomNav.jsx` if it exists

### Phase D: Build & Deploy

- [ ] `npm run build` — verify no errors
- [ ] `npm run preview` — test locally on desktop
- [ ] Commit + push → Vercel auto-deploys
- [ ] Test on real devices (see Section 6)

### Phase E: iOS Testing

- [ ] Open in Safari on iPhone
- [ ] Check: no console errors in Safari DevTools (Mac → Develop → [device])
- [ ] Install via Share → Add to Home Screen
- [ ] Verify icon appears (not default icon)
- [ ] Open from home screen → verify splash screen (not white flash)
- [ ] Verify status bar looks correct (not covering header content)
- [ ] Test offline: Airplane mode → open app → navigate → verify cached data

### Phase F: Android Testing

- [ ] Open in Chrome on Android
- [ ] Check: "Add to Home Screen" banner appears (or manually via ⋮ → Add to Home Screen)
- [ ] Install → verify icon shape (maskable, rounded)
- [ ] Open from launcher → verify splash/loading behaviour
- [ ] Test offline: Airplane mode → open app → navigate → verify cached data
- [ ] Verify PWA install criteria met: run Chrome DevTools → Lighthouse → PWA audit

---

## 🔍 Section 6: Testing Tools & Commands

### Lighthouse PWA Audit (Chrome)

```
Chrome DevTools → Lighthouse tab → 
  Category: Progressive Web App ✓ 
  Device: Mobile
→ Analyze page load
```

Aim for green on:
- Installable ✅
- PWA Optimized ✅
- Service Worker registered ✅
- Works offline ✅
- Responds with 200 when offline ✅

### Real Device Remote Debugging

**Android:**
```
USB connect → Chrome → chrome://inspect → Devices
```

**iOS:**
```
USB connect → Mac → Safari → Develop → [Device Name] → [Tab]
(Enable: iPhone Settings → Safari → Advanced → Web Inspector ON)
```

### Check Service Worker in Browser

```
Chrome: DevTools → Application → Service Workers
Firefox: DevTools → Storage → Service Workers  
Safari: DevTools → Storage → Service Workers (macOS 14+)
```

### Verify IndexedDB Data

```
Chrome: DevTools → Application → IndexedDB → WorkLedgerDB
Safari: DevTools → Storage → IndexedDB
```

---

## ⚠️ Section 7: Known Gotchas

| Gotcha | Detail | Solution |
|--------|--------|---------|
| SW won't run in dev | `vite dev` never activates service worker | Test with `npm run build && npm run preview` |
| Existing SW cached | After manifest changes, old SW may serve stale data | Hard reload: Ctrl+Shift+R or clear application cache |
| iOS needs Safari | Chrome/Firefox/Edge on iOS cannot install PWAs | Document this for all client onboarding |
| Transparent icon = black | iOS renders transparent areas as black | All apple-touch-icons must have solid background |
| Safe area overlap | Notched phones (iPhone X+) content hidden behind status bar | Add `env(safe-area-inset-*)` CSS padding |
| Maskable icon safe zone | Logo must fit in inner 80% circle | Ensure 10% padding on each side in maskable icon |
| `start_url` must be in scope | If `start_url: /dashboard` but `scope: /`, it won't install | Keep `start_url: /` |
| iOS 15 and below | No persistent storage, push notifications unavailable | Document minimum iOS 16.4 requirement |
| pwa-asset-generator large output | Generates ~10MB of splash images | Host on CDN or accept initial load cost |

---

## 📊 Section 8: PWA Criteria Scorecard

Use this before every release to verify install-readiness:

| Criterion | Android Chrome | iOS Safari | Check Tool |
|-----------|---------------|-----------|------------|
| Served over HTTPS | ✅ Vercel auto | ✅ Vercel auto | Browser URL bar |
| Has Web App Manifest | ✅ | ✅ (partial) | Lighthouse |
| manifest has name + icons | ✅ | ✅ | Manifest validator |
| Has 192×192 icon | ✅ | — | manifest.json |
| Has 512×512 icon | ✅ | — | manifest.json |
| Has apple-touch-icon | — | ✅ | index.html |
| Has apple-mobile-web-app-capable | — | ✅ | index.html |
| Has apple-touch-startup-image | — | ✅ | index.html |
| Service Worker registered | ✅ | ✅ | DevTools |
| Responds when offline | ✅ | ✅ | Network throttle |
| start_url responds with 200 | ✅ | ✅ | Lighthouse |
| display: standalone | ✅ | ✅ | manifest.json |

---

## 🚀 Recommended Session Plan

Given the scope, split this into two half-sessions:

**Session 19A — PWA Icons & Meta (2 hours):**
1. Generate icons using `pwa-asset-generator` (30 min)
2. Update `index.html` with iOS meta tags (20 min)
3. Update `manifest.json` (15 min)
4. Update `vite.config.js` (20 min)
5. Build + test on Android Chrome (20 min)
6. Test on iOS Safari (15 min)

**Session 19B (or tacked onto Session 20) — Polish:**
1. Safe area insets on Header/BottomNav
2. Lighthouse audit and green-lighting
3. Create client installation guide PDF (BM + English)
4. Document iOS limitations for FEST ENT onboarding

---

*Version: 1.0*  
*Prepared by: AI Assistant for WorkLedger*  
*Target: Production-grade PWA installable on Android & iOS*
