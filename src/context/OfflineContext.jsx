/**
 * WorkLedger — Offline Context
 *
 * Tracks online/offline status and drives the sync engine.
 * Mounted ONCE at the app root (see main.jsx).
 * Consumed via useOffline() hook from anywhere in the app.
 *
 * @module context/OfflineContext
 * @created March 4, 2026 — Session 18
 *
 * File destination: src/context/OfflineContext.jsx
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../services/offline/db';
import { syncService } from '../services/offline/syncService';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline]         = useState(navigator.onLine);
  const [syncStatus, setSyncStatus]     = useState('idle'); // 'idle' | 'syncing' | 'error'
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncing = useRef(false); // Prevent concurrent sync runs

  // Refresh the pending count badge from syncQueue
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await syncService.getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB not ready yet — ignore
    }
  }, []);

  // Kick off a full sync cycle
  const triggerSync = useCallback(async () => {
    if (isSyncing.current || !navigator.onLine) return;

    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      await syncService.sync();
      await refreshPendingCount();
      setSyncStatus('idle');
    } catch (error) {
      console.error('❌ OfflineContext sync error:', error);
      setSyncStatus('error');
    } finally {
      isSyncing.current = false;
    }
  }, [refreshPendingCount]);

  // Listen to browser online/offline events
  useEffect(() => {
    const goOnline = () => {
      console.log('🌐 Back online — triggering sync');
      setIsOnline(true);
      triggerSync();
    };
    const goOffline = () => {
      console.log('📡 Gone offline');
      setIsOnline(false);
      setSyncStatus('idle');
    };

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    refreshPendingCount(); // Initial count on mount

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [triggerSync, refreshPendingCount]);

  // Auto-sync on mount if we're already online
  useEffect(() => {
    if (navigator.onLine) triggerSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    isOnline,
    syncStatus,
    pendingCount,
    triggerSync,
    refreshPendingCount,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOfflineContext must be used inside <OfflineProvider>');
  return ctx;
}

export default OfflineContext;
