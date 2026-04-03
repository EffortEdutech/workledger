/**
 * WorkLedger — PWA Install Button
 *
 * Shows a button only when the browser fires beforeinstallprompt.
 * Hidden when already installed.
 *
 * Chrome / Edge / Android:
 *   - Uses beforeinstallprompt
 *
 * iPhone / iPad Safari:
 *   - No beforeinstallprompt support
 *   - Show manual install help elsewhere:
 *     Safari → Share → Add to Home Screen
 *
 * @file src/components/common/PWAInstallButton.jsx
 * @created March 4, 2026
 */

import React, { useEffect, useState } from 'react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('✅ PWA installed');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isInstalled || !deferredPrompt) return null;

  const handleInstall = async () => {
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        console.log('✅ User accepted PWA install');
      } else {
        console.log('ℹ️ User dismissed PWA install');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('❌ PWA install failed:', error);
    }
  };

  return (
    <button
      onClick={handleInstall}
      className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      title="Install WorkLedger"
    >
      Install App
    </button>
  );
}
