/**
 * WorkLedger — PWA Install Button
 *
 * Shows a "Install App" button when the browser signals the app is
 * installable. Hidden when already running in standalone mode (installed).
 *
 * ── THE TIMING PROBLEM (and why this fix is needed) ────────────────────────
 *
 * `beforeinstallprompt` fires very early during page load — often before
 * React has mounted this component and attached its addEventListener.
 * When that happens, the event fires into the void, nobody catches it,
 * and the button never appears for that entire session.
 *
 * ── THE FIX ─────────────────────────────────────────────────────────────────
 *
 * We use a two-stage approach:
 *
 * Stage 1 — Global capture (in index.html <script> or main.jsx, runs first):
 *   window.addEventListener('beforeinstallprompt', (e) => {
 *     e.preventDefault();
 *     window.__pwaInstallPrompt = e;   // ← store on window immediately
 *   });
 *
 * Stage 2 — This component (runs after React mounts):
 *   On mount, check window.__pwaInstallPrompt immediately.
 *   Also keep the event listener as a fallback for slow networks where
 *   the event fires after React is ready.
 *
 * This guarantees the prompt is never missed regardless of timing.
 *
 * ── PLATFORM NOTES ──────────────────────────────────────────────────────────
 *
 * Android Chrome:  Full support — button appears, native install dialog shows.
 * iOS Safari:      No beforeinstallprompt. Button never shows on iOS.
 *                  iOS users must use Share → Add to Home Screen manually.
 * Desktop Chrome:  Works — shows install dialog.
 * Already installed: window.matchMedia standalone check hides the button.
 *
 * @file src/components/common/PWAInstallButton.jsx
 * @created March 4, 2026 - Session 18
 * @updated April 8, 2026 - Session 19: fixed beforeinstallprompt timing race
 */

import React, { useEffect, useState } from 'react';

export default function PWAInstallButton() {
  // Check if already running as installed PWA
  const [isInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  );

  // The deferred install prompt — captured globally before React mounted,
  // or caught by the listener below if React was ready in time.
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => window.__pwaInstallPrompt ?? null
  );

  useEffect(() => {
    if (isInstalled) return;

    // ── Stage 2: Fallback listener ─────────────────────────────────────────
    // Catches the event if React happened to mount before it fired.
    // Also fires if the user navigates away and back (re-eligibility).
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.__pwaInstallPrompt = event; // keep window in sync
      setDeferredPrompt(event);
      console.log('✅ PWAInstallButton: beforeinstallprompt captured');
    };

    const onAppInstalled = () => {
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      console.log('✅ PWA installed — hiding install button');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    // ── Stage 2b: Check window again after a short delay ──────────────────
    // Some browsers fire the event slightly after React mounts but before
    // our listener is registered. The global capture in index.html/main.jsx
    // handles this, but a 500ms re-check is belt-and-suspenders.
    const timer = setTimeout(() => {
      if (window.__pwaInstallPrompt && !deferredPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
      }
    }, 500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstalled]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isInstalled || !deferredPrompt) return null;

  const handleInstall = async () => {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log(outcome === 'accepted'
        ? '✅ User accepted PWA install'
        : 'ℹ️ User dismissed PWA install'
      );

      // Clear regardless of outcome — prompt can only be used once
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ PWA install failed:', error);
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      title="Install WorkLedger app on your device"
    >
      Install App
    </button>
  );
}
