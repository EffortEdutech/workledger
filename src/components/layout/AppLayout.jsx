/**
 * WorkLedger - App Layout Component
 * 
 * Enhanced main layout for authenticated pages with:
 * - Desktop: Sidebar navigation + Header
 * - Mobile: Header + Bottom navigation
 * - Responsive design
 * 
 * @module components/layout/AppLayout
 * @created January 29, 2026
 * @updated January 29, 2026 - Added Sidebar and BottomNav integration
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export function AppLayout({ children }) {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    console.log('🔐 AppLayout: Logging out...');
    const result = await logout();
    
    if (result.success) {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop Only */}
      <Sidebar isCollapsed={sidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile Logo (visible on mobile only) */}
              <div className="flex items-center md:hidden">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">W</span>
                </div>
                <span className="ml-2 text-lg font-bold text-gray-900">
                  WorkLedger
                </span>
              </div>

              {/* Desktop: Sidebar Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {/* User Info - Hidden on small mobile */}
                <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[150px]">
                  {profile?.full_name || user?.email}
                </span>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>

        {/* Footer - Hidden on mobile */}
        <footer className="hidden md:block border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-xs text-gray-500">
              © {new Date().getFullYear()} WorkLedger by Effort Edutech
            </p>
          </div>
        </footer>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
}

export default AppLayout;
