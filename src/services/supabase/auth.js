/**
 * WorkLedger - Authentication Service
 * 
 * Complete authentication service for user signup, login, logout,
 * password reset, profile management, and session handling.
 * 
 * @module services/supabase/auth
 * @created January 29, 2026
 */

import { supabase } from './client';

/**
 * Authentication Service
 */
export class AuthService {
  /**
   * Sign up a new user
   * @param {Object} params - Signup parameters
   * @param {string} params.email - User email
   * @param {string} params.password - User password
   * @param {Object} params.metadata - Additional user metadata
   * @returns {Promise<Object>} Result object { success, user, error }
   */
  async signUp({ email, password, metadata = {} }) {
    try {
      console.log('🔐 Signing up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name || '',
            phone_number: metadata.phone_number || '',
            ...metadata
          }
        }
      });
      
      if (error) {
        console.error('❌ Signup error:', error);
        return {
          success: false,
          user: null,
          error: error.message
        };
      }
      
      console.log('✅ User signed up successfully:', data.user?.email);
      
      return {
        success: true,
        user: data.user,
        error: null
      };
    } catch (error) {
      console.error('❌ Signup exception:', error);
      return {
        success: false,
        user: null,
        error: error.message || 'An unexpected error occurred during signup'
      };
    }
  }
  
  /**
   * Sign in an existing user
   * @param {Object} params - Login parameters
   * @param {string} params.email - User email
   * @param {string} params.password - User password
   * @returns {Promise<Object>} Result object { success, user, session, error }
   */
  async signIn({ email, password }) {
    try {
      console.log('🔐 Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ Login error:', error);
        return {
          success: false,
          user: null,
          session: null,
          error: error.message
        };
      }
      
      console.log('✅ User signed in successfully:', data.user?.email);
      
      return {
        success: true,
        user: data.user,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('❌ Login exception:', error);
      return {
        success: false,
        user: null,
        session: null,
        error: error.message || 'An unexpected error occurred during login'
      };
    }
  }
  
  /**
   * Sign out current user
   * @returns {Promise<Object>} Result object { success, error }
   */
  async signOut() {
    try {
      console.log('🔐 Signing out user...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
      console.log('✅ User signed out successfully');
      
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('❌ Logout exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during logout'
      };
    }
  }
  
  /**
   * Get current authenticated user
   * @returns {Promise<Object|null>} Current user or null
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error getting current user:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('❌ Exception getting current user:', error);
      return null;
    }
  }
  
  /**
   * Get current session with timeout
   * @returns {Promise<Object|null>} Current session or null
   */
  async getCurrentSession() {
    try {
      console.log('🔍 getCurrentSession: Starting...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session check timed out after 3 seconds')), 3000);
      });
      
      // Race between actual call and timeout
      const { data: { session }, error } = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]);
      
      if (error) {
        console.error('❌ getCurrentSession: Error -', error);
        return null;
      }
      
      console.log('✅ getCurrentSession: Success', session ? 'Session found' : 'No session');
      return session;
    } catch (error) {
      console.error('❌ getCurrentSession: Exception -', error.message);
      return null;
    }
  }
  
  /**
   * Request password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Result object { success, error }
   */
  async resetPassword(email) {
    try {
      console.log('🔐 Requesting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error('❌ Password reset error:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
      console.log('✅ Password reset email sent');
      
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('❌ Password reset exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
  
  /**
   * Update password with reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result object { success, error }
   */
  async updatePassword(newPassword) {
    try {
      console.log('🔐 Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('❌ Password update error:', error);
        return {
          success: false,
          error: error.message
        };
      }
      
      console.log('✅ Password updated successfully');
      
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error('❌ Password update exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
  
  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Result object { success, data, error }
   */
  async updateProfile(userId, profileData) {
    try {
      console.log('🔐 Updating profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Profile update error:', error);
        return {
          success: false,
          data: null,
          error: error.message
        };
      }
      
      console.log('✅ Profile updated successfully');
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      console.error('❌ Profile update exception:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
  
  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User profile or null
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Profile might not exist yet for new users
        if (error.code === 'PGRST116') {
          return null;
        }
        
        console.error('❌ Error getting profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Exception getting profile:', error);
      return null;
    }
  }
  
  /**
   * Get user's organization memberships
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of organization memberships
   */
  async getUserOrganizations(userId) {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Error getting user organizations:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Exception getting user organizations:', error);
      return [];
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} True if authenticated
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }
  
  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Callback function (event, session) => {}
   * @returns {Object} Subscription object with unsubscribe method
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔐 Auth event: ${event}`);
        callback(event, session);
      }
    );
    
    return subscription;
  }
  
  /**
   * Refresh current session
   * @returns {Promise<Object>} Result object { success, session, error }
   */
  async refreshSession() {
    try {
      console.log('🔐 Refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh error:', error);
        return {
          success: false,
          session: null,
          error: error.message
        };
      }
      
      console.log('✅ Session refreshed successfully');
      
      return {
        success: true,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('❌ Session refresh exception:', error);
      return {
        success: false,
        session: null,
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export default
export default authService;
