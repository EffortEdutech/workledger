/**
 * WorkLedger - Root Application Component
 * 
 * Main application component that provides routing and global context.
 * Wrapped with AuthProvider for authentication state management.
 * 
 * @file src/App.jsx
 * @created January 29, 2026
 * @updated January 29, 2026 - Added AuthProvider
 */

import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './context/AuthContext';

/**
 * Root App Component
 */
function App() {
  useEffect(() => {
    console.log('✅ App component mounted');
    
    // Log app information
    console.log('📱 WorkLedger - Contract-Aware Work Reporting Platform');
    console.log('🏢 Bina Jaya / Effort Edutech');
    console.log('📅 Build Date:', new Date().toISOString());
    
    // Check online status
    if (navigator.onLine) {
      console.log('🌐 Status: Online');
    } else {
      console.log('📡 Status: Offline (offline-first mode active)');
    }
    
    // Log feature flags
    const features = {
      offlineSync: import.meta.env.VITE_ENABLE_OFFLINE_SYNC === 'true',
      slaTracking: import.meta.env.VITE_ENABLE_SLA_TRACKING === 'true',
      photoUploads: import.meta.env.VITE_ENABLE_PHOTO_UPLOADS === 'true',
      pdfGeneration: import.meta.env.VITE_ENABLE_PDF_GENERATION === 'true',
    };
    
    console.log('🎛️ Feature Flags:', features);
    
    return () => {
      console.log('🔄 App component unmounting');
    };
  }, []);
  
  return (
    <AuthProvider>
      {/* Router Provider */}
      <RouterProvider router={router} />
      
      {/* Offline Indicator (will be enhanced in future sessions) */}
      {!navigator.onLine && (
        <div className="offline-indicator">
          📡 Offline Mode - Changes will sync when online
        </div>
      )}
    </AuthProvider>
  );
}

export default App;
