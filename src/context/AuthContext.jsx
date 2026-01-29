/**
 * WorkLedger - Authentication Context
 * 
 * Provides global authentication state and methods to all components.
 * Manages user session, loading states, and auth operations.
 * 
 * @module context/AuthContext
 * @created January 29, 2026
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/supabase/auth';
import { supabase } from '../services/supabase/client';

/**
 * Authentication Context
 */
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Wraps the application and provides auth state to all children.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  /**
   * Failsafe: Ensure loading becomes false after 5 seconds max
   */
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ AuthContext: Failsafe triggered - forcing loading=false after 5s');
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(failsafeTimer);
  }, [loading]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    console.log('🔐 AuthContext: Initializing...');
    
    let isMounted = true;
    let subscription = null;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext: Checking for existing session...');
        const currentSession = await authService.getCurrentSession();
        
        if (!isMounted) {
          console.log('⚠️ AuthContext: Component unmounted, aborting...');
          return;
        }
        
        if (currentSession) {
          console.log('✅ AuthContext: Session found', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Load user profile in background (non-blocking)
          console.log('🔄 AuthContext: Starting profile load...');
          authService.getUserProfile(currentSession.user.id)
            .then(userProfile => {
              if (!isMounted) {
                console.log('⚠️ AuthContext: Component unmounted during profile load...');
                return;
              }
              
              if (userProfile) {
                console.log('✅ AuthContext: Profile loaded', userProfile);
                setProfile(userProfile);
              } else {
                console.log('ℹ️ AuthContext: No profile found');
                setProfile(null);
              }
            })
            .catch(profileError => {
              console.error('❌ AuthContext: Profile load error (non-blocking):', profileError);
              if (isMounted) {
                setProfile(null);
              }
            });
        } else {
          console.log('ℹ️ AuthContext: No session found (user not logged in)');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ AuthContext: Init error:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          console.log('✅ AuthContext: Initialization complete, setting loading=false');
          setLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Subscribe to auth changes
    console.log('🔄 AuthContext: Setting up auth state listener...');
    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`🔐 AuthContext: Auth event - ${event}`, { hasSession: !!newSession });
        
        if (!isMounted) {
          console.log('⚠️ AuthContext: Component unmounted, ignoring auth event');
          return;
        }
        
        if (event === 'SIGNED_IN' && newSession) {
          console.log('✅ AuthContext: User signed in via event');
          setSession(newSession);
          setUser(newSession.user);
          setLoading(false); // Important: Set loading false immediately
          
          // Load profile in background (truly non-blocking - no await)
          console.log('🔄 AuthContext: Starting profile load in background...');
          authService.getUserProfile(newSession.user.id)
            .then(userProfile => {
              if (isMounted && userProfile) {
                console.log('✅ AuthContext: Profile loaded from event');
                setProfile(userProfile);
              } else {
                console.log('ℹ️ AuthContext: No profile found');
              }
            })
            .catch(error => {
              console.error('❌ AuthContext: Profile load error (non-blocking):', error);
            });
        } else if (event === 'SIGNED_OUT') {
          console.log('ℹ️ AuthContext: User signed out');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('🔄 AuthContext: Token refreshed');
          if (isMounted) {
            setSession(newSession);
          }
        }
      }
    );

    subscription = data.subscription;

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 AuthContext: Cleaning up subscription');
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  /**
   * Login user
   */
  const login = async (email, password) => {
    console.log('🔐 AuthContext: Logging in...', email);
    setLoading(true);

    try {
      const result = await authService.signIn({ email, password });

      if (result.success) {
        console.log('✅ AuthContext: Login successful');
        // State will be updated by onAuthStateChange
        return { success: true };
      } else {
        console.error('❌ AuthContext: Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (email, password, metadata = {}) => {
    console.log('🔐 AuthContext: Registering user...', email);
    setLoading(true);

    try {
      const result = await authService.signUp({ email, password, metadata });

      if (result.success) {
        console.log('✅ AuthContext: Registration successful');
        return { success: true, user: result.user };
      } else {
        console.error('❌ AuthContext: Registration failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    console.log('🔐 AuthContext: Logging out...');
    setLoading(true);

    try {
      const result = await authService.signOut();

      if (result.success) {
        console.log('✅ AuthContext: Logout successful');
        // State will be updated by onAuthStateChange
        return { success: true };
      } else {
        console.error('❌ AuthContext: Logout failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Logout exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request password reset
   */
  const resetPassword = async (email) => {
    console.log('🔐 AuthContext: Requesting password reset...', email);

    try {
      const result = await authService.resetPassword(email);

      if (result.success) {
        console.log('✅ AuthContext: Password reset email sent');
        return { success: true };
      } else {
        console.error('❌ AuthContext: Password reset failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Password reset exception:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Update password
   */
  const updatePassword = async (newPassword) => {
    console.log('🔐 AuthContext: Updating password...');

    try {
      const result = await authService.updatePassword(newPassword);

      if (result.success) {
        console.log('✅ AuthContext: Password updated');
        return { success: true };
      } else {
        console.error('❌ AuthContext: Password update failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Password update exception:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (profileData) => {
    console.log('🔐 AuthContext: Updating profile...');

    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const result = await authService.updateProfile(user.id, profileData);

      if (result.success) {
        console.log('✅ AuthContext: Profile updated');
        setProfile(result.data);
        return { success: true, data: result.data };
      } else {
        console.error('❌ AuthContext: Profile update failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Profile update exception:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Context value
   */
  const value = {
    // State
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,

    // Methods
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * 
 * Access authentication state and methods from any component.
 * 
 * @returns {Object} Authentication context
 * @throws {Error} If used outside AuthProvider
 * 
 * @example
 * function MyComponent() {
 *   const { user, login, logout, loading } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       {user ? (
 *         <>
 *           <p>Welcome {user.email}</p>
 *           <button onClick={logout}>Logout</button>
 *         </>
 *       ) : (
 *         <button onClick={() => login(email, password)}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
