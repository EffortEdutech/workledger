/**
 * WorkLedger - User List Page
 *
 * Org admins and owners manage their team here.
 * - Lists all members with role badges, status, join date
 * - Search by name / email
 * - Filter by role or active status
 * - Change Role (ChangeRoleModal)
 * - Deactivate / Reactivate
 * - Invite User button → /users/invite
 *
 * Visible to: org_owner, org_admin (NAV_USERS permission)
 * Actions gated by: MANAGE_ORG_USERS, CHANGE_USER_ROLES, INVITE_USERS
 *
 * @module pages/users/UserList
 * @created February 23, 2026 - Session 12
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import ChangeRoleModal from '../../components/users/ChangeRoleModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { userService } from '../../services/api/userService';
import { useOrganization } from '../../context/OrganizationContext';
import { useRole } from '../../hooks/useRole';
import { getRoleMeta, ROLE_META } from '../../constants/permissions';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// ─────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const meta = getRoleMeta(role);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />
      Inactive
    </span>
  );
}

function MemberAvatar({ name }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
      {initial}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

export default function UserList() {
  const navigate    = useNavigate();
  const { currentOrg } = useOrganization();
  const { can }     = useRole();

  // Data
  const [members,   setMembers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Filters
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'all' | 'active' | 'inactive'
  const [showFilters,  setShowFilters]  = useState(false);

  // Modals / actions
  const [roleModal,    setRoleModal]    = useState(null); // member object or null
  const [actionLoading, setActionLoading] = useState(null); // memberId being acted on

  // Toast
  const [toast, setToast] = useState(null);

  // ── Data loading ──────────────────────────────────────────

  const loadMembers = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getOrgMembers(currentOrg.id);
      setMembers(data);
    } catch (err) {
      console.error('❌ Failed to load members:', err);
      setError('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // ── Filtered list ─────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...members];

    if (statusFilter === 'active')   list = list.filter(m => m.is_active);
    if (statusFilter === 'inactive') list = list.filter(m => !m.is_active);

    if (roleFilter !== 'all') list = list.filter(m => m.role === roleFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        (m.user?.full_name || '').toLowerCase().includes(q) ||
        (m.user?.email     || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [members, search, roleFilter, statusFilter]);

  // ── Toast helper ──────────────────────────────────────────

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleRoleChanged = (memberId, newRole) => {
    setMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
    );
    setRoleModal(null);
    showToast(`Role updated to ${getRoleMeta(newRole).label}`);
  };

  const handleToggleActive = async (member) => {
    try {
      setActionLoading(member.id);
      const fn     = member.is_active
        ? userService.deactivateMember.bind(userService)
        : userService.reactivateMember.bind(userService);
      const result = await fn(currentOrg.id, member.id);

      if (!result.success) {
        showToast(result.error, 'error');
        return;
      }

      setMembers(prev =>
        prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m)
      );
      showToast(member.is_active ? 'Member deactivated' : 'Member reactivated');
    } catch (err) {
      showToast('Unexpected error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Role options for filter dropdown ─────────────────────

  const roleOptions = Object.entries(ROLE_META)
    .filter(([role]) => !['super_admin', 'bina_jaya_staff'].includes(role))
    .map(([role, meta]) => ({ value: role, label: meta.label }));

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'active' || search.trim();

  // ── Loading / error states ────────────────────────────────

  if (!currentOrg) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-gray-500">
          <p>Select an organization to manage users.</p>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <AppLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-green-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {currentOrg.name} &middot; {members.filter(m => m.is_active).length} active member{members.filter(m => m.is_active).length !== 1 ? 's' : ''}
            </p>
          </div>
          {can('INVITE_USERS') && (
            <button
              onClick={() => navigate('/users/invite')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <UserPlusIcon className="h-4 w-4" />
              Invite User
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status quick tabs */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {[['active', 'Active'], ['inactive', 'Inactive'], ['all', 'All']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-2 font-medium transition-colors ${
                    statusFilter === val
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
              {roleFilter !== 'all' && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">1</span>
              )}
            </button>
          </div>

          {/* Expanded role filter */}
          {showFilters && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Role:</label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All roles</option>
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('active'); }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500">
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          {hasActiveFilters ? ' (filtered)' : ''}
        </p>

        {/* Members table */}
        {filtered.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Joined
                  </th>
                  {(can('CHANGE_USER_ROLES') || can('MANAGE_ORG_USERS')) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(member => (
                  <tr
                    key={member.id}
                    className={`transition-colors ${member.is_active ? 'hover:bg-gray-50' : 'bg-gray-50/50 opacity-70'}`}
                  >
                    {/* Member info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={member.user?.full_name} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.user?.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <RoleBadge role={member.role} />
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <StatusBadge isActive={member.is_active} />
                    </td>

                    {/* Joined date */}
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    {(can('CHANGE_USER_ROLES') || can('MANAGE_ORG_USERS')) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {can('CHANGE_USER_ROLES') && member.is_active && (
                            <button
                              onClick={() => setRoleModal(member)}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                            >
                              Change Role
                            </button>
                          )}
                          {can('MANAGE_ORG_USERS') && (
                            <button
                              onClick={() => handleToggleActive(member)}
                              disabled={actionLoading === member.id}
                              className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                                member.is_active
                                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              } disabled:opacity-50`}
                            >
                              {actionLoading === member.id
                                ? '...'
                                : member.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-lg shadow text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-gray-900 font-medium mb-1">
              {hasActiveFilters ? 'No members match your filters' : 'No team members yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters.'
                : 'Invite your first team member to get started.'}
            </p>
            {!hasActiveFilters && can('INVITE_USERS') && (
              <button
                onClick={() => navigate('/users/invite')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <UserPlusIcon className="h-4 w-4" />
                Invite First Member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {roleModal && (
        <ChangeRoleModal
          member={roleModal}
          orgId={currentOrg.id}
          onSuccess={handleRoleChanged}
          onClose={() => setRoleModal(null)}
        />
      )}
    </AppLayout>
  );
}
