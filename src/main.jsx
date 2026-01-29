/**
 * WorkLedger - Main Entry Point
 * 
 * Bootstraps the React application with strict mode and styles.
 * 
 * @file src/main.jsx
 * @created January 29, 2026
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import styles
import './styles/index.css';
import './styles/custom.css';

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Check your index.html file.');
}

// Log app initialization
console.log('🚀 WorkLedger initializing...');
console.log(`📦 Version: ${import.meta.env.VITE_APP_VERSION || '1.0.0'}`);
console.log(`🌍 Environment: ${import.meta.env.VITE_APP_ENV || 'development'}`);
console.log(`🔧 Node Environment: ${import.meta.env.MODE}`);

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log successful mount
console.log('✅ WorkLedger mounted successfully');

// Register service worker (if in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Detect online/offline status
window.addEventListener('online', () => {
  console.log('🌐 App is online');
  // You can dispatch an event or update global state here
});

window.addEventListener('offline', () => {
  console.log('📡 App is offline');
  // You can dispatch an event or update global state here
});

// Log initial online status
console.log(`🌐 Initial online status: ${navigator.onLine ? 'Online' : 'Offline'}`);

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('❌ Global error caught:', event.error);
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});
