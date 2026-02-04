/**
 * WorkLedger - App Layout Component
 * 
 * Enhanced main layout for authenticated pages with:
 * - Desktop: Sidebar navigation + Header + Breadcrumb
 * - Mobile: Header + Bottom navigation + Breadcrumb
 * - Responsive design
 * - Uses React Router Outlet for nested routes
 * 
 * @module components/layout/AppLayout
 * @created January 29, 2026
 * @updated February 1, 2026 - Session 13: Changed to use Outlet for proper nested routing
 */

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Breadcrumb from '../common/Breadcrumb';

export function AppLayout() {
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
              </div>

              {/* Desktop: Sidebar Toggle (optional future feature) */}
              <div className="hidden md:flex items-center">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

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
            {/* Breadcrumb Navigation */}
            <Breadcrumb />
            
            {/* Page Content - Rendered from nested routes */}
            <Outlet />
          </div>
        </main>

        {/* Footer - Hidden on mobile */}
        <footer className="hidden md:block border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-xs text-gray-500">
              © {new Date().getFullYear()} WorkLedger by Bina Jaya / Effort Edutech
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
