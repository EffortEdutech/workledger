/**
 * WorkLedger - Profile Page
 *
 * Allows any authenticated user to view and update their own profile:
 *   - Full name
 *   - Phone number
 *   - Avatar (future)
 *
 * Also shows:
 *   - Their email (read-only — managed by Supabase Auth)
 *   - Their platform role (read-only — managed by super_admin)
 *   - Their org memberships (read-only — managed by org admins)
 *
 * Accessible at: /profile
 * Visible to: all authenticated users regardless of role
 *
 * SESSION 19: New page. Linked from the header user area.
 *
 * @module pages/profile/ProfilePage
 * @created April 8, 2026 - Session 19
 */

import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { getRoleMeta } from '../../constants/permissions';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const { allOrgs, currentOrg } = useOrganization();

  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [formData,    setFormData]    = useState({
    full_name:    profile?.full_name    || '',
    phone_number: profile?.phone_number || '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleEdit = () => {
    // Reset form to current profile values when opening editor
    setFormData({
      full_name:    profile?.full_name    || '',
      phone_number: profile?.phone_number || '',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      const result = await updateProfile({
        full_name:    formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
      });

      if (!result.success) {
        showToast(result.error || 'Failed to update profile.', 'error');
        return;
      }

      setEditing(false);
      showToast('Profile updated successfully.');
    } catch {
      showToast('Unexpected error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initial    = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase();
  const globalRole = profile?.global_role;
  const roleMeta   = globalRole ? getRoleMeta(globalRole) : null;

  return (
    <AppLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your personal information
          </p>
        </div>

        {/* Avatar + Name card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl flex-shrink-0">
              {initial}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {profile?.full_name || <span className="text-gray-400 italic font-normal">No name set</span>}
              </h2>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              {roleMeta && (
                <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${roleMeta.badge}`}>
                  {roleMeta.label}
                </span>
              )}
            </div>

            {/* Edit button */}
            {!editing && (
              <button
                onClick={handleEdit}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="bg-white rounded-xl shadow p-6 space-y-5">
            <h3 className="text-base font-semibold text-gray-900">Edit Profile</h3>

            <div className="space-y-4">
              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="e.g. Ahmad bin Ibrahim"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={e => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="e.g. 012-3456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Email — read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                  <span className="ml-2 text-xs font-normal text-gray-400">(cannot be changed here)</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Account details — read-only */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Account Details</h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900 truncate ml-4">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="text-sm font-medium text-gray-900">
                {profile?.phone_number || <span className="text-gray-400 italic">Not set</span>}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Platform Role</span>
              <span className="text-sm font-medium text-gray-900">
                {roleMeta
                  ? <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleMeta.badge}`}>{roleMeta.label}</span>
                  : <span className="text-gray-400 italic">Regular user</span>
                }
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Member since</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Organisation access */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Organisation Access</h3>
          <p className="text-xs text-gray-400">
            Your org memberships are managed by your organisation administrator.
          </p>

          {allOrgs && allOrgs.length > 0 ? (
            <div className="space-y-2">
              {allOrgs.map(org => (
                <div
                  key={org.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                    currentOrg?.id === org.id
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    currentOrg?.id === org.id ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      currentOrg?.id === org.id ? 'text-primary-700' : 'text-gray-700'
                    }`}>
                      {org.name}
                    </p>
                  </div>
                  {currentOrg?.id === org.id && (
                    <span className="text-xs text-primary-600 font-medium flex-shrink-0">Active</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* No org state */
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-amber-800">No organisation access yet</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Your account is active but you haven&apos;t been added to an organisation.
                  Contact your WorkLedger administrator to get access.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
